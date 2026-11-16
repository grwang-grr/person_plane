import json
import sqlite3
from zipfile import ZipFile

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import connection
from django.db.models.deletion import ProtectedError
from django.test import Client
from django.utils import timezone

from plane.db.models import Issue, Project, Workspace
from plane.personal.backup import create_backup
from plane.personal.identity import bootstrap_identity
from plane.personal.models import Problem, ProblemAttachment

BASE = "/api/personal/problems/"


@pytest.fixture
def context(db):
    user, workspace = bootstrap_identity()
    project = Project.objects.create(workspace=workspace, name="测试项目", identifier="TEST")
    second = Project.objects.create(workspace=workspace, name="另一个项目", identifier="OTHER")
    task = Issue.objects.create(workspace=workspace, project=project, name="测试任务")
    return Client(), workspace, project, second, task, user


def create(client, **data):
    response = client.post(BASE, {"title": "问题测试", **data}, content_type="application/json")
    assert response.status_code == 201, response.content
    return response.json()


def update(client, problem, **data):
    return client.patch(
        f"{BASE}{problem['id']}/", {"revision": problem["revision"], **data}, content_type="application/json"
    )


def test_independent_crud_defaults_and_stable_numbers(context):
    client, *_ = context
    first = create(client, title="  自行填写 English  ", labels=["附件", "附件"], description_html="<p>说明</p>")
    assert first["title"] == "自行填写 English"
    assert first["project"] is None and first["task"] is None
    assert (first["priority"], first["severity"], first["status"]) == ("medium", "unknown", "open")
    assert first["labels"] == ["附件"]
    assert update(client, first, title="修改标题").status_code == 200
    assert update(client, first, title="旧页面覆盖").status_code == 409
    current = client.get(f"{BASE}{first['id']}/").json()
    response = client.delete(
        f"{BASE}{first['id']}/", {"revision": current["revision"]}, content_type="application/json"
    )
    assert response.status_code == 204
    assert client.get(f"{BASE}{first['id']}/").status_code == 404
    assert client.get(BASE).json()["total"] == 0
    trash = client.get(BASE + "?view=trash").json()["results"][0]
    second = create(client)
    assert second["number"] != first["number"]
    restored = client.post(
        f"{BASE}{first['id']}/restore/", {"revision": trash["revision"]}, content_type="application/json"
    )
    assert restored.status_code == 200
    assert restored.json()["number"] == first["number"]


def test_task_autoproject_cross_project_validation_and_moves(context):
    client, workspace, project, second, task, _ = context
    problem = create(client, task_id=str(task.id))
    assert problem["project"]["id"] == str(project.id)
    assert update(client, problem, project_id=str(second.id)).status_code == 400
    assert Problem.objects.get(pk=problem["id"]).project_id == project.id
    # Upstream moves may use QuerySet.update instead of model.save.
    Issue.all_objects.filter(pk=task.id).update(project_id=second.id)
    refreshed = client.get(f"{BASE}{problem['id']}/").json()
    assert refreshed["project"]["id"] == str(second.id)
    assert refreshed["revision"] > problem["revision"]
    assert any(e["text"] == "任务移动后同步关联项目" for e in refreshed["entries"])
    other_workspace = Workspace.objects.create(name="其他工作空间", slug="other", owner=workspace.owner)
    foreign = Project.objects.create(workspace=other_workspace, name="其他空间项目", identifier="FOREIGN")
    assert update(client, refreshed, task_id=None, project_id=str(foreign.id)).status_code == 400


def test_inactive_relations_preserved_and_new_links_rejected(context):
    client, _, project, _, task, _ = context
    problem = create(client, task_id=str(task.id))
    task.delete()
    assert Problem.objects.get(pk=problem["id"]).deleted_at is None
    Project.all_objects.filter(pk=project.id).update(archived_at=timezone.now(), deleted_at=timezone.now())
    assert create(client)["project"] is None
    assert (
        client.post(BASE, {"title": "无效关联", "task_id": str(task.id)}, content_type="application/json").status_code
        == 400
    )
    assert update(client, problem, title="保留原关联更新标题").status_code == 200
    detail = client.get(f"{BASE}{problem['id']}/").json()
    assert detail["project"]["deleted"] and detail["task"]["deleted"]
    with pytest.raises(ProtectedError):
        Issue.all_objects.filter(pk=task.id).delete()


def test_close_requires_resolution_and_reopen_retains_history(context):
    client, *_ = context
    problem = create(client)
    assert update(client, problem, status="closed").status_code == 400
    assert Problem.objects.get(pk=problem["id"]).status == "open"
    closed = update(client, problem, status="closed", resolution="已验证修复").json()
    assert closed["closed_at"]
    reopened = update(client, closed, status="open").json()
    assert reopened["closed_at"] is None and reopened["resolution"] == "已验证修复"
    assert len(reopened["entries"]) == 3
    entry = client.post(f"{BASE}{problem['id']}/entries/", {"text": "补充调查"}, content_type="application/json")
    assert entry.status_code == 201 and entry.json()["entries"][0]["text"] == "补充调查"
    assert (
        client.post(f"{BASE}{problem['id']}/entries/", {"text": " "}, content_type="application/json").status_code
        == 400
    )


def test_filters_ordering_search_and_validation(context):
    client, _, project, _, task, _ = context
    low = create(client, title="低优先级", priority="low", severity="critical")
    urgent = create(client, title="应优先展示", priority="urgent", task_id=str(task.id), labels=["筛选标签"])
    create(client, title="独立问题")
    assert client.get(BASE).json()["results"][0]["id"] == urgent["id"]
    assert client.get(BASE + "?view=important").json()["total"] == 2
    assert client.get(BASE, {"q": low["number"]}).json()["results"][0]["id"] == low["id"]
    assert client.get(BASE, {"project": str(project.id), "label": "筛选标签"}).json()["total"] == 1
    assert client.get(BASE, {"task": str(task.id)}).json()["total"] == 1
    assert client.get(BASE, {"project": "none"}).json()["total"] == 2
    for params in ({"project": "bad"}, {"priority": "bad"}, {"page": "bad"}, {"order": "title; DROP TABLE"}):
        assert client.get(BASE, params).status_code == 400
    for data in ({"title": " "}, {"title": "长" * 201}, {"priority": "bad"}):
        assert client.post(BASE, data, content_type="application/json").status_code == 400
    sanitized = create(client, description_html='<p onclick="bad()">安全<script>alert(1)</script></p>')
    assert "script" not in sanitized["description_html"] and "onclick" not in sanitized["description_html"]


def test_options_only_include_available_local_tasks(context):
    client, _, project, _, task, _ = context
    Issue.objects.create(project=project, workspace=project.workspace, name="草稿", is_draft=True)
    options = client.get(BASE + "options/", {"q": "测试任务"}).json()
    assert [t["id"] for t in options["tasks"]] == [str(task.id)]
    Issue.all_objects.filter(pk=task.id).update(archived_at=timezone.localdate())
    assert client.get(BASE + "options/").json()["tasks"] == []


def test_csrf_required_on_problem_writes(context):
    client = Client(enforce_csrf_checks=True)
    assert client.post(BASE, {"title": "拒绝无凭证写入"}, content_type="application/json").status_code == 403
    bootstrap = client.get("/api/personal/bootstrap/").json()
    assert (
        client.post(
            BASE, {"title": "通过校验"}, content_type="application/json", HTTP_X_CSRFTOKEN=bootstrap["csrf_token"]
        ).status_code
        == 201
    )


def test_attachments_download_scope_and_soft_removal(context, settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path / "attachments"
    client, *_ = context
    first, second = create(client), create(client)
    response = client.post(
        f"{BASE}{first['id']}/attachments/",
        {"file": SimpleUploadedFile("说明.txt", b"test attachment", content_type="text/plain")},
    )
    assert response.status_code == 201, response.content
    attachment = response.json()["attachments"][0]
    url = f"{BASE}{first['id']}/attachments/{attachment['id']}/"
    download = client.get(url)
    assert b"".join(download.streaming_content) == b"test attachment"
    assert download["Content-Disposition"].startswith("attachment;")
    assert client.get(f"{BASE}{second['id']}/attachments/{attachment['id']}/").status_code == 404
    assert client.delete(url).status_code == 200
    assert client.get(url).status_code == 404
    record = ProblemAttachment.objects.get(pk=attachment["id"])
    assert (settings.MEDIA_ROOT / record.key).is_file()


@pytest.mark.django_db(transaction=True)
def test_consistent_backup_contains_problem_rows_and_attachments(settings, tmp_path):
    bootstrap_identity()
    root = tmp_path / "data"
    for name in ("database", "backups", "attachments"):
        (root / name).mkdir(parents=True, exist_ok=True)
    settings.MEDIA_ROOT = root / "attachments"
    client = Client()
    problem = create(client, title="备份测试问题")
    assert (
        client.post(
            f"{BASE}{problem['id']}/attachments/", {"file": SimpleUploadedFile("proof.txt", b"backup proof")}
        ).status_code
        == 201
    )
    database = root / "database/plane-personal.sqlite3"
    with sqlite3.connect(database) as copied:
        connection.connection.backup(copied)
    settings.DATA_ROOT = root
    settings.DATABASES = {"default": {"NAME": str(database)}}
    backup = create_backup()
    with ZipFile(backup) as archive:
        assert any(name.startswith("attachments/problems/") for name in archive.namelist())
        manifest = json.loads(archive.read("manifest.json"))
        assert "database/plane-personal.sqlite3" in manifest["files"]
        restored = tmp_path / "restored.sqlite3"
        restored.write_bytes(archive.read("database/plane-personal.sqlite3"))
    with sqlite3.connect(restored) as db:
        assert db.execute("select title from personal_problem").fetchone()[0] == "备份测试问题"
        assert db.execute("pragma integrity_check").fetchone()[0] == "ok"

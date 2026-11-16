import io
import json
import sqlite3
from uuid import uuid4

import pytest
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import models
from django.test import Client

from plane.db.models import DraftIssue, Issue, IssueSequence, Project, Sticky
from plane.personal.fields import ArrayAgg, ArrayField
from plane.personal.identity import bootstrap_identity
from plane.personal.importer import import_legacy
from plane.personal.models import LegacyRecord
from plane.personal.storage import LocalStorage, asset_path


@pytest.fixture
def local(db):
    return bootstrap_identity()


@pytest.fixture
def source(tmp_path):
    path = tmp_path / "legacy.sqlite3"
    project, parent, child, draft, sticky = [str(uuid4()) for _ in range(5)]
    now = "2026-11-01 12:00:00.000000"
    with sqlite3.connect(path) as db:
        db.executescript("""
            CREATE TABLE projects(
                id TEXT, name TEXT, identifier TEXT, description TEXT, next_number INTEGER,
                created_at TEXT, updated_at TEXT);
            CREATE TABLE work_items(
                id TEXT, project_id TEXT, title TEXT, description TEXT, is_draft INTEGER, deleted INTEGER,
                number INTEGER, state TEXT, priority TEXT, start_date TEXT, due_date TEXT, tags TEXT,
                parent_id TEXT, assigned_to_me INTEGER, subscribed INTEGER, created_at TEXT, updated_at TEXT);
            CREATE TABLE stickies(
                id TEXT, title TEXT, content TEXT, color TEXT, tags TEXT, deleted INTEGER,
                created_at TEXT, updated_at TEXT);
            CREATE TABLE activities(id TEXT, entity_type TEXT, entity_id TEXT, action TEXT);
            CREATE TABLE local_profile(id TEXT, name TEXT, handle TEXT, timezone TEXT, avatar_color TEXT);
            CREATE TABLE recents(id TEXT, entity_type TEXT, entity_id TEXT, created_at TEXT, updated_at TEXT);
        """)
        db.execute("INSERT INTO projects VALUES(?,?,?,?,?,?,?)", (project, "测试项目", "TEST", "说明", 15, now, now))
        for item, number, is_draft, parent_id, deleted in [
            (parent, 3, 0, None, 0),
            (child, 7, 0, parent, 1),
            (draft, None, 1, parent, 0),
        ]:
            db.execute(
                "INSERT INTO work_items VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (
                    item,
                    project,
                    "任务",
                    "<script>安全文本</script>\n第二段",
                    is_draft,
                    deleted,
                    number,
                    "started",
                    "high",
                    "2026-11-01",
                    "2026-11-20",
                    '["标签"]',
                    parent_id,
                    1,
                    1,
                    now,
                    now,
                ),
            )
        db.execute(
            "INSERT INTO stickies VALUES(?,?,?,?,?,?,?,?)", (sticky, "备忘", "内容", "purple", '["个人"]', 0, now, now)
        )
        db.execute(
            "INSERT INTO local_profile VALUES(?,?,?,?,?)", ("local", "我的名字", "me", "Asia/Shanghai", "#b95200")
        )
        db.execute("INSERT INTO activities VALUES(?,?,?,?)", (str(uuid4()), "project", project, "created"))
        db.execute("INSERT INTO recents VALUES(?,?,?,?,?)", (str(uuid4()), "project", project, now, now))
    return path, (project, parent, child, draft, sticky)


@pytest.mark.django_db
def test_import_preserves_ids_relationships_history_and_reserved_numbers(source):
    path, (project_id, parent_id, child_id, draft_id, sticky_id) = source
    report = import_legacy(path)
    assert report["counts"]["work_items"] == 3
    parent = Issue.objects.get(pk=parent_id)
    assert parent.sequence_id == 3
    assert "&lt;script&gt;" in parent.description_html
    assert list(parent.labels.values_list("name", flat=True)) == ["标签"]
    assert parent.assignees.count() == 1
    assert parent.issue_subscribers.count() == 1
    assert str(DraftIssue.objects.get(pk=draft_id).parent_id) == parent_id
    assert str(Issue.all_objects.get(pk=child_id).parent_id) == parent_id
    assert not Issue.objects.filter(pk=child_id).exists()
    assert Sticky.objects.get(pk=sticky_id).name == "备忘"
    assert LegacyRecord.objects.get(source_table="activities").payload["action"] == "created"
    assert parent.created_at.isoformat().startswith("2026-11-01T12:00:00")
    next_item = Issue.objects.create(project_id=project_id, name="继续编号")
    assert next_item.sequence_id == 15
    assert import_legacy(path)["already_imported"] is True
    assert IssueSequence.objects.filter(project_id=project_id).count() == 4
    with sqlite3.connect(path) as connection:
        connection.execute("UPDATE projects SET name='变化'")
    with pytest.raises(ValueError, match="发生变化"):
        import_legacy(path)


@pytest.mark.django_db
def test_import_rolls_back_every_table_on_unsupported_parent(source):
    path, (_, parent, _, draft, _) = source
    with sqlite3.connect(path) as connection:
        connection.execute("UPDATE work_items SET parent_id=? WHERE id=?", (draft, parent))
    with pytest.raises(ValueError, match="父任务"):
        import_legacy(path)
    assert Project.objects.count() == 0
    assert LegacyRecord.objects.count() == 0


def test_array_validation_retains_element_and_size_rules():
    field = ArrayField(models.URLField(), size=1)
    with pytest.raises(ValidationError):
        field.clean(["invalid"], None)
    with pytest.raises(ValidationError):
        field.clean(["https://example.com", "https://example.org"], None)


@pytest.mark.django_db
def test_sqlite_array_aggregation_restores_uuids_and_respects_distinct(local):
    _, workspace = local
    first = Project.objects.create(workspace=workspace, name="甲", identifier="A")
    Project.objects.create(workspace=workspace, name="乙", identifier="B")
    result = Project.objects.aggregate(ids=ArrayAgg("id", distinct=True))
    assert first.id in result["ids"]
    assert len(result["ids"]) == 2


@pytest.mark.django_db
def test_local_identity_preserves_csrf_and_denies_network_access(local):
    cache.clear()
    client = Client(enforce_csrf_checks=True)
    assert client.get("/api/users/me/").status_code == 200
    assert client.get("/api/users/me/", REMOTE_ADDR="192.168.1.2").status_code == 403
    assert client.post("/api/personal/backups/").status_code == 403
    assert (
        client.patch(
            "/api/users/me/", data=json.dumps({"first_name": "新名字"}), content_type="application/json"
        ).status_code
        == 403
    )
    assert client.get("/api/personal/bootstrap/").status_code == 200
    token = client.cookies["csrftoken"].value
    assert (
        client.patch(
            "/api/users/me/",
            data=json.dumps({"first_name": "新名字"}),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=token,
        ).status_code
        == 200
    )
    assert client.get("/auth/sign-in/").status_code == 404


@pytest.mark.django_db
def test_signed_upload_download_and_path_boundaries(local, settings, tmp_path):
    from django.core.files.uploadedfile import SimpleUploadedFile

    settings.MEDIA_ROOT = tmp_path / "attachments"
    client = Client(enforce_csrf_checks=True)
    storage = LocalStorage()
    policy = storage.generate_presigned_post("project/测试.txt", "text/plain", 6)

    def upload(content, **overrides):
        return client.post(
            policy["url"],
            {
                **policy["fields"],
                **overrides,
                "file": SimpleUploadedFile("测试.txt", content, content_type="text/plain"),
            },
        )

    assert upload(b"1234567").status_code == 400
    assert not asset_path("project/测试.txt").exists()
    assert upload(b"hello", token="tampered").status_code == 403
    assert upload(b"hello").status_code == 204
    assert upload(b"again").status_code == 400
    response = client.get(
        storage.generate_presigned_url("project/测试.txt", filename="测试.txt", content_type="text/html")
    )
    assert response.status_code == 200
    assert b"".join(response.streaming_content) == b"hello"
    assert response["Content-Disposition"].startswith("attachment;")
    assert storage.get_object_metadata("project/测试.txt")["ContentLength"] == 5
    for key in ("../outside", "C:/outside", "folder\\outside", "/absolute"):
        with pytest.raises(ValueError):
            asset_path(key)
    storage.upload_file(io.BytesIO(b"copy"), "original.txt")
    storage.copy_object("original.txt", "copy.txt")
    assert asset_path("copy.txt").read_bytes() == b"copy"

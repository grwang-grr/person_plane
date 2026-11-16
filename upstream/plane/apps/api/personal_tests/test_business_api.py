import pytest
from django.test import Client

from plane.db.models import Issue, IssueActivity, State
from plane.personal.identity import bootstrap_identity


@pytest.fixture
def client(db):
    bootstrap_identity()
    client = Client(enforce_csrf_checks=True)
    bootstrap = client.get("/api/personal/bootstrap/")
    client.defaults["HTTP_X_CSRFTOKEN"] = bootstrap.json()["csrf_token"]
    assert client.cookies["csrftoken"]["httponly"]
    return client


@pytest.mark.django_db
def test_original_project_task_and_aggregation_endpoints(client):
    root = "/api/workspaces/personal/"
    response = client.post(
        root + "projects/", {"name": "本地项目", "identifier": "LOCAL"}, content_type="application/json"
    )
    assert response.status_code == 201, response.content
    project_id = response.json()["id"]
    project = root + f"projects/{project_id}/"
    response = client.post(project + "issues/", {"name": "原版任务"}, content_type="application/json")
    assert response.status_code == 201, response.content
    issue_id = response.json()["id"]
    assert IssueActivity.objects.filter(issue_id=issue_id).exists()
    completed = State.objects.get(project_id=project_id, group="completed")
    response = client.patch(
        project + f"issues/{issue_id}/", {"state": str(completed.id)}, content_type="application/json"
    )
    assert response.status_code == 204, response.content
    assert Issue.objects.get(pk=issue_id).completed_at is not None
    for path in ("issues/", f"issues/list/?issues={issue_id}", "cycles/", "modules/"):
        response = client.get(project + path)
        assert response.status_code == 200, (path, response.content)
    assert client.get(root + "projects/").status_code == 200
    assert client.get("/api/users/me/workspaces/").status_code == 200
    for resource in ("cycles", "modules", "pages"):
        response = client.post(project + resource + "/", {"name": f"测试{resource}"}, content_type="application/json")
        assert response.status_code == 201, (resource, response.content)
        response = client.get(project + resource + "/")
        assert response.status_code == 200, (resource, response.content)
    response = client.post(
        root + "draft-issues/", {"name": "草稿", "project_id": project_id}, content_type="application/json"
    )
    assert response.status_code == 201, response.content
    draft_id = response.json()["id"]
    assert client.get(root + "draft-issues/").status_code == 200
    response = client.post(root + f"draft-to-issue/{draft_id}/", {"name": "发布草稿"}, content_type="application/json")
    assert response.status_code == 201, response.content
    response = client.post(
        root + "stickies/", {"name": "便签", "description_html": "<p>内容</p>"}, content_type="application/json"
    )
    assert response.status_code == 201, response.content
    assert client.get(root + "stickies/").status_code == 200


@pytest.mark.django_db
def test_original_avatar_storage_contract_uses_local_directory(client, settings, tmp_path):
    import base64

    from django.core.files.uploadedfile import SimpleUploadedFile
    from plane.db.models import FileAsset, User
    from plane.personal.identity import LOCAL_USER_ID

    settings.MEDIA_ROOT = tmp_path / "attachments"
    picture = base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6fS8AAAAASUVORK5CYII="
    )
    response = client.post(
        "/api/assets/v2/user-assets/",
        {
            "name": "头像.png",
            "type": "image/png",
            "size": len(picture),
            "entity_type": "USER_AVATAR",
        },
        content_type="application/json",
    )
    assert response.status_code == 200, response.content
    asset = response.json()
    policy = asset["upload_data"]
    response = client.post(
        policy["url"],
        {
            **policy["fields"],
            "file": SimpleUploadedFile("头像.png", picture, content_type="image/png"),
        },
    )
    assert response.status_code == 204, response.content
    response = client.patch(f"/api/assets/v2/user-assets/{asset['asset_id']}/", {}, content_type="application/json")
    assert response.status_code == 204, response.content
    assert str(User.objects.get(pk=LOCAL_USER_ID).avatar_asset_id) == asset["asset_id"]
    stored = FileAsset.objects.get(pk=asset["asset_id"])
    assert stored.is_uploaded
    assert (settings.MEDIA_ROOT / stored.asset.name).read_bytes() == picture
    response = client.get(asset["asset_url"], follow=True)
    assert response.status_code == 200, response.content if not response.streaming else "stream"
    assert b"".join(response.streaming_content) == picture

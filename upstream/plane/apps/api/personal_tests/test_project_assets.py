# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""项目介绍图片上传与回显链路的回归测试。"""

import base64

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client

from plane.db.models import FileAsset, Project, ProjectMember
from plane.personal.identity import bootstrap_identity

ADMIN = 20

PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8AAAwAB/AF+g7oAAAAASUVORK5CYII="
)


@pytest.fixture
def context(db):
    user, workspace = bootstrap_identity()
    project = Project.objects.create(workspace=workspace, name="图床验证", identifier="IMG")
    ProjectMember.objects.create(workspace=workspace, project=project, member=user, role=ADMIN)
    return Client(), workspace, user, project


def test_project_description_image_upload_roundtrip(context):
    client, workspace, _user, project = context
    asset_url = f"/api/assets/v2/workspaces/{workspace.slug}/projects/{project.id}/"

    resp = client.post(
        asset_url,
        {
            "name": "probe.png",
            "type": "image/png",
            "size": len(PNG),
            "entity_identifier": str(project.id),
            "entity_type": "PROJECT_DESCRIPTION",
        },
        content_type="application/json",
    )
    assert resp.status_code == 200, resp.content
    data = resp.json()
    assert data["upload_data"]["url"] == "/local-assets/upload/"
    assert FileAsset.objects.filter(pk=data["asset_id"]).exists()

    # 用后端签发的凭证把文件写进本地附件目录。
    upload = SimpleUploadedFile("probe.png", PNG, content_type="image/png")
    resp = client.post(
        data["upload_data"]["url"],
        {"key": data["upload_data"]["fields"]["key"], "token": data["upload_data"]["fields"]["token"], "file": upload},
    )
    assert resp.status_code == 204, resp.content

    # 前端上传完成后会 PATCH 标记已上传，未标记的资产读取会被拒绝。
    resp = client.patch(f"{asset_url}{data['asset_id']}/", {}, content_type="application/json")
    assert resp.status_code == 204, resp.content

    # 读取资产：内联图片应以图片类型直接返回，浏览器才能显示。
    resp = client.get(f"{asset_url}{data['asset_id']}/", follow=True)
    assert resp.status_code == 200, resp.content
    assert resp["Content-Type"].startswith("image/png")
    assert "inline" in resp.get("Content-Disposition", "")


def test_diary_description_image_upload_roundtrip(context):
    client, workspace, _user, _project = context
    resp = client.post(
        f"/api/workspaces/{workspace.slug}/diaries/",
        {"diary_date": "2026-02-16", "diary_type": "daily", "title": "带图日记"},
        content_type="application/json",
    )
    assert resp.status_code == 201, resp.content
    diary_id = resp.json()["id"]

    asset_url = f"/api/assets/v2/workspaces/{workspace.slug}/"
    resp = client.post(
        asset_url,
        {
            "name": "probe.png",
            "type": "image/png",
            "size": len(PNG),
            "entity_identifier": diary_id,
            "entity_type": "DIARY_DESCRIPTION",
        },
        content_type="application/json",
    )
    assert resp.status_code == 200, resp.content
    data = resp.json()

    upload = SimpleUploadedFile("probe.png", PNG, content_type="image/png")
    resp = client.post(
        data["upload_data"]["url"],
        {"key": data["upload_data"]["fields"]["key"], "token": data["upload_data"]["fields"]["token"], "file": upload},
    )
    assert resp.status_code == 204, resp.content
    resp = client.patch(f"{asset_url}{data['asset_id']}/", {}, content_type="application/json")
    assert resp.status_code == 204, resp.content

    resp = client.get(f"{asset_url}{data['asset_id']}/", follow=True)
    assert resp.status_code == 200, resp.content
    assert resp["Content-Type"].startswith("image/png")
    assert "inline" in resp.get("Content-Disposition", "")

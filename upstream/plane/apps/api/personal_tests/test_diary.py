# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""日记与计划模块的回归测试。"""

import pytest
from django.test import Client

from plane.db.models import Diary, DiaryLink, Plan, PlanOccurrence
from plane.personal.identity import bootstrap_identity

BASE = "/api/workspaces/personal/"


@pytest.fixture
def context(db):
    user, workspace = bootstrap_identity()
    return Client(), workspace, user


def test_diary_list_and_primary_toggle(context):
    client, workspace, user = context

    # 当天第一篇默认成为主日记。
    resp = client.post(
        f"{BASE}diaries/",
        {"title": "第一篇", "diary_type": "daily", "diary_date": "2026-02-16"},
        content_type="application/json",
    )
    assert resp.status_code == 201, resp.content
    first = resp.json()
    assert first["is_primary"] is True

    resp = client.post(
        f"{BASE}diaries/",
        {"title": "第二篇", "diary_type": "daily", "diary_date": "2026-02-16"},
        content_type="application/json",
    )
    second = resp.json()
    assert second["is_primary"] is False

    # 手动设第二篇为主日记，第一篇自动降级。
    resp = client.post(f"{BASE}diaries/{second['id']}/set-primary/", {}, content_type="application/json")
    assert resp.status_code == 200
    assert resp.json()["is_primary"] is True

    assert Diary.objects.get(id=first["id"]).is_primary is False
    assert Diary.objects.filter(diary_date="2026-02-16", is_primary=True).count() == 1


def test_diary_markdown_content(context):
    client, workspace, user = context
    resp = client.post(
        f"{BASE}diaries/",
        {
            "title": "Markdown 日记",
            "diary_type": "daily",
            "diary_date": "2026-02-16",
            "description_md": "# 标题\n\n- 事项一\n- 事项二",
        },
        content_type="application/json",
    )
    assert resp.status_code == 201, resp.content
    diary_id = resp.json()["id"]
    assert resp.json()["description_md"].startswith("# 标题")

    # 正文以 Markdown 为准，stripped 同步用于列表搜索。
    resp = client.patch(
        f"{BASE}diaries/{diary_id}/",
        {"description_md": "更新后的 Markdown 内容"},
        content_type="application/json",
    )
    assert resp.status_code == 200
    diary = Diary.objects.get(id=diary_id)
    assert diary.description_md == "更新后的 Markdown 内容"
    assert diary.description_stripped == "更新后的 Markdown 内容"

    # 列表搜索命中 Markdown 正文。
    resp = client.get(f"{BASE}diaries/?query=Markdown")
    assert resp.status_code == 200
    assert resp.json()["total_count"] >= 1


def test_diary_link_bidirectional_independent(context):
    client, workspace, user = context

    diary_a = Diary.objects.create(workspace=workspace, owner=user, title="A", diary_date="2026-02-16", is_primary=True)
    diary_b = Diary.objects.create(workspace=workspace, owner=user, title="B", diary_date="2026-02-15")
    diary_c = Diary.objects.create(workspace=workspace, owner=user, title="C", diary_date="2026-02-14")
    diary_d = Diary.objects.create(workspace=workspace, owner=user, title="D", diary_date="2026-02-13")

    def link(source, target):
        resp = client.post(
            f"{BASE}diaries/{source.id}/links/",
            {"target_type": "diary", "target_id": str(target.id)},
            content_type="application/json",
        )
        assert resp.status_code == 201, resp.content
        return resp.json()

    # A 关联 B、C。
    link(diary_a, diary_b)
    link(diary_a, diary_c)
    # B 另外关联 C、D。
    link(diary_b, diary_c)
    link(diary_b, diary_d)

    # A 视角看不到 B 增加的 D（关系彼此独立），但能看到关联目标名称。
    resp = client.get(f"{BASE}diaries/{diary_a.id}/links/")
    a_links = resp.json()
    a_target_ids = {row["target_id"] for row in a_links}
    assert str(diary_d.id) not in a_target_ids
    assert {row["target_label"] for row in a_links} == {"B", "C"}

    # B 视角能看到 A（反向）。
    resp = client.get(f"{BASE}diaries/{diary_b.id}/links/")
    b_rows = resp.json()
    b_diaries = {row["diary"] for row in b_rows} | {row["target_id"] for row in b_rows}
    assert str(diary_a.id) in b_diaries

    # 解除一对关系，记录同步消失。
    ab_link = next(
        row for row in b_rows if (row["diary"] == str(diary_a.id) or row["target_id"] == str(diary_a.id))
    )
    resp = client.delete(f"{BASE}diaries/{diary_b.id}/links/{ab_link['id']}/")
    assert resp.status_code == 204
    assert DiaryLink.objects.filter(id=ab_link["id"]).exists() is False


def test_plan_recurrence_and_occurrence_completion(context):
    client, workspace, user = context

    resp = client.post(
        f"{BASE}plans/",
        {
            "title": "每天晨跑",
            "recurrence": "daily",
            "recurrence_start_date": "2026-02-16",
            "recurrence_end_date": "2026-02-18",
        },
        content_type="application/json",
    )
    assert resp.status_code == 201, resp.content
    plan_id = resp.json()["id"]

    # 生成三次安排。
    occurrences = PlanOccurrence.objects.filter(plan_id=plan_id, is_deleted=False)
    assert occurrences.count() == 3

    # 同名计划不允许重复创建，避免日历上出现重复安排。
    resp = client.post(
        f"{BASE}plans/",
        {"title": "每天晨跑", "recurrence": "none", "recurrence_start_date": "2026-02-16"},
        content_type="application/json",
    )
    assert resp.status_code == 400
    assert "title" in resp.json()

    target = occurrences.order_by("date").first()
    resp = client.patch(
        f"{BASE}plan-occurrences/{target.id}/",
        {"is_completed": True},
        content_type="application/json",
    )
    assert resp.status_code == 200
    assert resp.json()["is_completed"] is True

    # 勾选只影响当天，其余安排未完成。
    assert PlanOccurrence.objects.filter(plan_id=plan_id, is_completed=True).count() == 1

    # 计划级完成为手动勾选。
    client.patch(f"{BASE}plans/{plan_id}/", {"is_completed": True}, content_type="application/json")
    assert Plan.objects.get(id=plan_id).is_completed is True

    # 拖拽改期：把最后一天改到第一天，同日已有安排时拒绝。
    remaining = PlanOccurrence.objects.filter(plan_id=plan_id, is_deleted=False).order_by("date")
    last = remaining.last()
    first_date = remaining.first().date.isoformat()
    resp = client.patch(
        f"{BASE}plan-occurrences/{last.id}/",
        {"date": first_date},
        content_type="application/json",
    )
    assert resp.status_code == 400
    resp = client.patch(
        f"{BASE}plan-occurrences/{last.id}/",
        {"date": "2026-03-01"},
        content_type="application/json",
    )
    assert resp.status_code == 200
    assert resp.json()["date"] == "2026-03-01"

    # 仅删除一次：保留计划与其余安排。
    resp = client.delete(f"{BASE}plan-occurrences/{target.id}/")
    assert resp.status_code == 204
    assert PlanOccurrence.objects.get(id=target.id).is_deleted is True
    assert PlanOccurrence.objects.filter(plan_id=plan_id, is_deleted=False).count() == 2

"""Project state groups must support Chinese names and preserve state assignments."""

import re

import pytest
from django.test import Client

from plane.db.models import State, StateGroupDef
from plane.personal.identity import bootstrap_identity


@pytest.fixture
def state_context(db):
    bootstrap_identity()
    client = Client(enforce_csrf_checks=True)
    bootstrap = client.get("/api/personal/bootstrap/")
    client.defaults["HTTP_X_CSRFTOKEN"] = bootstrap.json()["csrf_token"]
    response = client.post(
        "/api/workspaces/personal/projects/",
        {"name": "状态分组测试", "identifier": "GROUP"},
        content_type="application/json",
    )
    assert response.status_code == 201, response.content
    return client, f"/api/workspaces/personal/projects/{response.json()['id']}/"


@pytest.mark.parametrize("name", ["待验收", "🎯", "Review " * 8])
def test_group_without_manual_key_supports_chinese_and_long_names(state_context, name):
    client, base = state_context
    response = client.post(
        base + "state-groups/", {"name": name, "key": "", "color": "#8B5CF6"}, content_type="application/json"
    )
    assert response.status_code == 201, response.content
    group = response.json()
    assert group["name"] == name.strip()
    assert re.fullmatch(r"[a-z0-9][a-z0-9_-]{0,31}", group["key"])
    assert group in client.get(base + "state-groups/").json()


def test_group_duplicate_key_returns_field_error_and_keeps_existing(state_context):
    client, base = state_context
    payload = {"name": "审核", "key": "review", "color": "#8B5CF6"}
    assert client.post(base + "state-groups/", payload, content_type="application/json").status_code == 201
    response = client.post(base + "state-groups/", payload, content_type="application/json")
    assert response.status_code == 400
    assert "key" in response.json()
    assert StateGroupDef.objects.filter(key="review").count() == 1


def test_group_key_change_preserves_assigned_states(state_context):
    client, base = state_context
    group = client.post(
        base + "state-groups/",
        {"name": "审核", "key": "review", "color": "#8B5CF6"},
        content_type="application/json",
    ).json()
    response = client.post(
        base + "states/",
        {"name": "待审核", "group": "review", "color": "#8B5CF6"},
        content_type="application/json",
    )
    assert response.status_code == 200, response.content
    state_id = response.json()["id"]
    response = client.patch(
        base + f"state-groups/{group['id']}/",
        {"name": "验收", "key": "review_done"},
        content_type="application/json",
    )
    assert response.status_code == 200, response.content
    assert State.objects.get(pk=state_id).group == "review_done"
    assert client.delete(base + f"state-groups/{group['id']}/").status_code == 400


def test_invalid_group_keys_are_rejected_without_creating_rows(state_context):
    client, base = state_context
    before = StateGroupDef.objects.count()
    for key in ("backlog", "Bad Key", "_review"):
        response = client.post(
            base + "state-groups/",
            {"name": "审核", "key": key, "color": "#8B5CF6"},
            content_type="application/json",
        )
        assert response.status_code == 400, response.content
    assert StateGroupDef.objects.count() == before


def test_builtin_groups_cannot_be_deleted_or_rekeyed(state_context):
    client, base = state_context
    group = next(row for row in client.get(base + "state-groups/").json() if row["key"] == "completed")
    path = base + f"state-groups/{group['id']}/"
    assert client.delete(path).status_code == 400
    assert client.patch(path, {"key": "finished"}, content_type="application/json").status_code == 400


def test_reusing_a_deleted_custom_group_key(state_context):
    client, base = state_context
    payload = {"name": "审核", "key": "review", "color": "#8B5CF6"}
    group = client.post(base + "state-groups/", payload, content_type="application/json").json()
    assert client.delete(base + f"state-groups/{group['id']}/").status_code == 204
    assert client.post(base + "state-groups/", payload, content_type="application/json").status_code == 201


def test_duplicate_state_name_returns_validation_error(state_context):
    client, base = state_context
    payload = {"name": "待规划", "group": "backlog", "color": "#8B5CF6"}
    response = client.post(base + "states/", payload, content_type="application/json")
    assert response.status_code == 400, response.content
    assert "name" in response.json()

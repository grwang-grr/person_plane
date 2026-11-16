import pytest
from django.test import Client

from plane.db.models import State
from plane.personal.identity import bootstrap_identity


@pytest.mark.django_db
def test_new_project_defaults_are_chinese_without_translating_entered_names():
    _, workspace = bootstrap_identity()
    client = Client()
    response = client.post(
        f"/api/workspaces/{workspace.slug}/projects/",
        {"name": "My Project", "identifier": "LOCALCN"},
        content_type="application/json",
    )
    assert response.status_code == 201, response.content
    project = response.json()
    assert project["name"] == "My Project"
    states = State.all_state_objects.filter(project_id=project["id"])
    assert set(states.values_list("name", flat=True)) == {"待规划", "未开始", "进行中", "已完成", "已取消", "待分拣"}
    assert set(states.values_list("group", flat=True)) == {
        "backlog",
        "unstarted",
        "started",
        "completed",
        "cancelled",
        "triage",
    }

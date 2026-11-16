# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from typing import Any, Dict, List

from django.db.models import Count, Q
from django.http import HttpRequest
from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.views.base import BaseAPIView
from plane.db.models import Issue, Project, ProjectMember, State, StateGroupDef, WorkspaceMember

STATE_GROUP_ORDER = ["backlog", "unstarted", "started", "completed", "cancelled"]


class WorkItemStatusSummaryEndpoint(BaseAPIView):
    """Live work item counts per state and per state group.

    The project overview and the workspace home both need "how much work sits in
    which status" without pulling the whole work item list, and both have to
    follow a status change immediately. Counting on request keeps the numbers in
    sync with whatever the board shows right now.
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request: HttpRequest, slug: str) -> Response:
        project_ids = [value for value in request.GET.get("project_ids", "").split(",") if value]

        projects = Project.objects.filter(workspace__slug=slug)
        role = (
            WorkspaceMember.objects.filter(workspace__slug=slug, member=request.user, is_active=True)
            .values_list("role", flat=True)
            .first()
        )
        # Same visibility as the project list: admins see every project, members
        # see their projects plus public ones, guests only their projects.
        if role != ROLE.ADMIN.value:
            member_projects = ProjectMember.objects.filter(
                workspace__slug=slug, member=request.user, is_active=True
            ).values("project_id")
            visible = Q(id__in=member_projects)
            if role == ROLE.MEMBER.value:
                visible |= Q(network=2)
            projects = projects.filter(visible)
        if project_ids:
            projects = projects.filter(id__in=project_ids)
        visible_project_ids = list(projects.values_list("id", flat=True))

        issues = Issue.issue_objects.filter(project_id__in=visible_project_ids)
        counts = {row["state_id"]: row["total"] for row in issues.values("state_id").annotate(total=Count("id"))}
        terminal_groups = set(
            StateGroupDef.objects.filter(project_id__in=visible_project_ids, is_terminal=True).values_list(
                "key", flat=True
            )
        )

        state_rows: List[Dict[str, Any]] = []
        for state in (
            State.objects.filter(project_id__in=visible_project_ids)
            .order_by("sequence")
            .values("id", "name", "color", "group", "project_id")
        ):
            state_rows.append(
                {
                    "id": str(state["id"]),
                    "name": state["name"],
                    "color": state["color"],
                    "group": state["group"],
                    "project_id": str(state["project_id"]),
                    "count": counts.pop(state["id"], 0),
                    "is_terminal": state["group"] == "completed" or state["group"] in terminal_groups,
                }
            )

        groups = {group: 0 for group in STATE_GROUP_ORDER}
        for state in state_rows:
            group = str(state["group"])
            if group in groups:
                groups[group] += int(state["count"])

        # Work items pointing at a state outside the visible project set are not
        # reachable from this view, so they are reported separately instead of
        # silently disappearing from the total.
        untracked = sum(counts.values())
        return Response(
            {
                "groups": groups,
                "states": state_rows,
                "untracked": untracked,
                "total": sum(groups.values()) + untracked,
            },
            status=status.HTTP_200_OK,
        )

# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
from itertools import groupby
from collections import defaultdict

# Django imports
from django.db.models import Case, Value, When
from django.db.utils import IntegrityError
from django.utils.text import slugify

# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from .. import BaseViewSet, BaseAPIView
from plane.app.serializers import StateGroupDefSerializer, StateSerializer
from plane.app.permissions import ROLE, allow_permission
from plane.db.models import Project, State, StateGroup, StateGroupDef, Issue
from plane.utils.cache import invalidate_cache


class StateViewSet(BaseViewSet):
    serializer_class = StateSerializer
    model = State

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .filter(is_triage=False)
            .select_related("project")
            .select_related("workspace")
            .distinct()
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def retrieve(self, request, slug, project_id, pk):
        # Declared explicitly so the routed GET carries the same project-role
        # check as list() below. Without it the action is served by DRF's
        # generic retrieve mixin under the bare default permission class:
        # authenticated but not authorized. No client calls this today, but the
        # route is live and a caller is already wired up one layer away, so it
        # gets a real implementation rather than being left to fail closed.
        return super().retrieve(request, slug=slug, project_id=project_id, pk=pk)

    @invalidate_cache(path="workspaces/:slug/states/", url_params=True, user=False)
    @allow_permission([ROLE.ADMIN])
    def create(self, request, slug, project_id):
        try:
            serializer = StateSerializer(data=request.data, context={"view": self})
            if serializer.is_valid():
                serializer.save(project_id=project_id)
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"name": "The state name is already taken"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            raise

    @allow_permission([ROLE.ADMIN])
    def partial_update(self, request, slug, project_id, pk):
        try:
            state = self.get_queryset().get(pk=pk)
            serializer = StateSerializer(state, data=request.data, partial=True, context={"view": self})
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"name": "The state name is already taken"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            raise

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def list(self, request, slug, project_id):
        states = StateSerializer(self.get_queryset(), many=True).data

        grouped_states = defaultdict(list)
        for state in states:
            grouped_states[state["group"]].append(state)

        for group, group_states in grouped_states.items():
            count = len(group_states)

            for index, state in enumerate(group_states, start=1):
                state["order"] = index / count

        grouped = request.GET.get("grouped", False)

        if grouped == "true":
            state_dict = {}
            for key, value in groupby(
                sorted(states, key=lambda state: state["group"]),
                lambda state: state.get("group"),
            ):
                state_dict[str(key)] = list(value)
            return Response(state_dict, status=status.HTTP_200_OK)

        return Response(states, status=status.HTTP_200_OK)

    @invalidate_cache(path="workspaces/:slug/states/", url_params=True, user=False)
    @allow_permission([ROLE.ADMIN])
    def mark_as_default(self, request, slug, project_id, pk):
        state = self.get_queryset().get(pk=pk)
        # One UPDATE, so concurrent calls can't leave the project with zero or two defaults
        State.objects.filter(project_id=project_id).update(
            default=Case(When(pk=state.pk, then=Value(True)), default=Value(False))
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @invalidate_cache(path="workspaces/:slug/states/", url_params=True, user=False)
    @allow_permission([ROLE.ADMIN])
    def destroy(self, request, slug, project_id, pk):
        state = State.objects.get(is_triage=False, pk=pk, project_id=project_id, workspace__slug=slug)

        if state.default:
            return Response(
                {"error": "无法删除默认状态"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check for any issues in the state
        issue_exist = Issue.objects.filter(state=pk).exists()

        if issue_exist:
            return Response(
                {"error": "此状态下还有工作项，仅能删除空状态"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        state.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class IntakeStateEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id):
        state = State.triage_objects.filter(workspace__slug=slug, project_id=project_id).first()
        if not state:
            return Response(
                {"error": "未找到分拣状态"},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(StateSerializer(state).data, status=status.HTTP_200_OK)


class StateGroupViewSet(BaseViewSet):
    serializer_class = StateGroupDefSerializer
    model = StateGroupDef

    def get_queryset(self):
        return (
            StateGroupDef.objects.filter(
                workspace__slug=self.kwargs.get("slug"),
                project_id=self.kwargs.get("project_id"),
                project__project_projectmember__member=self.request.user,
                deleted_at__isnull=True,
            )
            .select_related("project", "workspace")
            .distinct()
            .order_by("sequence")
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def list(self, request, slug, project_id):
        groups = StateGroupDefSerializer(self.get_queryset(), many=True).data
        return Response(groups, status=status.HTTP_200_OK)

    @invalidate_cache(path="workspaces/:slug/projects/:project_id/state-groups/", url_params=True, user=False)
    @allow_permission([ROLE.ADMIN])
    def create(self, request, slug, project_id):
        try:
            serializer = StateGroupDefSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            project = Project.objects.get(pk=project_id, workspace__slug=slug)
            key = (serializer.validated_data.get("key") or "").strip() or slugify(
                serializer.validated_data.get("name", "")
            )
            if not key:
                return Response({"name": "请填写分组名称"}, status=status.HTTP_400_BAD_REQUEST)
            if key in set(StateGroup.values):
                return Response({"key": "该标识为内置分组保留，请使用其他标识。"}, status=status.HTTP_400_BAD_REQUEST)

            group = StateGroupDef.objects.create(
                project=project,
                workspace=project.workspace,
                key=key,
                name=serializer.validated_data["name"],
                color=serializer.validated_data.get("color", "#8B5CF6"),
                sequence=serializer.validated_data.get("sequence", 65535),
                is_terminal=serializer.validated_data.get("is_terminal", False),
                created_by=request.user,
            )
            return Response(StateGroupDefSerializer(group).data, status=status.HTTP_201_CREATED)
        except IntegrityError:
            return Response({"key": "该分组标识已存在。"}, status=status.HTTP_400_BAD_REQUEST)

    @invalidate_cache(path="workspaces/:slug/projects/:project_id/state-groups/", url_params=True, user=False)
    @allow_permission([ROLE.ADMIN])
    def partial_update(self, request, slug, project_id, pk):
        group = StateGroupDef.objects.get(pk=pk, project_id=project_id, workspace__slug=slug)

        if group.is_builtin and "key" in request.data and request.data["key"] != group.key:
            return Response({"key": "内置分组的标识不可修改。"}, status=status.HTTP_400_BAD_REQUEST)

        if group.key in dict(StateGroup.choices) and "key" in request.data and request.data["key"] != group.key:
            return Response({"key": "该分组的标识不可修改。"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = StateGroupDefSerializer(group, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            serializer.save()
        except IntegrityError:
            return Response({"key": "该分组标识已存在。"}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @invalidate_cache(path="workspaces/:slug/projects/:project_id/state-groups/", url_params=True, user=False)
    @allow_permission([ROLE.ADMIN])
    def destroy(self, request, slug, project_id, pk):
        group = StateGroupDef.objects.get(pk=pk, project_id=project_id, workspace__slug=slug)

        if group.is_builtin:
            return Response({"error": "内置分组不可删除"}, status=status.HTTP_400_BAD_REQUEST)

        if State.objects.filter(project_id=project_id, group=group.key, deleted_at__isnull=True).exists():
            return Response({"error": "该分组下还有状态，请先移动到其他分组"}, status=status.HTTP_400_BAD_REQUEST)

        group.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

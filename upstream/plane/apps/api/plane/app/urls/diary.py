# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.urls import path

# Module imports
from plane.app.views import (
    DiaryLinkViewSet,
    DiaryTemplateViewSet,
    DiaryViewSet,
    PlanOccurrenceViewSet,
    PlanViewSet,
)

urlpatterns = [
    # 日记
    path(
        "workspaces/<str:slug>/diaries/",
        DiaryViewSet.as_view({"get": "list", "post": "create"}),
        name="workspace-diaries",
    ),
    path(
        "workspaces/<str:slug>/diaries/<uuid:pk>/",
        DiaryViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="workspace-diary-detail",
    ),
    path(
        "workspaces/<str:slug>/diaries/<uuid:pk>/set-primary/",
        DiaryViewSet.as_view({"post": "set_primary"}),
        name="workspace-diary-set-primary",
    ),
    # 日记关联（双向独立成对）
    path(
        "workspaces/<str:slug>/diaries/<uuid:diary_id>/links/",
        DiaryLinkViewSet.as_view({"get": "list", "post": "create"}),
        name="workspace-diary-links",
    ),
    path(
        "workspaces/<str:slug>/diaries/<uuid:diary_id>/links/<uuid:pk>/",
        DiaryLinkViewSet.as_view({"delete": "destroy"}),
        name="workspace-diary-link-detail",
    ),
    # 日记模板
    path(
        "workspaces/<str:slug>/diary-templates/",
        DiaryTemplateViewSet.as_view({"get": "list", "post": "create"}),
        name="workspace-diary-templates",
    ),
    path(
        "workspaces/<str:slug>/diary-templates/<uuid:pk>/",
        DiaryTemplateViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="workspace-diary-template-detail",
    ),
    # 计划
    path(
        "workspaces/<str:slug>/plans/",
        PlanViewSet.as_view({"get": "list", "post": "create"}),
        name="workspace-plans",
    ),
    path(
        "workspaces/<str:slug>/plans/<uuid:pk>/",
        PlanViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="workspace-plan-detail",
    ),
    # 计划安排（日历实例）
    path(
        "workspaces/<str:slug>/plan-occurrences/",
        PlanOccurrenceViewSet.as_view({"get": "list", "post": "create"}),
        name="workspace-plan-occurrences",
    ),
    path(
        "workspaces/<str:slug>/plan-occurrences/<uuid:pk>/",
        PlanOccurrenceViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="workspace-plan-occurrence-detail",
    ),
]

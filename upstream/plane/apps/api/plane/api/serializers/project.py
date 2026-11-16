# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
import random
from rest_framework import serializers


# Python imports
import re

# Module imports
from plane.db.models import Project, ProjectIdentifier, WorkspaceMember, State, Estimate

from plane.utils.content_validator import (
    validate_html_content,
)
from .base import BaseSerializer


def sanitize_project_description(data):
    """Sanitize the HTML description shared by project create and update."""
    html = data.get("description_html")
    if html is None:
        return data

    is_valid, error_message, sanitized_html = validate_html_content(html if isinstance(html, str) else str(html))
    if not is_valid:
        raise serializers.ValidationError({"description_html": error_message or "富文本内容无效"})
    if sanitized_html is not None:
        data["description_html"] = sanitized_html
    return data


class ProjectCreateSerializer(BaseSerializer):
    """
    Serializer for creating projects with workspace validation.

    Handles project creation including identifier validation, member verification,
    and workspace association for new project initialization.
    """

    PROJECT_ICON_DEFAULT_COLORS = [
        "#95999f",
        "#6d7b8a",
        "#5e6ad2",
        "#02b5ed",
        "#02b55c",
        "#f2be02",
        "#e57a00",
        "#f38e82",
    ]
    PROJECT_ICON_DEFAULT_ICONS = [
        "home",
        "apps",
        "settings",
        "star",
        "favorite",
        "done",
        "check_circle",
        "add_task",
        "create_new_folder",
        "dataset",
        "terminal",
        "key",
        "rocket",
        "public",
        "quiz",
        "mood",
        "gavel",
        "eco",
        "diamond",
        "forest",
        "bolt",
        "sync",
        "cached",
        "library_add",
        "view_timeline",
        "view_kanban",
        "empty_dashboard",
        "cycle",
    ]

    class Meta:
        model = Project
        fields = [
            "name",
            "description",
            "description_text",
            "description_html",
            "project_lead",
            "default_assignee",
            "identifier",
            "icon_prop",
            "emoji",
            "cover_image",
            "module_view",
            "cycle_view",
            "issue_views_view",
            "page_view",
            "intake_view",
            "guest_view_all_features",
            "archive_in",
            "close_in",
            "timezone",
            "external_source",
            "external_id",
            "is_issue_type_enabled",
            "is_time_tracking_enabled",
        ]

        read_only_fields = [
            "id",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "logo_props",
        ]

    def validate(self, data):
        project_name = data.get("name", None)
        project_identifier = data.get("identifier", None)

        if project_name is not None and re.match(Project.FORBIDDEN_IDENTIFIER_CHARS_PATTERN, project_name):
            raise serializers.ValidationError("项目名称不能包含特殊字符。")

        if project_identifier is not None and re.match(Project.FORBIDDEN_IDENTIFIER_CHARS_PATTERN, project_identifier):
            raise serializers.ValidationError("项目标识不能包含特殊字符。")

        project_lead = data.get("project_lead")
        if (
            project_lead
            and not WorkspaceMember.objects.filter(
                workspace_id=self.context["workspace_id"],
                member=project_lead,
                is_active=True,
            ).exists()
        ):
            # Field-shaped error so DRF surfaces it under the specific key
            # rather than as non_field_errors. Also requires the membership
            # to be active so that revoked / removed members can't slip
            # through and trigger the FK error downstream.
            raise serializers.ValidationError({"project_lead": "The provided user is not a member of this workspace."})

        if data.get("default_assignee", None) is not None:
            # Check if the default assignee is a member of the workspace
            if not WorkspaceMember.objects.filter(
                workspace_id=self.context["workspace_id"],
                member_id=data.get("default_assignee"),
            ).exists():
                raise serializers.ValidationError("默认负责人必须属于此工作空间")

        return sanitize_project_description(data)

    def create(self, validated_data):
        identifier = validated_data.get("identifier", "").strip().upper()

        if identifier == "":
            raise serializers.ValidationError(detail="Project Identifier is required")

        if ProjectIdentifier.objects.filter(name=identifier, workspace_id=self.context["workspace_id"]).exists():
            raise serializers.ValidationError(detail="Project Identifier is taken")

        if validated_data.get("logo_props", None) is None:
            # Generate a random icon and color for the project icon
            validated_data["logo_props"] = {
                "in_use": "icon",
                "icon": {
                    "name": random.choice(self.PROJECT_ICON_DEFAULT_ICONS),
                    "color": random.choice(self.PROJECT_ICON_DEFAULT_COLORS),
                },
            }

        project = Project.objects.create(**validated_data, workspace_id=self.context["workspace_id"])
        return project


class ProjectUpdateSerializer(ProjectCreateSerializer):
    """
    Serializer for updating projects with enhanced state and estimation management.

    Extends project creation with update-specific validations including default state
    assignment, estimation configuration, and project setting modifications.
    """

    class Meta(ProjectCreateSerializer.Meta):
        model = Project
        fields = ProjectCreateSerializer.Meta.fields + [
            "default_state",
            "estimate",
        ]

        read_only_fields = ProjectCreateSerializer.Meta.read_only_fields

    def update(self, instance, validated_data):
        project_name = validated_data.get("name", None)
        project_identifier = validated_data.get("identifier", None)

        if project_name is not None and re.match(Project.FORBIDDEN_IDENTIFIER_CHARS_PATTERN, project_name):
            raise serializers.ValidationError("项目名称不能包含特殊字符。")

        if project_identifier is not None and re.match(Project.FORBIDDEN_IDENTIFIER_CHARS_PATTERN, project_identifier):
            raise serializers.ValidationError("项目标识不能包含特殊字符。")

        """Update a project"""
        if (
            validated_data.get("default_state", None) is not None
            and not State.objects.filter(project=instance, id=validated_data.get("default_state")).exists()
        ):
            # Check if the default state is a state in the project
            raise serializers.ValidationError("默认状态必须属于此项目")

        if (
            validated_data.get("estimate", None) is not None
            and not Estimate.objects.filter(project=instance, id=validated_data.get("estimate").id).exists()
        ):
            # Check if the estimate is a estimate in the project
            raise serializers.ValidationError("估算必须属于此项目")
        return super().update(instance, validated_data)


class ProjectSerializer(BaseSerializer):
    """
    Comprehensive project serializer with metrics and member context.

    Provides complete project data including member counts, cycle/module totals,
    deployment status, and user-specific context for project management.
    """

    total_members = serializers.IntegerField(read_only=True)
    total_cycles = serializers.IntegerField(read_only=True)
    total_modules = serializers.IntegerField(read_only=True)
    is_member = serializers.BooleanField(read_only=True)
    sort_order = serializers.FloatField(read_only=True)
    member_role = serializers.IntegerField(read_only=True)
    is_deployed = serializers.BooleanField(read_only=True)
    cover_image_url = serializers.CharField(read_only=True)

    class Meta:
        model = Project
        fields = "__all__"
        read_only_fields = [
            "id",
            "emoji",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "deleted_at",
            "cover_image_url",
        ]

    def validate(self, data):
        project_name = data.get("name", None)
        project_identifier = data.get("identifier", None)

        if project_name is not None and re.match(Project.FORBIDDEN_IDENTIFIER_CHARS_PATTERN, project_name):
            raise serializers.ValidationError("项目名称不能包含特殊字符。")

        if project_identifier is not None and re.match(Project.FORBIDDEN_IDENTIFIER_CHARS_PATTERN, project_identifier):
            raise serializers.ValidationError("项目标识不能包含特殊字符。")

        # Check project lead should be a member of the workspace
        if (
            data.get("project_lead", None) is not None
            and not WorkspaceMember.objects.filter(
                workspace_id=self.context["workspace_id"],
                member_id=data.get("project_lead"),
            ).exists()
        ):
            raise serializers.ValidationError("项目负责人必须属于此工作空间")

        # Check default assignee should be a member of the workspace
        if (
            data.get("default_assignee", None) is not None
            and not WorkspaceMember.objects.filter(
                workspace_id=self.context["workspace_id"],
                member_id=data.get("default_assignee"),
            ).exists()
        ):
            raise serializers.ValidationError("默认负责人必须属于此工作空间")

        return sanitize_project_description(data)

    def create(self, validated_data):
        identifier = validated_data.get("identifier", "").strip().upper()
        if identifier == "":
            raise serializers.ValidationError(detail="Project Identifier is required")

        if ProjectIdentifier.objects.filter(name=identifier, workspace_id=self.context["workspace_id"]).exists():
            raise serializers.ValidationError(detail="Project Identifier is taken")

        project = Project.objects.create(**validated_data, workspace_id=self.context["workspace_id"])
        _ = ProjectIdentifier.objects.create(
            name=project.identifier,
            project=project,
            workspace_id=self.context["workspace_id"],
        )
        return project


class ProjectLiteSerializer(BaseSerializer):
    """
    Lightweight project serializer for minimal data transfer.

    Provides essential project information including identifiers, visual properties,
    and basic metadata optimized for list views and references.
    """

    cover_image_url = serializers.CharField(read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "identifier",
            "name",
            "cover_image",
            "icon_prop",
            "emoji",
            "description",
            "cover_image_url",
            "archived_at",
        ]
        read_only_fields = fields

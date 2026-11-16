# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from plane.db.models import ProjectMember, WorkspaceMember
from .base import BaseSerializer
from plane.db.models import User
from plane.utils.permissions import ROLE


class ProjectMemberSerializer(BaseSerializer):
    """
    Serializer for project members.
    """

    member = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=True,
    )

    def validate_member(self, value):
        slug = self.context.get("slug")
        if not slug:
            raise serializers.ValidationError("请输入地址标识", code="INVALID_SLUG")
        if not value:
            raise serializers.ValidationError("请选择成员", code="INVALID_MEMBER")
        if not WorkspaceMember.objects.filter(workspace__slug=slug, member=value, is_active=True).exists():
            raise serializers.ValidationError("工作空间中未找到此成员", code="INVALID_MEMBER")
        return value

    def validate_role(self, value):
        if value not in [ROLE.ADMIN.value, ROLE.MEMBER.value, ROLE.GUEST.value]:
            raise serializers.ValidationError("角色无效", code="INVALID_ROLE")
        return value

    def validate(self, attrs):
        # Mirrors ProjectMemberViewSet.partial_update: a project role cannot
        # exceed the target's workspace role (workspace guests stay guests).
        role = attrs.get("role")
        if role is None and self.instance is not None:
            role = self.instance.role
        member = attrs.get("member") or (self.instance.member if self.instance else None)
        slug = self.context.get("slug")
        if role is not None and member is not None and slug:
            workspace_role = (
                WorkspaceMember.objects.filter(workspace__slug=slug, member=member, is_active=True)
                .values_list("role", flat=True)
                .first()
            )
            if workspace_role is None:
                raise serializers.ValidationError({"member": "Member not found in workspace"}, code="INVALID_MEMBER")
            if workspace_role == ROLE.GUEST.value and role in [ROLE.ADMIN.value, ROLE.MEMBER.value]:
                raise serializers.ValidationError(
                    "不能分配高于该成员工作空间权限的角色",
                    code="INVALID_ROLE",
                )
        return attrs

    class Meta:
        model = ProjectMember
        fields = ["id", "member", "role"]
        read_only_fields = ["id"]


class BaseMemberLiteAPISerializer(BaseSerializer):
    """Common flattened member representation for paginated member pickers/directories."""

    id = serializers.UUIDField(source="member.id", read_only=True)
    first_name = serializers.CharField(source="member.first_name", read_only=True)
    last_name = serializers.CharField(source="member.last_name", read_only=True)
    email = serializers.EmailField(source="member.email", read_only=True)
    avatar = serializers.CharField(source="member.avatar", read_only=True, allow_null=True)
    avatar_url = serializers.CharField(source="member.avatar_url", read_only=True, allow_null=True)
    display_name = serializers.CharField(source="member.display_name", read_only=True)
    is_bot = serializers.BooleanField(source="member.is_bot", read_only=True)

    class Meta:
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "avatar",
            "avatar_url",
            "display_name",
            "role",
            "is_active",
            "is_bot",
        ]
        read_only_fields = fields


class WorkspaceMemberLiteAPISerializer(BaseMemberLiteAPISerializer):
    """Minimal WorkspaceMember representation for paginated member pickers/directories."""

    class Meta(BaseMemberLiteAPISerializer.Meta):
        model = WorkspaceMember


class ProjectMemberLiteAPISerializer(BaseMemberLiteAPISerializer):
    """Minimal ProjectMember representation for paginated member pickers/directories."""

    class Meta(BaseMemberLiteAPISerializer.Meta):
        model = ProjectMember

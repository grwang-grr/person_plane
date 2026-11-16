# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import re
from uuid import uuid4

from django.utils.text import slugify

# Module imports
from .base import BaseSerializer
from rest_framework import serializers

from plane.db.models import State, StateGroup, StateGroupDef

STATE_GROUP_KEY_PATTERN = re.compile(r"^[a-z0-9][a-z0-9_-]{0,31}$")


class StateSerializer(BaseSerializer):
    order = serializers.FloatField(required=False)

    class Meta:
        model = State
        fields = [
            "id",
            "project_id",
            "workspace_id",
            "name",
            "color",
            "group",
            "default",
            "description",
            "sequence",
            "order",
        ]
        # Defaults only change through mark_as_default, which also clears the old one
        read_only_fields = ["workspace", "project", "default"]

    def validate(self, attrs):
        group = attrs.get("group") or (getattr(self.instance, "group", None) if self.instance else None)
        if group == StateGroup.TRIAGE.value:
            raise serializers.ValidationError("不能手动创建分拣状态")

        project_id = getattr(self.instance, "project_id", None)
        view = self.context.get("view") if isinstance(self.context, dict) else None
        if project_id is None and view is not None:
            project_id = getattr(view, "kwargs", {}).get("project_id")
        if group and project_id and not StateGroupDef.objects.filter(project_id=project_id, key=group).exists():
            raise serializers.ValidationError({"group": "该状态分组不存在，请先在项目设置中创建。"})
        if project_id and (name := attrs.get("name")):
            states = State.objects.filter(project_id=project_id, name=name)
            if self.instance:
                states = states.exclude(pk=self.instance.pk)
            if states.exists():
                raise serializers.ValidationError({"name": "此状态名称已存在，请使用其他名称。"})
        return attrs


class StateGroupDefSerializer(BaseSerializer):
    class Meta:
        model = StateGroupDef
        fields = [
            "id",
            "project_id",
            "workspace_id",
            "key",
            "name",
            "color",
            "sequence",
            "is_builtin",
            "is_terminal",
        ]
        # The built-in buckets carry analytics semantics, so their key is frozen.
        read_only_fields = ["workspace", "project", "is_builtin"]
        # Display names may be Chinese; keys remain stable ASCII identifiers.
        extra_kwargs = {"key": {"required": False, "allow_blank": True}}

    def validate_key(self, value: str) -> str:
        """Normalize custom keys and keep the built-in analytics buckets reserved."""
        key = (value or "").strip()
        if not key:
            if self.instance:
                raise serializers.ValidationError("分组标识不能为空。")
            return key
        if self.instance and getattr(self.instance, "key", None) == key:
            return key
        if key in set(StateGroup.values):
            raise serializers.ValidationError("该标识为内置分组保留，请使用其他标识。")
        if not STATE_GROUP_KEY_PATTERN.fullmatch(key):
            raise serializers.ValidationError("标识只能包含小写字母、数字、连字符和下划线，且以字母或数字开头。")
        return key

    def validate(self, attrs):
        if self.instance is None and not attrs.get("key"):
            generated = slugify(attrs.get("name", ""))[:32].strip("-_") or f"group-{uuid4().hex[:12]}"
            attrs["key"] = self.validate_key(generated)
        return attrs


class StateLiteSerializer(BaseSerializer):
    class Meta:
        model = State
        fields = ["id", "name", "color", "group"]
        read_only_fields = fields

# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from plane.db.models import Diary, DiaryLink, DiaryTemplate, Issue, Plan, PlanOccurrence, Project
from plane.utils.content_validator import validate_html_content

from .base import BaseSerializer


def _resolve_target_label(target_type: str, target_id) -> str:
    """解析链接目标名称，供前端直接展示，避免逐条回查。"""
    if target_type == DiaryLink.TargetType.DIARY:
        row = Diary.objects.filter(pk=target_id).values_list("title", "diary_date").first()
        if not row:
            return ""
        return row[0] or str(row[1])
    if target_type == DiaryLink.TargetType.PROJECT:
        return Project.objects.filter(pk=target_id).values_list("name", flat=True).first() or ""
    if target_type == DiaryLink.TargetType.TASK:
        return Issue.objects.filter(pk=target_id).values_list("name", flat=True).first() or ""
    if target_type == DiaryLink.TargetType.ISSUE:
        # 问题模块仅在个人版存在，缺失时不影响其他环境的加载。
        try:
            from plane.personal.models import Problem
        except Exception:
            return ""
        return Problem.objects.filter(pk=target_id).values_list("title", flat=True).first() or ""
    return ""


class DiaryTemplateSerializer(BaseSerializer):
    class Meta:
        model = DiaryTemplate
        fields = "__all__"
        read_only_fields = ["workspace", "owner"]

    def validate(self, data):
        if data.get("description_html"):
            is_valid, _error_msg, sanitized_html = validate_html_content(data["description_html"])
            if not is_valid:
                raise serializers.ValidationError({"error": "富文本内容无效"})
            if sanitized_html is not None:
                data["description_html"] = sanitized_html
        return data


class DiarySerializer(BaseSerializer):
    class Meta:
        model = Diary
        fields = "__all__"
        # is_primary 仅通过 set-primary 切换 / 创建时默认判定，避免直接写入破坏唯一约束。
        read_only_fields = ["workspace", "owner", "is_primary"]

    def validate(self, data):
        if data.get("description_html"):
            is_valid, _error_msg, sanitized_html = validate_html_content(data["description_html"])
            if not is_valid:
                raise serializers.ValidationError({"error": "富文本内容无效"})
            if sanitized_html is not None:
                data["description_html"] = sanitized_html

        diary_type = data.get("diary_type") or (self.instance.diary_type if self.instance else None)
        if diary_type in (Diary.Type.WEEKLY, Diary.Type.MONTHLY, Diary.Type.YEARLY):
            if not data.get("period_key") and (self.instance is None or not self.instance.period_key):
                raise serializers.ValidationError({"period_key": "总结类日记需要归属周期"})
        return data


class DiaryLinkSerializer(BaseSerializer):
    target_label = serializers.SerializerMethodField()

    class Meta:
        model = DiaryLink
        fields = "__all__"
        read_only_fields = ["workspace", "owner", "diary"]

    def get_target_label(self, obj) -> str:
        return _resolve_target_label(obj.target_type, obj.target_id)


class PlanOccurrenceSerializer(BaseSerializer):
    display_title = serializers.SerializerMethodField()
    display_description = serializers.SerializerMethodField()

    class Meta:
        model = PlanOccurrence
        fields = "__all__"
        read_only_fields = ["workspace", "owner", "plan"]

    def get_display_title(self, obj) -> str:
        return obj.override_title or (obj.plan.title if obj.plan else "")

    def get_display_description(self, obj) -> str:
        return obj.override_description or (obj.plan.description if obj.plan else "")


class PlanSerializer(BaseSerializer):
    occurrences = serializers.SerializerMethodField()

    class Meta:
        model = Plan
        fields = "__all__"
        read_only_fields = ["workspace", "owner"]

    def get_occurrences(self, obj):
        request = self.context.get("request")
        occurrences = obj.occurrences.filter(is_deleted=False)
        if request:
            date_from = request.query_params.get("date_from")
            date_to = request.query_params.get("date_to")
            if date_from:
                occurrences = occurrences.filter(date__gte=date_from)
            if date_to:
                occurrences = occurrences.filter(date__lte=date_to)
        return PlanOccurrenceSerializer(occurrences, many=True).data

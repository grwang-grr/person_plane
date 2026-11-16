# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from plane.db.models import Diary, DiaryLink, DiaryTemplate, Issue, Plan, PlanOccurrence, Project
from plane.utils.content_validator import validate_html_content

from .base import BaseSerializer


class DiaryDateRangeSerializer(serializers.Serializer):
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)

    def validate(self, data):
        if data.get("date_from") and data.get("date_to") and data["date_from"] > data["date_to"]:
            raise serializers.ValidationError({"date_to": "结束日期不能早于开始日期"})
        return data


class PlanDeleteSerializer(serializers.Serializer):
    scope = serializers.ChoiceField(choices=["this", "future", "all"], default="all")
    date = serializers.DateField(required=False)

    def validate(self, data):
        if data["scope"] != "all" and "date" not in data:
            raise serializers.ValidationError({"date": "删除单次或后续安排时必须指定日期"})
        return data


class PlanOccurrenceCreateSerializer(serializers.Serializer):
    plan_id = serializers.UUIDField()
    date = serializers.DateField()


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
    recurrence_interval = serializers.IntegerField(min_value=1, required=False)
    recurrence_byweekday = serializers.ListField(
        child=serializers.IntegerField(min_value=0, max_value=6), required=False, allow_empty=True
    )
    recurrence_bymonthday = serializers.IntegerField(min_value=1, max_value=31, allow_null=True, required=False)

    class Meta:
        model = Plan
        fields = "__all__"
        read_only_fields = ["workspace", "owner"]

    def get_occurrences(self, obj):
        occurrences = getattr(obj, "visible_occurrences", None)
        if occurrences is None:
            occurrences = obj.occurrences.filter(is_deleted=False)
            for key, lookup in (("date_from", "date__gte"), ("date_to", "date__lte")):
                if value := self.context.get("date_range", {}).get(key):
                    occurrences = occurrences.filter(**{lookup: value})
        # The enclosing plan is already loaded; no per-occurrence FK queries.
        for occurrence in occurrences:
            occurrence.plan = obj
        return PlanOccurrenceSerializer(occurrences, many=True).data

    def validate(self, data):
        def effective(name, default=None):
            return data.get(name, getattr(self.instance, name, default))

        recurrence = effective("recurrence", Plan.Recurrence.NONE)
        start = effective("recurrence_start_date")
        end = effective("recurrence_end_date")
        if start and end and end < start:
            raise serializers.ValidationError({"recurrence_end_date": "结束日期不能早于开始日期"})
        if recurrence != Plan.Recurrence.NONE and not start:
            raise serializers.ValidationError({"recurrence_start_date": "重复计划需要开始日期"})
        if recurrence == Plan.Recurrence.WEEKLY and not effective("recurrence_byweekday", []):
            raise serializers.ValidationError({"recurrence_byweekday": "每周重复至少需要选择一个星期"})
        if recurrence == Plan.Recurrence.MONTHLY and not effective("recurrence_bymonthday"):
            raise serializers.ValidationError({"recurrence_bymonthday": "每月重复需要指定日期（1—31）"})
        return data

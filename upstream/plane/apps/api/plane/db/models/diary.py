# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.conf import settings
from django.db import models

# Module imports
from plane.utils.html_processor import strip_tags

from .base import BaseModel


def get_empty_document():
    return {}


class DiaryTemplate(BaseModel):
    """日记模板：普通日记 / 周总结 / 月总结 / 年总结 各自一套模板。"""

    class Type(models.TextChoices):
        DAILY = "daily", "普通日记"
        WEEKLY = "weekly", "周总结"
        MONTHLY = "monthly", "月总结"
        YEARLY = "yearly", "年总结"

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="diary_templates")
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="diary_templates")

    name = models.CharField(max_length=255)
    diary_type = models.CharField(max_length=16, choices=Type.choices, default=Type.DAILY)
    description_json = models.JSONField(default=get_empty_document, blank=True)
    description_html = models.TextField(blank=True, default="<p></p>")
    description_stripped = models.TextField(blank=True, null=True)
    is_default = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Diary Template"
        verbose_name_plural = "Diary Templates"
        db_table = "diary_templates"
        ordering = ("-created_at",)

    def save(self, *args, **kwargs):
        self.description_stripped = (
            None
            if (self.description_html == "" or self.description_html is None)
            else strip_tags(self.description_html)
        )
        super().save(*args, **kwargs)

    def __str__(self):
        return str(self.name)


class Diary(BaseModel):
    """日记 / 周总结 / 月总结 / 年总结（同一模型，按 diary_type 区分）。"""

    class Type(models.TextChoices):
        DAILY = "daily", "普通日记"
        WEEKLY = "weekly", "周总结"
        MONTHLY = "monthly", "月总结"
        YEARLY = "yearly", "年总结"

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="diaries")
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="diaries")

    title = models.CharField(max_length=255, blank=True, default="")
    diary_type = models.CharField(max_length=16, choices=Type.choices, default=Type.DAILY)

    # 所属日期（补写历史日记时早于 created_at），列表按此倒序排序。
    diary_date = models.DateField()
    # 周/月/年归属键：周总结 "2026-W07"、月总结 "2026-02"、年总结 "2026"，普通日记留空。
    period_key = models.CharField(max_length=32, blank=True, default="")
    # 跨月周以周日所在月份作为月总结的聚合归属。
    belongs_month = models.CharField(max_length=16, blank=True, default="")

    # 主日记：每天最多一篇，当天第一篇默认成为主日记。
    is_primary = models.BooleanField(default=False)

    template = models.ForeignKey(
        "db.DiaryTemplate", on_delete=models.SET_NULL, null=True, blank=True, related_name="diaries"
    )

    description_json = models.JSONField(default=get_empty_document, blank=True)
    description_html = models.TextField(blank=True, default="<p></p>")
    # 日记正文以 Markdown 存储（渲染由前端完成）。
    description_md = models.TextField(blank=True, default="")
    description_stripped = models.TextField(blank=True, null=True)
    description_binary = models.BinaryField(null=True)

    class Meta:
        verbose_name = "Diary"
        verbose_name_plural = "Diaries"
        db_table = "diaries"
        ordering = ("-diary_date", "-is_primary", "created_at")
        indexes = [
            models.Index(fields=["workspace", "owner", "diary_date"], name="diary_owner_date_idx"),
            models.Index(fields=["owner", "diary_type", "period_key"], name="diary_owner_period_idx"),
        ]
        constraints = [
            # 同一天最多一篇主日记。
            models.UniqueConstraint(
                fields=["owner", "diary_date"],
                condition=models.Q(is_primary=True, deleted_at__isnull=True),
                name="diary_primary_unique_owner_date",
            ),
            # 周 / 月 / 年总结每周期各一篇。
            models.UniqueConstraint(
                fields=["owner", "diary_type", "period_key"],
                condition=models.Q(deleted_at__isnull=True)
                & models.Q(diary_type__in=["weekly", "monthly", "yearly"]),
                name="diary_summary_unique_owner_period",
            ),
        ]

    def save(self, *args, **kwargs):
        # 正文以 Markdown 为准；stripped 供列表搜索使用。
        if self.description_md:
            self.description_stripped = strip_tags(self.description_md)
        else:
            self.description_stripped = (
                None
                if (self.description_html == "" or self.description_html is None)
                else strip_tags(self.description_html)
            )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.owner.email} <{self.title or self.diary_date}>"


class DiaryLink(BaseModel):
    """日记的关联：同类链接（其他日记）与异类链接（任务 / 项目 / 问题）。

    每一条记录代表一对独立关系，双向可见；删除时两端同步解除。
    """

    class TargetType(models.TextChoices):
        DIARY = "diary", "日记"
        TASK = "task", "任务"
        PROJECT = "project", "项目"
        ISSUE = "issue", "问题"

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="diary_links")
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="diary_links")

    diary = models.ForeignKey("db.Diary", on_delete=models.CASCADE, related_name="diary_links")
    target_type = models.CharField(max_length=16, choices=TargetType.choices)
    target_id = models.UUIDField()

    class Meta:
        verbose_name = "Diary Link"
        verbose_name_plural = "Diary Links"
        db_table = "diary_links"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["diary", "target_type"], name="diarylink_diary_type_idx"),
            models.Index(fields=["target_type", "target_id"], name="diarylink_target_idx"),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["diary", "target_type", "target_id"],
                condition=models.Q(deleted_at__isnull=True),
                name="diarylink_unique_pair_when_deleted_at_null",
            ),
        ]

    def __str__(self):
        return f"{self.diary_id} -> {self.target_type}:{self.target_id}"


class Plan(BaseModel):
    """计划：记录准备做的事情，与日记分别保存。"""

    class Recurrence(models.TextChoices):
        NONE = "none", "不重复"
        DAILY = "daily", "每天"
        WEEKDAYS = "weekdays", "工作日"
        WEEKLY = "weekly", "每周指定星期"
        MONTHLY = "monthly", "每月指定日期"

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="plans")
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="plans")

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")

    is_pinned = models.BooleanField(default=False)
    # 计划级完成状态（列表「全部 / 未完成 / 已完成」筛选），手动勾选。
    is_completed = models.BooleanField(default=False)

    # 重复规则。
    recurrence = models.CharField(max_length=16, choices=Recurrence.choices, default=Recurrence.NONE)
    recurrence_interval = models.PositiveIntegerField(default=1)
    # weekly：ISO 星期，0=周一 … 6=周日。
    recurrence_byweekday = models.JSONField(default=list, blank=True)
    # monthly：每月第几日。
    recurrence_bymonthday = models.PositiveSmallIntegerField(null=True, blank=True)
    recurrence_start_date = models.DateField(null=True, blank=True)
    recurrence_end_date = models.DateField(null=True, blank=True)

    sort_order = models.FloatField(default=65535)

    class Meta:
        verbose_name = "Plan"
        verbose_name_plural = "Plans"
        db_table = "plans"
        ordering = ("-is_pinned", "-created_at")
        indexes = [
            models.Index(fields=["workspace", "owner"], name="plan_owner_idx"),
        ]

    def __str__(self):
        return str(self.title)


class PlanOccurrence(BaseModel):
    """计划在某一天的安排（日历实例）。

    一条重复计划对应多次安排；每次安排可单独勾选完成。删除单次以 is_deleted 软删标记。
    """

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="plan_occurrences")
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="plan_occurrences")

    plan = models.ForeignKey("db.Plan", on_delete=models.CASCADE, related_name="occurrences")
    date = models.DateField()
    is_completed = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    sort_order = models.FloatField(default=65535)

    # 「只修改当天」的内容覆盖。
    override_title = models.CharField(max_length=255, blank=True, default="")
    override_description = models.TextField(blank=True, default="")

    class Meta:
        verbose_name = "Plan Occurrence"
        verbose_name_plural = "Plan Occurrences"
        db_table = "plan_occurrences"
        ordering = ("date", "sort_order")
        indexes = [
            models.Index(fields=["plan", "date"], name="planocc_plan_date_idx"),
            models.Index(fields=["workspace", "owner", "date"], name="planocc_owner_date_idx"),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["plan", "date"],
                condition=models.Q(is_deleted=False),
                name="planocc_unique_plan_date_when_active",
            ),
        ]

    def __str__(self):
        return f"{self.plan_id} @ {self.date}"

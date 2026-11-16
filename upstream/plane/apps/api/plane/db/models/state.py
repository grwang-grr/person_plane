# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import models
from django.template.defaultfilters import slugify
from django.db.models import Q

# Module imports
from .project import ProjectBaseModel
from plane.db.mixins import SoftDeletionManager


class StateGroup(models.TextChoices):
    BACKLOG = "backlog", "Backlog"
    UNSTARTED = "unstarted", "Unstarted"
    STARTED = "started", "Started"
    ACCEPTANCE = "acceptance", "Acceptance"
    COMPLETED = "completed", "Completed"
    CANCELLED = "cancelled", "Cancelled"
    TRIAGE = "triage", "Triage"


# Seed rows for the group definitions every project starts with. "key" is what
# State.group stores; the built-in keys are the ones the analytics layer buckets
# on, so they must not be renamed or deleted. Anything a user adds afterwards is
# free-form and simply gets counted wherever the code groups by the raw value.
DEFAULT_STATE_GROUPS = [
    {"key": "backlog", "name": "待办", "color": "#60646C", "sequence": 15000, "is_builtin": True, "is_terminal": False},
    {
        "key": "unstarted",
        "name": "未开始",
        "color": "#3F76FF",
        "sequence": 25000,
        "is_builtin": True,
        "is_terminal": False,
    },
    {
        "key": "started",
        "name": "进行中",
        "color": "#F59E0B",
        "sequence": 35000,
        "is_builtin": True,
        "is_terminal": False,
    },
    {
        "key": "acceptance",
        "name": "验收",
        "color": "#8B5CF6",
        "sequence": 45000,
        "is_builtin": True,
        "is_terminal": False,
    },
    {
        "key": "completed",
        "name": "已完成",
        "color": "#46A758",
        "sequence": 55000,
        "is_builtin": True,
        "is_terminal": True,
    },
    {
        "key": "cancelled",
        "name": "已取消",
        "color": "#9AA4BC",
        "sequence": 65000,
        "is_builtin": True,
        "is_terminal": True,
    },
    {
        "key": "triage",
        "name": "待分拣",
        "color": "#4E5355",
        "sequence": 75000,
        "is_builtin": True,
        "is_terminal": False,
    },
]


# Default states
DEFAULT_STATES = [
    {
        "name": "待规划",
        "color": "#60646C",
        "sequence": 15000,
        "group": StateGroup.BACKLOG.value,
        "default": True,
    },
    {
        "name": "未开始",
        "color": "#60646C",
        "sequence": 25000,
        "group": StateGroup.UNSTARTED.value,
    },
    {
        "name": "进行中",
        "color": "#F59E0B",
        "sequence": 35000,
        "group": StateGroup.STARTED.value,
    },
    {
        "name": "已完成",
        "color": "#46A758",
        "sequence": 45000,
        "group": StateGroup.COMPLETED.value,
    },
    {
        "name": "已取消",
        "color": "#9AA4BC",
        "sequence": 55000,
        "group": StateGroup.CANCELLED.value,
    },
    {
        "name": "待分拣",
        "color": "#4E5355",
        "sequence": 65000,
        "group": StateGroup.TRIAGE.value,
    },
]


class StateManager(SoftDeletionManager):
    """Default manager - excludes triage states"""

    def get_queryset(self):
        return super().get_queryset().exclude(group=StateGroup.TRIAGE.value)


class TriageStateManager(SoftDeletionManager):
    """Manager for triage states only"""

    def get_queryset(self):
        return super().get_queryset().filter(group=StateGroup.TRIAGE.value)


class State(ProjectBaseModel):
    name = models.CharField(max_length=255, verbose_name="State Name")
    description = models.TextField(verbose_name="State Description", blank=True)
    color = models.CharField(max_length=255, verbose_name="State Color")
    slug = models.SlugField(max_length=100, blank=True)
    sequence = models.FloatField(default=65535)
    group = models.CharField(
        default=StateGroup.BACKLOG,
        max_length=32,
    )
    is_triage = models.BooleanField(default=False)
    default = models.BooleanField(default=False)
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)

    objects = StateManager()
    all_state_objects = models.Manager()
    triage_objects = TriageStateManager()

    def __str__(self):
        """Return name of the state"""
        return f"{self.name} <{self.project.name}>"

    class Meta:
        unique_together = ["name", "project", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["name", "project"],
                condition=Q(deleted_at__isnull=True),
                name="state_unique_name_project_when_deleted_at_null",
            )
        ]
        verbose_name = "State"
        verbose_name_plural = "States"
        db_table = "states"
        ordering = ("sequence",)

    def save(self, *args, **kwargs):
        self.slug = slugify(self.name)
        if self._state.adding:
            # Get the maximum sequence value from the database
            last_id = State.objects.filter(project=self.project).aggregate(largest=models.Max("sequence"))["largest"]
            # if last_id is not None
            if last_id is not None:
                self.sequence = last_id + 15000

        return super().save(*args, **kwargs)


class StateGroupDef(ProjectBaseModel):
    """A grouping bucket that states can be assigned to.

    The built-in buckets (`DEFAULT_STATE_GROUPS`) ship with every project and
    carry the semantics the analytics layer keys on, so their `key` is frozen.
    Users may rename and recolor them and may add their own buckets alongside
    them; those are counted anywhere the code groups by `State.group` verbatim.
    """

    key = models.SlugField(max_length=32, verbose_name="Group Key")
    name = models.CharField(max_length=64, verbose_name="Group Name")
    color = models.CharField(max_length=32, verbose_name="Group Color")
    sequence = models.FloatField(default=65535)
    is_builtin = models.BooleanField(default=False)
    is_terminal = models.BooleanField(default=False)

    objects = SoftDeletionManager()

    def __str__(self):
        return f"{self.name} ({self.key}) <{self.project.name}>"

    class Meta:
        unique_together = ["key", "project", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["key", "project"],
                condition=Q(deleted_at__isnull=True),
                name="state_group_def_unique_key_project_when_deleted_at_null",
            )
        ]
        verbose_name = "State Group"
        verbose_name_plural = "State Groups"
        db_table = "state_group_defs"
        ordering = ("sequence",)


def seed_state_groups(project, user):
    """Create the built-in group definitions for a newly created project."""
    return StateGroupDef.objects.bulk_create(
        [
            StateGroupDef(
                project=project,
                workspace=project.workspace,
                key=group["key"],
                name=group["name"],
                color=group["color"],
                sequence=group["sequence"],
                is_builtin=group["is_builtin"],
                is_terminal=group.get("is_terminal", False),
                created_by=user,
            )
            for group in DEFAULT_STATE_GROUPS
        ]
    )

# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import date, timedelta

from plane.db.models import Plan, PlanOccurrence


def materialize_occurrences(plan: Plan) -> None:
    """按重复规则把计划铺到日历（生成 PlanOccurrence 实例）。

    已存在的安排（含勾选、覆盖）保持不变，仅补足缺失日期。
    """
    if not plan.recurrence_start_date or plan.recurrence == Plan.Recurrence.NONE:
        return

    start = plan.recurrence_start_date
    end = plan.recurrence_end_date
    # Tombstones are intentional exceptions, not missing dates to regenerate.
    existing = set(plan.occurrences.values_list("date", flat=True))

    cursor = start
    limit = 400  # 安全上限，避免异常规则生成过多
    created = []
    while limit > 0 and (end is None or cursor <= end):
        if cursor not in existing and _matches_rule(plan, cursor):
            created.append(
                PlanOccurrence(
                    workspace=plan.workspace,
                    owner=plan.owner,
                    plan=plan,
                    date=cursor,
                )
            )
        if cursor == date.max:
            break
        cursor += timedelta(days=1)
        limit -= 1
    if created:
        PlanOccurrence.objects.bulk_create(created, ignore_conflicts=True)


def _matches_rule(plan: Plan, day: date) -> bool:
    if plan.recurrence == Plan.Recurrence.DAILY:
        if plan.recurrence_interval <= 1:
            return True
        offset = day.toordinal() - plan.recurrence_start_date.toordinal()
        return offset % plan.recurrence_interval == 0
    if plan.recurrence == Plan.Recurrence.WEEKDAYS:
        return day.weekday() < 5
    if plan.recurrence == Plan.Recurrence.WEEKLY:
        byweekday = plan.recurrence_byweekday or []
        return day.weekday() in byweekday
    if plan.recurrence == Plan.Recurrence.MONTHLY:
        return day.day == plan.recurrence_bymonthday
    return False

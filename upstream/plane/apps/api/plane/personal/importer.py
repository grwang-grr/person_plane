"""Atomic, repeatable import from the previous WPlane SQLite schema."""

from __future__ import annotations

import hashlib
import json
import sqlite3
from contextlib import closing
from datetime import UTC, datetime
from html import escape
from pathlib import Path

from django.db import transaction
from django.utils.dateparse import parse_datetime

from plane.db.models import (
    DraftIssue,
    DraftIssueAssignee,
    DraftIssueLabel,
    Issue,
    IssueAssignee,
    IssueLabel,
    IssueSequence,
    IssueSubscriber,
    Label,
    Project,
    ProjectIdentifier,
    ProjectMember,
    State,
    Sticky,
    UserRecentVisit,
)
from plane.personal.identity import bootstrap_identity
from plane.personal.models import LegacyRecord, PersonalSetting

STATE_NAMES = {
    "backlog": ("待规划", "#60646C"),
    "unstarted": ("未开始", "#3b82f6"),
    "started": ("进行中", "#F59E0B"),
    "completed": ("已完成", "#46A758"),
    "cancelled": ("已取消", "#9AA4BC"),
}
STICKY_COLORS = {
    "purple": "#e2d9ff",
    "yellow": "#fff3bd",
    "pink": "#fddde9",
    "blue": "#dbeaff",
    "green": "#d9f5dc",
    "orange": "#ffe2c2",
    "gray": "#e9eaec",
    "white": "#ffffff",
}


def rich_text(text: str) -> tuple[dict, str]:
    lines = text.splitlines() or [""]
    paragraphs = [
        {"type": "paragraph", **({"content": [{"type": "text", "text": line}]} if line else {})} for line in lines
    ]
    return {"type": "doc", "content": paragraphs}, "".join(f"<p>{escape(line)}</p>" for line in lines)


def timestamp(value: str | None) -> datetime | None:
    if not value:
        return None
    parsed = parse_datetime(value)
    if parsed is None:
        raise ValueError("旧数据包含无效时间。")
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=UTC)


def preserve_times(model, row: dict) -> None:
    values = {key: timestamp(row[key]) for key in ("created_at", "updated_at") if row.get(key)}
    if values:
        model.all_objects.filter(pk=row["id"]).update(**values)


def read_source(path: Path) -> dict[str, list[dict]]:
    with closing(sqlite3.connect(path.resolve().as_uri() + "?mode=ro", uri=True)) as connection:
        connection.row_factory = sqlite3.Row
        connection.execute("BEGIN")
        tables = [
            row[0]
            for row in connection.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
            )
        ]
        result = {}
        for table in tables:
            quoted = table.replace('"', '""')
            result[table] = [dict(row) for row in connection.execute(f'SELECT * FROM "{quoted}" ORDER BY rowid')]
        return result


@transaction.atomic
def import_legacy(path: Path) -> dict:
    rows = read_source(path)
    fingerprint = hashlib.sha256(json.dumps(rows, sort_keys=True, ensure_ascii=False).encode()).hexdigest()
    previous = PersonalSetting.objects.filter(key="legacy_import").first()
    if previous:
        if previous.value["fingerprint"] != fingerprint:
            raise ValueError("旧数据库自导入后发生变化，已拒绝覆盖个人版数据。请先核对增量。")
        return {**previous.value, "already_imported": True}
    user, workspace = bootstrap_identity()
    projects = {}
    states = {}
    for row in rows.get("projects", []):
        if Project.all_objects.filter(pk=row["id"]).exists():
            raise ValueError("项目 ID 与目标数据库冲突，导入已回滚。")
        project = Project.objects.create(
            id=row["id"],
            workspace=workspace,
            name=row["name"],
            identifier=row["identifier"],
            description=row["description"],
            timezone=user.user_timezone,
            created_by_id=user.id,
        )
        projects[row["id"]] = project
        ProjectMember.objects.create(project=project, member=user, role=20)
        ProjectIdentifier.objects.create(project=project, workspace=workspace, name=project.identifier)
        for index, (group, (name, color)) in enumerate(STATE_NAMES.items()):
            states[(row["id"], group)] = State.objects.create(
                project=project,
                name=name,
                color=color,
                group=group,
                default=index == 0,
                sequence=(index + 1) * 10000,
                created_by_id=user.id,
            )
        preserve_times(Project, row)
        State.all_state_objects.create(
            project=project,
            workspace=workspace,
            group="triage",
            is_triage=True,
            name="待分拣",
            color="#4E5355",
            sequence=65000,
            created_by_id=user.id,
        )
    items = {}
    labels = {}
    for row in rows.get("work_items", []):
        project = projects[row["project_id"]]
        model = DraftIssue if row["is_draft"] else Issue
        description_json, description_html = rich_text(row["description"])
        item = model(
            id=row["id"],
            project=project,
            workspace=workspace,
            name=row["title"],
            description_json=description_json,
            description_html=description_html,
            description_stripped=row["description"],
            priority=row["priority"],
            state=states[(row["project_id"], row["state"])],
            start_date=row["start_date"],
            target_date=row["due_date"],
            deleted_at=timestamp(row["updated_at"]) if row["deleted"] else None,
            created_by=user,
            external_source="wplane",
            external_id=row["id"],
        )
        if not row["is_draft"]:
            if row["number"] is None:
                raise ValueError("正式任务缺少编号，导入已回滚。")
            item.sequence_id = row["number"]
        if row["state"] == "completed":
            item.completed_at = timestamp(row["updated_at"])
        # Import preserves original sequence IDs rather than allocating new IDs.
        model.objects.bulk_create([item])
        preserve_times(model, row)
        items[row["id"]] = item
        if not row["is_draft"]:
            IssueSequence.objects.create(
                issue=item,
                sequence=item.sequence_id,
                project=project,
                deleted=bool(row["deleted"]),
            )
        if row.get("assigned_to_me"):
            if row["is_draft"]:
                DraftIssueAssignee.objects.create(draft_issue=item, assignee=user, project=project)
            else:
                IssueAssignee.objects.create(issue=item, assignee=user, project=project)
        if row.get("subscribed") and not row["is_draft"]:
            IssueSubscriber.objects.create(issue=item, subscriber=user, project=project)
        for name in json.loads(row["tags"]):
            key = (project.id, name)
            if key not in labels:
                labels[key] = Label.objects.create(project=project, workspace=workspace, name=name, color="#60646C")
            if row["is_draft"]:
                DraftIssueLabel.objects.create(draft_issue=item, label=labels[key], project=project)
            else:
                IssueLabel.objects.create(issue=item, label=labels[key], project=project)
    for row in rows.get("work_items", []):
        if row["parent_id"]:
            parent = items[row["parent_id"]]
            if not isinstance(parent, Issue) or str(parent.project_id) != row["project_id"]:
                raise ValueError("原版不支持该父任务关联，请先核对业务规则；本次导入已回滚。")
            type(items[row["id"]]).all_objects.filter(pk=row["id"]).update(parent=parent)
    for row in rows.get("projects", []):
        project = projects[row["id"]]
        next_number = row["next_number"]
        maximum = max(
            (item.sequence_id for item in items.values() if isinstance(item, Issue) and item.project_id == project.id),
            default=0,
        )
        if next_number - 1 > maximum:
            IssueSequence.objects.create(project=project, sequence=next_number - 1, deleted=True)
    for row in rows.get("stickies", []):
        description_json, description_html = rich_text(row["content"])
        sticky = Sticky.objects.create(
            id=row["id"],
            workspace=workspace,
            owner=user,
            name=row["title"],
            description=description_json,
            description_html=description_html,
            background_color=STICKY_COLORS.get(row["color"], row["color"]),
            deleted_at=timestamp(row["updated_at"]) if row["deleted"] else None,
            created_by_id=user.id,
        )
        preserve_times(Sticky, row)
        PersonalSetting.objects.create(key=f"sticky:{sticky.id}", value={"tags": json.loads(row["tags"])})
    for row in rows.get("local_profile", []):
        user.display_name = row["name"]
        user.first_name = row["name"]
        user.user_timezone = row["timezone"]
        user.save(update_fields=["display_name", "first_name", "user_timezone"])
        PersonalSetting.objects.create(
            key="local_profile", value={"handle": row["handle"], "avatar_color": row["avatar_color"]}
        )
    for row in rows.get("recents", []):
        kind = {"item": "issue", "project": "project"}.get(row["entity_type"])
        if kind:
            item = items.get(row["entity_id"])
            visit = UserRecentVisit.objects.create(
                id=row["id"],
                workspace=workspace,
                user=user,
                entity_name=kind,
                entity_identifier=row["entity_id"],
                visited_at=timestamp(row["updated_at"]),
                project=projects.get(row["entity_id"]) if kind == "project" else (item.project if item else None),
            )
            UserRecentVisit.objects.filter(pk=visit.pk).update(visited_at=timestamp(row["updated_at"]))
    # Preserve every source column, including activity history and personal flags
    # with no upstream equivalent. These remain available for the personal UI.
    LegacyRecord.objects.bulk_create(
        [
            LegacyRecord(source_table=table, source_id=str(row.get("id", index)), payload=row)
            for table, records in rows.items()
            for index, row in enumerate(records)
        ]
    )
    report = {
        "fingerprint": fingerprint,
        "source": str(path.resolve()),
        "imported_at": datetime.now(UTC).isoformat(),
        "counts": {table: len(records) for table, records in rows.items()},
    }
    PersonalSetting.objects.create(key="legacy_import", value=report)
    return report

from __future__ import annotations

from uuid import UUID

from django.db import transaction
from django.db.models import Case, IntegerField, Q, Value, When
from django.utils import timezone
from rest_framework.exceptions import APIException, NotFound, ValidationError

from plane.db.models import Issue, Project
from plane.personal.identity import LOCAL_WORKSPACE_ID
from plane.personal.models import Problem, ProblemCounter, ProblemEntry, ProblemLabel
from plane.personal.storage import LocalStorage


class Conflict(APIException):
    status_code = 409
    default_detail = "此问题已在其他页面更新，请重新加载后再保存。"


def problems():
    return (
        Problem.objects.filter(workspace_id=LOCAL_WORKSPACE_ID)
        .select_related("project", "task", "task__project")
        .prefetch_related("labels")
    )


@transaction.atomic
def sync_relations() -> None:
    # Also catches upstream bulk task moves, which do not emit post_save signals.
    for problem in problems().filter(task__isnull=False):
        if problem.task.workspace_id != LOCAL_WORKSPACE_ID:
            continue
        if problem.project_id != problem.task.project_id:
            previous = str(problem.project_id) if problem.project_id else None
            problem.project_id = problem.task.project_id
            problem.revision += 1
            problem.save(update_fields=["project", "revision", "updated_at"])
            ProblemEntry.objects.create(
                problem=problem,
                changes={"project_id": [previous, str(problem.project_id)]},
                text="任务移动后同步关联项目",
            )


def get_problem(problem_id: UUID, *, deleted: bool = False) -> Problem:
    sync_relations()
    problem = problems().filter(pk=problem_id, deleted_at__isnull=not deleted).first()
    if not problem:
        raise NotFound("问题不存在或已移入回收站。")
    return problem


def project_data(project: Project | None) -> dict | None:
    if not project:
        return None
    return {
        "id": str(project.id),
        "name": project.name,
        "identifier": project.identifier,
        "archived": bool(project.archived_at),
        "deleted": bool(project.deleted_at),
    }


def task_data(task: Issue | None) -> dict | None:
    if not task:
        return None
    return {
        "id": str(task.id),
        "name": task.name,
        "number": f"{task.project.identifier}-{task.sequence_id}",
        "project_id": str(task.project_id),
        "project_name": task.project.name,
        "archived": bool(task.archived_at or task.project.archived_at),
        "deleted": bool(task.deleted_at or task.project.deleted_at),
    }


def serialize(problem: Problem, *, detail: bool = False) -> dict:
    result = {
        "id": str(problem.id),
        "number": f"问-{problem.number:06d}",
        "title": problem.title,
        "description_html": problem.description_html,
        "project": project_data(problem.project),
        "task": task_data(problem.task),
        "priority": problem.priority,
        "severity": problem.severity,
        "status": problem.status,
        "kind": problem.kind,
        "due_date": problem.due_date,
        "resolution": problem.resolution,
        "revision": problem.revision,
        "labels": sorted(label.name for label in problem.labels.all()),
        "created_at": problem.created_at,
        "updated_at": problem.updated_at,
        "closed_at": problem.closed_at,
        "deleted_at": problem.deleted_at,
        "overdue": bool(
            problem.due_date and problem.due_date < timezone.localdate() and problem.status != Problem.Status.CLOSED
        ),
    }
    if detail:
        result["entries"] = [
            {"id": str(e.id), "text": e.text, "changes": e.changes, "created_at": e.created_at}
            for e in problem.entries.all()
        ]
        result["attachments"] = [
            {
                "id": str(a.id),
                "name": a.name,
                "size": a.size,
                "created_at": a.created_at,
                "url": LocalStorage().generate_presigned_url(
                    a.key, disposition="attachment", filename=a.name, content_type=a.content_type
                ),
            }
            for a in problem.attachments.filter(deleted_at__isnull=True).order_by("created_at")
        ]
    return result


def check_revision(problem: Problem, revision: int | None) -> None:
    if revision != problem.revision:
        raise Conflict()


@transaction.atomic
def save_problem(data: dict, problem: Problem | None = None) -> Problem:
    data = dict(data)
    creating = problem is None
    if creating:
        counter, _ = ProblemCounter.objects.get_or_create(workspace_id=LOCAL_WORKSPACE_ID)
        counter = ProblemCounter.objects.select_for_update().get(pk=counter.pk)
        problem = Problem(workspace_id=LOCAL_WORKSPACE_ID, number=counter.next_number)
        counter.next_number += 1
        counter.save(update_fields=["next_number"])
    else:
        problem = get_problem(problem.id)
        check_revision(problem, data.pop("revision", None))
    data.pop("revision", None)
    task_id = data.get("task_id", problem.task_id)
    project_id = data.get("project_id", problem.project_id)
    if task_id:
        task = Issue.all_objects.select_related("project").filter(pk=task_id, workspace_id=LOCAL_WORKSPACE_ID).first()
        if task is None:
            raise ValidationError("关联任务不存在。")
        if (creating or task_id != problem.task_id) and (
            task.deleted_at or task.archived_at or task.project.deleted_at or task.project.archived_at or task.is_draft
        ):
            raise ValidationError("请选择未归档、未删除的正式任务。")
        if "project_id" in data and project_id and project_id != task.project_id:
            raise ValidationError("关联任务与项目不一致，请重新选择。")
        data["project_id"] = task.project_id
    elif project_id:
        project = Project.all_objects.filter(pk=project_id, workspace_id=LOCAL_WORKSPACE_ID).first()
        if project is None:
            raise ValidationError("关联项目不存在。")
        if (creating or project_id != problem.project_id) and (project.deleted_at or project.archived_at):
            raise ValidationError("请选择未归档、未删除的项目。")
    status = data.get("status", problem.status)
    if status == Problem.Status.CLOSED and not data.get("resolution", problem.resolution).strip():
        raise ValidationError({"resolution": "关闭问题前请填写处理结果。"})
    changes = {}
    labels = data.pop("labels", None)
    if labels is not None:
        labels = sorted(set(label.strip() for label in labels if label.strip()))
        before = sorted(problem.labels.values_list("name", flat=True)) if not creating else []
        if before != labels:
            changes["labels"] = [before, labels]
    for key, value in data.items():
        before = getattr(problem, key)
        if before != value:
            changes[key] = [str(before) if before is not None else None, str(value) if value is not None else None]
        setattr(problem, key, value)
    if creating or "status" in changes:
        problem.closed_at = timezone.now() if status == Problem.Status.CLOSED else None
    if not creating:
        problem.revision += 1
    problem.save()
    if labels is not None:
        problem.labels.set(
            [ProblemLabel.objects.get_or_create(workspace_id=LOCAL_WORKSPACE_ID, name=name)[0] for name in labels]
        )
    ProblemEntry.objects.create(problem=problem, text="创建问题" if creating else "更新问题", changes=changes)
    return get_problem(problem.id)


@transaction.atomic
def change_deleted(problem_id: UUID, revision: int | None, *, restore: bool) -> Problem:
    problem = get_problem(problem_id, deleted=restore)
    check_revision(problem, revision)
    problem.deleted_at = None if restore else timezone.now()
    problem.revision += 1
    problem.save(update_fields=["deleted_at", "revision", "updated_at"])
    ProblemEntry.objects.create(problem=problem, text="从回收站恢复问题" if restore else "移至回收站")
    return problem


def list_problems(params) -> dict:
    sync_relations()
    view = params.get("view", "open")
    if view not in {"open", "important", "closed", "all", "trash"}:
        raise ValidationError("问题视图无效。")
    all_rows = problems()
    active = all_rows.filter(deleted_at__isnull=True)
    important = Q(priority__in=["urgent", "high"]) | Q(severity__in=["critical", "major"])
    counts = {
        "all": active.count(),
        "open": active.exclude(status="closed").count(),
        "closed": active.filter(status="closed").count(),
        "important": active.exclude(status="closed").filter(important).count(),
        "trash": all_rows.filter(deleted_at__isnull=False).count(),
    }
    rows = all_rows.filter(deleted_at__isnull=False) if view == "trash" else active
    status_counts = {status: active.filter(status=status).count() for status in Problem.Status.values}
    if view == "open":
        rows = rows.exclude(status="closed")
    if view == "closed":
        rows = rows.filter(status="closed")
    if view == "important":
        rows = rows.exclude(status="closed").filter(important)
    query = params.get("q", "").strip()[:200]
    if query:
        match = Q(title__icontains=query)
        number = query.removeprefix("问-")
        if number.isdecimal() and len(number) < 12:
            match |= Q(number=int(number))
        rows = rows.filter(match)
    for key, choices in (
        ("priority", Problem.Priority.values),
        ("severity", Problem.Severity.values),
        ("status", Problem.Status.values),
        ("kind", Problem.Kind.values),
    ):
        if value := params.get(key):
            if value not in choices:
                raise ValidationError("筛选值无效。")
            rows = rows.filter(**{key: value})
    if project := params.get("project"):
        if project == "none":
            rows = rows.filter(project__isnull=True)
        else:
            try:
                rows = rows.filter(project_id=UUID(project))
            except ValueError:
                raise ValidationError("项目标识无效。") from None
    if task := params.get("task"):
        try:
            rows = rows.filter(task_id=UUID(task))
        except ValueError:
            raise ValidationError("任务标识无效。") from None
    if label := params.get("label"):
        rows = rows.filter(labels__name=label).distinct()
    if params.get("overdue") == "1":
        rows = rows.filter(due_date__lt=timezone.localdate()).exclude(status="closed")
    ordering = params.get("order", "importance")
    if ordering == "importance":

        def rank(field, values):
            return Case(
                *[When(**{field: value}, then=Value(i)) for i, value in enumerate(values)],
                default=Value(99),
                output_field=IntegerField(),
            )

        rows = rows.annotate(
            pr=rank("priority", Problem.Priority.values), sr=rank("severity", Problem.Severity.values)
        ).order_by("pr", "sr", "-updated_at", "-id")
    elif ordering in {"-updated_at", "-created_at", "due_date", "number"}:
        rows = rows.order_by(ordering, "-id")
    else:
        raise ValidationError("排序方式无效。")
    try:
        page = max(1, int(params.get("page", 1)))
    except (TypeError, ValueError):
        raise ValidationError("页码无效。") from None
    total = rows.count()
    return {
        "results": [serialize(p) for p in rows[(page - 1) * 50 : page * 50]],
        "total": total,
        "page": page,
        "page_size": 50,
        "counts": counts,
        "status_counts": status_counts,
    }

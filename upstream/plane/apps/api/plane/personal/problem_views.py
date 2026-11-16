from pathlib import Path
import re
from uuid import uuid4

from django.conf import settings
from django.db import transaction
from django.db.models import Q
from django.http import FileResponse
from django.utils import timezone
from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from plane.db.models import Issue, Project
from plane.personal.identity import LOCAL_WORKSPACE_ID
from plane.personal.models import ProblemAttachment, ProblemEntry, ProblemLabel
from plane.personal.problem_schemas import EntryInput, ProblemInput
from plane.personal.problem_service import (
    change_deleted,
    get_problem,
    list_problems,
    project_data,
    save_problem,
    serialize,
    task_data,
)
from plane.personal.storage import asset_path, atomic_write


class PersonalProblemView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]


class ProblemList(PersonalProblemView):
    def get(self, request):
        return Response(list_problems(request.query_params))

    def post(self, request):
        schema = ProblemInput(data=request.data)
        schema.is_valid(raise_exception=True)
        return Response(serialize(save_problem(schema.validated_data), detail=True), status=201)


class ProblemDetail(PersonalProblemView):
    def get(self, request, problem_id):
        deleted = request.query_params.get("deleted") == "1"
        return Response(serialize(get_problem(problem_id, deleted=deleted), detail=True))

    def patch(self, request, problem_id):
        schema = ProblemInput(data=request.data, partial=True)
        schema.is_valid(raise_exception=True)
        return Response(serialize(save_problem(schema.validated_data, get_problem(problem_id)), detail=True))

    def delete(self, request, problem_id):
        change_deleted(problem_id, request.data.get("revision"), restore=False)
        return Response(status=204)


class ProblemRestore(PersonalProblemView):
    def post(self, request, problem_id):
        return Response(serialize(change_deleted(problem_id, request.data.get("revision"), restore=True), detail=True))


class ProblemEntries(PersonalProblemView):
    @transaction.atomic
    def post(self, request, problem_id):
        schema = EntryInput(data=request.data)
        schema.is_valid(raise_exception=True)
        problem = get_problem(problem_id)
        ProblemEntry.objects.create(problem=problem, **schema.validated_data)
        problem.updated_at = timezone.now()
        problem.save(update_fields=["updated_at"])
        return Response(serialize(problem, detail=True), status=201)


class ProblemOptions(PersonalProblemView):
    def get(self, request):
        projects = Project.all_objects.filter(workspace_id=LOCAL_WORKSPACE_ID)
        if request.query_params.get("include_inactive") != "1":
            projects = projects.filter(deleted_at__isnull=True, archived_at__isnull=True)
        if project_query := request.query_params.get("project_q", "")[:200]:
            projects = projects.filter(Q(name__icontains=project_query) | Q(identifier__icontains=project_query))
        tasks = (
            Issue.all_objects.select_related("project")
            .filter(
                workspace_id=LOCAL_WORKSPACE_ID,
                deleted_at__isnull=True,
                archived_at__isnull=True,
                is_draft=False,
                project__deleted_at__isnull=True,
                project__archived_at__isnull=True,
            )
            .filter(Q(type__isnull=True) | Q(type__is_epic=False))
        )
        if project_id := request.query_params.get("project"):
            from uuid import UUID

            try:
                tasks = tasks.filter(project_id=UUID(project_id))
            except ValueError:
                raise ValidationError("项目标识无效。") from None
        if query := request.query_params.get("q", "")[:200]:
            match = (
                Q(name__icontains=query) | Q(project__name__icontains=query) | Q(project__identifier__icontains=query)
            )
            number = query.rsplit("-", 1)[-1]
            if number.isdecimal() and len(number) < 12:
                match |= Q(sequence_id=int(number))
            tasks = tasks.filter(match)
        return Response(
            {
                "projects": [project_data(p) for p in projects.order_by("name", "id")[:200]],
                "tasks": [task_data(t) for t in tasks.order_by("-updated_at", "id")[:100]],
                "task_count": tasks.count(),
                "labels": list(
                    ProblemLabel.objects.filter(workspace_id=LOCAL_WORKSPACE_ID)
                    .order_by("name")
                    .values_list("name", flat=True)
                ),
            }
        )


class ProblemAttachments(PersonalProblemView):
    @transaction.atomic
    def post(self, request, problem_id):
        problem = get_problem(problem_id)
        file = request.FILES.get("file")
        if not file or file.size <= 0:
            raise ValidationError("请选择非空附件。")
        if file.size > settings.FILE_SIZE_LIMIT:
            raise ValidationError("附件超过允许的大小。")
        name = (
            "".join(
                char for char in file.name.replace("\\", "/").rsplit("/", 1)[-1] if ord(char) >= 32 and ord(char) != 127
            )[:255]
            or "附件"
        )
        suffix = Path(name).suffix
        suffix = suffix if re.fullmatch(r"\.[A-Za-z0-9]{1,10}", suffix) else ""
        key = f"problems/{problem.id}/{uuid4().hex}{suffix}"
        try:
            atomic_write(file, key, settings.FILE_SIZE_LIMIT)
            ProblemAttachment.objects.create(
                problem=problem,
                name=name,
                key=key,
                size=file.size,
                content_type=(file.content_type or "application/octet-stream")[:255],
            )
            ProblemEntry.objects.create(problem=problem, text=f"添加附件：{name}")
        except Exception:
            asset_path(key).unlink(missing_ok=True)
            raise
        return Response(serialize(problem, detail=True), status=201)


class ProblemAttachmentDetail(PersonalProblemView):
    def get(self, request, problem_id, attachment_id):
        problem = get_problem(problem_id)
        attachment = problem.attachments.filter(pk=attachment_id, deleted_at__isnull=True).first()
        if not attachment or not asset_path(attachment.key).is_file():
            raise NotFound("附件不存在。")
        response = FileResponse(asset_path(attachment.key).open("rb"), as_attachment=True, filename=attachment.name)
        response["X-Content-Type-Options"] = "nosniff"
        return response

    @transaction.atomic
    def delete(self, request, problem_id, attachment_id):
        problem = get_problem(problem_id)
        attachment = problem.attachments.filter(pk=attachment_id, deleted_at__isnull=True).first()
        if not attachment:
            raise NotFound("附件不存在。")
        attachment.deleted_at = timezone.now()
        attachment.save(update_fields=["deleted_at"])
        ProblemEntry.objects.create(problem=problem, text=f"移除附件：{attachment.name}")
        return Response(serialize(problem, detail=True))

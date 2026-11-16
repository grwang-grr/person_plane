# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from datetime import timedelta

from django.db import transaction
from django.db.models import Prefetch, Q
from django.shortcuts import get_object_or_404
from django.utils.functional import cached_property

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import WorkspaceUserPermission
from plane.app.serializers import (
    DiaryLinkSerializer,
    DiarySerializer,
    DiaryTemplateSerializer,
    PlanOccurrenceSerializer,
    PlanSerializer,
)
from plane.app.views.base import BaseViewSet
from plane.app.serializers.diary import (
    DiaryDateRangeSerializer,
    PlanDeleteSerializer,
    PlanOccurrenceCreateSerializer,
)
from plane.db.models import Diary, DiaryLink, DiaryTemplate, Plan, PlanOccurrence, Workspace
from plane.utils.plan_recurrence import materialize_occurrences

SUMMARY_TYPES = (Diary.Type.WEEKLY, Diary.Type.MONTHLY, Diary.Type.YEARLY)


def _summary_conflict(owner, diary_type, period_key, exclude_pk=None) -> bool:
    """周 / 月 / 年总结每周期仅一篇（与 diary_summary_unique_owner_period 约束一致）。"""
    if diary_type not in SUMMARY_TYPES or not period_key:
        return False
    queryset = Diary.objects.filter(owner=owner, diary_type=diary_type, period_key=period_key)
    if exclude_pk:
        queryset = queryset.exclude(pk=exclude_pk)
    return queryset.exists()


class DiaryBaseViewSet(BaseViewSet):
    permission_classes = [WorkspaceUserPermission]
    use_read_replica = True

    def get_workspace(self):
        return get_object_or_404(Workspace, slug=self.kwargs.get("slug"))

    @cached_property
    def date_range(self):
        serializer = DiaryDateRangeSerializer(data=self.request.query_params)
        serializer.is_valid(raise_exception=True)
        return serializer.validated_data


class DiaryViewSet(DiaryBaseViewSet):
    serializer_class = DiarySerializer
    model = Diary

    def get_queryset(self):
        return (
            self.filter_queryset(super().get_queryset())
            .filter(workspace__slug=self.kwargs.get("slug"), owner=self.request.user)
            .select_related("template")
            .distinct()
        )

    def list(self, request, slug):
        queryset = self.get_queryset()
        diary_type = request.query_params.get("diary_type")
        date_from = self.date_range.get("date_from")
        date_to = self.date_range.get("date_to")
        query = request.query_params.get("query")

        if diary_type:
            queryset = queryset.filter(diary_type=diary_type)
        if date_from:
            queryset = queryset.filter(diary_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(diary_date__lte=date_to)
        if query:
            queryset = queryset.filter(Q(title__icontains=query) | Q(description_stripped__icontains=query))

        # 默认按所属日期倒序、主日记优先。
        queryset = queryset.order_by("-diary_date", "-is_primary", "created_at")

        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda diaries: DiarySerializer(diaries, many=True).data,
            default_per_page=20,
        )

    def create(self, request, slug):
        workspace = self.get_workspace()
        serializer = DiarySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        diary_type = serializer.validated_data.get("diary_type", Diary.Type.DAILY)
        period_key = serializer.validated_data.get("period_key", "")
        if _summary_conflict(request.user, diary_type, period_key):
            return Response({"period_key": "该周期已有总结"}, status=status.HTTP_400_BAD_REQUEST)

        diary_date = serializer.validated_data.get("diary_date")
        with transaction.atomic():
            # 当天第一篇默认成为主日记。
            has_primary = Diary.objects.filter(owner=request.user, diary_date=diary_date, is_primary=True).exists()
            serializer.save(
                workspace=workspace,
                owner=request.user,
                is_primary=not has_primary,
            )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, slug, pk):
        diary = self.get_object()
        serializer = DiarySerializer(diary, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        new_type = serializer.validated_data.get("diary_type", diary.diary_type)
        new_period = serializer.validated_data.get("period_key", diary.period_key)
        if _summary_conflict(request.user, new_type, new_period, exclude_pk=diary.pk):
            return Response({"period_key": "该周期已有总结"}, status=status.HTTP_400_BAD_REQUEST)

        extra = {}
        new_date = serializer.validated_data.get("diary_date")
        if new_date and new_date != diary.diary_date and diary.is_primary:
            # 主日记移动到已有主日记的日期时自动降级，避免唯一约束冲突。
            moved_to_primary_day = (
                Diary.objects.filter(owner=request.user, diary_date=new_date, is_primary=True)
                .exclude(pk=diary.pk)
                .exists()
            )
            if moved_to_primary_day:
                extra["is_primary"] = False

        diary = serializer.save(**extra)
        return Response(DiarySerializer(diary).data, status=status.HTTP_200_OK)

    def destroy(self, request, slug, pk):
        diary = self.get_object()
        diary.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def set_primary(self, request, slug, pk):
        """设为某天的主日记，原主日记自动降级。"""
        diary = self.get_object()
        with transaction.atomic():
            Diary.objects.filter(owner=request.user, diary_date=diary.diary_date, is_primary=True).exclude(
                pk=diary.pk
            ).update(is_primary=False)
            diary.is_primary = True
            diary.save(update_fields=["is_primary", "updated_at"])
        return Response(DiarySerializer(diary).data, status=status.HTTP_200_OK)


class DiaryTemplateViewSet(DiaryBaseViewSet):
    serializer_class = DiaryTemplateSerializer
    model = DiaryTemplate

    def get_queryset(self):
        return (
            self.filter_queryset(super().get_queryset())
            .filter(workspace__slug=self.kwargs.get("slug"), owner=self.request.user)
            .distinct()
        )

    def list(self, request, slug):
        queryset = self.get_queryset()
        diary_type = request.query_params.get("diary_type")
        if diary_type:
            queryset = queryset.filter(diary_type=diary_type)
        queryset = queryset.order_by("-is_default", "-created_at")
        return Response(DiaryTemplateSerializer(queryset, many=True).data, status=status.HTTP_200_OK)

    def create(self, request, slug):
        workspace = self.get_workspace()
        serializer = DiaryTemplateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(workspace=workspace, owner=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, slug, pk):
        template = self.get_object()
        serializer = DiaryTemplateSerializer(template, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    def destroy(self, request, slug, pk):
        template = self.get_object()
        template.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DiaryLinkViewSet(DiaryBaseViewSet):
    serializer_class = DiaryLinkSerializer
    model = DiaryLink

    def get_queryset(self):
        return (
            self.filter_queryset(super().get_queryset())
            .filter(workspace__slug=self.kwargs.get("slug"), owner=self.request.user)
            .distinct()
        )

    def list(self, request, slug, diary_id):
        """返回某篇日记的双向关联：自身发起的 + 指向自身的同类关联。"""
        queryset = self.get_queryset().filter(
            Q(diary_id=diary_id) | Q(target_type=DiaryLink.TargetType.DIARY, target_id=diary_id)
        )
        return Response(DiaryLinkSerializer(queryset, many=True).data, status=status.HTTP_200_OK)

    def create(self, request, slug, diary_id):
        workspace = self.get_workspace()
        diary = Diary.objects.get(pk=diary_id, workspace=workspace, owner=request.user)
        serializer = DiaryLinkSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(workspace=workspace, owner=request.user, diary=diary)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, slug, diary_id, pk):
        link = self.get_object()
        link.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PlanViewSet(DiaryBaseViewSet):
    serializer_class = PlanSerializer
    model = Plan

    def get_queryset(self):
        occurrences = PlanOccurrence.objects.filter(is_deleted=False)
        if date_from := self.date_range.get("date_from"):
            occurrences = occurrences.filter(date__gte=date_from)
        if date_to := self.date_range.get("date_to"):
            occurrences = occurrences.filter(date__lte=date_to)
        return (
            self.filter_queryset(super().get_queryset())
            .filter(workspace__slug=self.kwargs.get("slug"), owner=self.request.user)
            .prefetch_related(Prefetch("occurrences", queryset=occurrences, to_attr="visible_occurrences"))
            .distinct()
        )

    def list(self, request, slug):
        queryset = self.get_queryset()
        query = request.query_params.get("query")
        plan_status = request.query_params.get("status")

        if query:
            queryset = queryset.filter(Q(title__icontains=query) | Q(description__icontains=query))
        if plan_status == "pending":
            queryset = queryset.filter(is_completed=False)
        elif plan_status == "done":
            queryset = queryset.filter(is_completed=True)

        # 置顶优先。
        queryset = queryset.order_by("-is_pinned", "sort_order", "-created_at")
        return Response(PlanSerializer(queryset, many=True).data)

    def create(self, request, slug):
        workspace = self.get_workspace()
        serializer = PlanSerializer(data=request.data, context={"date_range": self.date_range})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # 同名计划视为同一条，避免重复创建后日历出现重复安排。
        title = (serializer.validated_data.get("title") or "").strip()
        if title and Plan.objects.filter(owner=request.user, title__iexact=title).exists():
            return Response({"title": "已存在同名计划，请在左侧列表中直接修改"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            plan = serializer.save(workspace=workspace, owner=request.user)
            materialize_occurrences(plan)
        return Response(
            PlanSerializer(plan, context={"date_range": self.date_range}).data, status=status.HTTP_201_CREATED
        )

    def partial_update(self, request, slug, pk):
        plan = self.get_object()
        serializer = PlanSerializer(plan, data=request.data, partial=True, context={"date_range": self.date_range})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # 改名时同样不允许与其他计划重名。
        new_title = (serializer.validated_data.get("title") or "").strip()
        if new_title and new_title.lower() != plan.title.lower():
            duplicated = Plan.objects.filter(owner=request.user, title__iexact=new_title).exclude(pk=plan.pk).exists()
            if duplicated:
                return Response({"title": "已存在同名计划"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            rule_changed = any(
                field.startswith("recurrence") and value != getattr(plan, field)
                for field, value in serializer.validated_data.items()
            )
            plan = serializer.save()
            if rule_changed:
                materialize_occurrences(plan)
        # get_object() prefetched the old calendar; rules may have added new dates.
        del plan.visible_occurrences
        return Response(PlanSerializer(plan, context={"date_range": self.date_range}).data, status=status.HTTP_200_OK)

    def destroy(self, request, slug, pk):
        """删除范围：this（单次）/ future（本次及以后）/ all（整条计划）。"""
        plan = self.get_object()
        serializer = PlanDeleteSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        scope = serializer.validated_data["scope"]
        date = serializer.validated_data.get("date")

        with transaction.atomic():
            if scope == "this":
                plan.occurrences.filter(date=date).update(is_deleted=True)
                return Response(status=status.HTTP_204_NO_CONTENT)
            if scope == "future":
                plan.occurrences.filter(date__gte=date).update(is_deleted=True)
                # Cutting at/before the start leaves no repeating dates.
                if plan.recurrence_start_date and date <= plan.recurrence_start_date:
                    plan.recurrence = Plan.Recurrence.NONE
                    previous_day = plan.recurrence_start_date
                else:
                    previous_day = date - timedelta(days=1) if date > date.min else date
                    if date == date.min:
                        plan.recurrence = Plan.Recurrence.NONE
                plan.recurrence_end_date = min(plan.recurrence_end_date or previous_day, previous_day)
                plan.save(update_fields=["recurrence", "recurrence_end_date", "updated_at"])
                return Response(status=status.HTTP_204_NO_CONTENT)
            plan.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PlanOccurrenceViewSet(DiaryBaseViewSet):
    serializer_class = PlanOccurrenceSerializer
    model = PlanOccurrence

    def get_queryset(self):
        return (
            self.filter_queryset(super().get_queryset())
            .filter(
                workspace__slug=self.kwargs.get("slug"),
                owner=self.request.user,
                is_deleted=False,
                plan__deleted_at__isnull=True,
            )
            .select_related("plan")
            .distinct()
        )

    def list(self, request, slug):
        queryset = self.get_queryset()
        date_from = self.date_range.get("date_from")
        date_to = self.date_range.get("date_to")
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        queryset = queryset.order_by("date", "sort_order")
        return Response(PlanOccurrenceSerializer(queryset, many=True).data)

    def create(self, request, slug):
        """给已有计划追加某天安排，左侧不重复创建计划。"""
        workspace = self.get_workspace()
        serializer = PlanOccurrenceCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        plan_id = serializer.validated_data["plan_id"]
        date = serializer.validated_data["date"]
        plan = get_object_or_404(Plan, pk=plan_id, workspace=workspace, owner=request.user)
        occurrence, _created = PlanOccurrence.objects.get_or_create(
            workspace=workspace, owner=request.user, plan=plan, date=date, is_deleted=False
        )
        return Response(
            PlanOccurrenceSerializer(occurrence).data,
            status=status.HTTP_201_CREATED,
        )

    def partial_update(self, request, slug, pk):
        """勾选完成 / 只修改当天 / 拖拽改期：只影响当前这一次安排。"""
        occurrence = self.get_object()
        serializer = PlanOccurrenceSerializer(occurrence, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        new_date = serializer.validated_data.get("date")
        if new_date and new_date != occurrence.date:
            # 同一计划同一天只能有一条有效安排，改期冲突时给出明确提示。
            conflict = (
                PlanOccurrence.objects.filter(plan=occurrence.plan, date=new_date, is_deleted=False)
                .exclude(pk=occurrence.pk)
                .exists()
            )
            if conflict:
                return Response({"date": "该计划在这一天已有安排"}, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    def destroy(self, request, slug, pk):
        occurrence = self.get_object()
        occurrence.is_deleted = True
        occurrence.save(update_fields=["is_deleted", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)

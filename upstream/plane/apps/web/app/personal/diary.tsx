/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router";
import useSWR from "swr";
import { Button } from "@makeplane/propel/components/button";
import { ConfirmDialog } from "@plane/blocks/dialog";
import { setToast } from "@plane/blocks/toast";
import { getApiErrorMessage } from "@/lib/api-error";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { PageHead } from "@/components/core/page-title";
import { DiaryCalendar, calendarGridRange } from "@/components/diary/diary-calendar";
import { DiaryEditor } from "@/components/diary/diary-editor";
import type { DiaryDraft } from "@/components/diary/diary-editor";
import { PlanPanel } from "@/components/diary/plan-panel";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { DIARY_TYPE_LABELS } from "@/lib/diary";
import { diaryService } from "@/services/diary.service";
import type { TPlanCreatePayload } from "@/services/diary.service";
import { problemService } from "@/services/problem.service";
import type { TDiary, TDiaryType, TPlan, TPlanOccurrence } from "@plane/types";

/** 待确认删除的目标：日记 / 计划 / 单次安排。 */
type PendingDelete = { type: "diary" | "plan" | "occurrence"; id: string; label: string };

/** 编辑器目标：编辑已有日记，或填写尚未落库的新草稿。 */
type EditorTarget = { kind: "existing"; diaryId: string } | { kind: "draft"; draft: DiaryDraft };

const TYPE_TABS: Array<{ key: "all" | TDiaryType; label: string }> = [
  { key: "all", label: "全部" },
  { key: "daily", label: "日记" },
  { key: "weekly", label: "周总结" },
  { key: "monthly", label: "月总结" },
  { key: "yearly", label: "年总结" },
];

const pad2 = (value: number) => String(value).padStart(2, "0");

const toISO = (date: Date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

/** 本周周日（含今天），用于「周总结」的所属日期与归属月。 */
const sundayOfWeek = (date: Date) => {
  const sunday = new Date(date);
  sunday.setDate(date.getDate() + ((7 - date.getDay()) % 7));
  return sunday;
};

const isoWeekKey = (date: Date) => {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${target.getUTCFullYear()}-W${pad2(week)}`;
};

/** 总结的开放时机：周总结=周日，月总结=当月最后一天，年总结=12 月 31 日。 */
const canCreateSummary = (type: TDiaryType, date: Date) => {
  if (type === "weekly") return date.getDay() === 0;
  if (type === "monthly") return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() === date.getDate();
  if (type === "yearly") return date.getMonth() === 11 && date.getDate() === 31;
  return true;
};

const SUMMARY_LOCKED_MESSAGE: Record<Exclude<TDiaryType, "daily">, string> = {
  weekly: "周总结只能在周日创建。",
  monthly: "月总结只能在当月最后一天创建。",
  yearly: "年总结只能在 12 月 31 日创建。",
};

export default function DiaryPage() {
  const { workspaceSlug = "personal" } = useParams();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? "";

  const [view, setView] = useState<"list" | "plans">("list");
  const [typeFilter, setTypeFilter] = useState<"all" | TDiaryType>("all");
  const [query, setQuery] = useState("");
  // 编辑器目标：新建草稿（保存后才创建）或编辑已有日记。
  const [editorTarget, setEditorTarget] = useState<EditorTarget | null>(null);
  const [editorSession, setEditorSession] = useState(0);
  const [editorDirty, setEditorDirty] = useState(false);
  useUnsavedChanges(editorDirty);
  const selectEditorTarget = useCallback(
    (target: EditorTarget | null) => {
      if (target?.kind === "existing" && editorTarget?.kind === "existing" && target.diaryId === editorTarget.diaryId)
        return;
      if (editorDirty && !window.confirm("放弃未保存的日记内容吗？")) return;
      setEditorDirty(false);
      setEditorSession((session) => session + 1);
      setEditorTarget(target);
    },
    [editorDirty, editorTarget]
  );
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [planSearch, setPlanSearch] = useState("");
  const [planStatus, setPlanStatus] = useState<"all" | "pending" | "done">("all");
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const { data: diaries, mutate: mutateDiaries } = useSWR<TDiary[]>(["diary-list", workspaceSlug], () =>
    diaryService.listDiaries(workspaceSlug, { per_page: 100 }).then((response) => response.results)
  );
  const { data: templates } = useSWR(["diary-templates", workspaceSlug], () =>
    diaryService.listDiaryTemplates(workspaceSlug)
  );
  const { data: plans, mutate: mutatePlans } = useSWR<TPlan[]>(["plans", workspaceSlug, planSearch, planStatus], () =>
    diaryService.listPlans(workspaceSlug, { query: planSearch, status: planStatus })
  );
  // 日历会承接上个月、预览下个月，因此按整格范围拉取安排，衔接日也能看到内容。
  const { start: monthStart, end: monthEnd } = useMemo(() => calendarGridRange(calYear, calMonth), [calYear, calMonth]);
  const { data: occurrences, mutate: mutateOccurrences } = useSWR<TPlanOccurrence[]>(
    ["plan-occurrences", workspaceSlug, monthStart, monthEnd],
    () => diaryService.listOccurrences(workspaceSlug, monthStart, monthEnd)
  );
  const { data: options } = useSWR(["problem-options"], () => problemService.options());
  const { data: problems } = useSWR(["problems-for-links"], () =>
    problemService.list(new URLSearchParams({ view: "all", page_size: "100" }))
  );

  const visibleDiaries = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return (diaries ?? []).filter((diary) => {
      if (typeFilter !== "all" && diary.diary_type !== typeFilter) return false;
      if (!keyword) return true;
      return (
        (diary.title ?? "").toLowerCase().includes(keyword) ||
        (diary.description_stripped ?? "").toLowerCase().includes(keyword)
      );
    });
  }, [diaries, typeFilter, query]);

  const activeDiary = useMemo(
    () =>
      editorTarget?.kind === "existing"
        ? ((diaries ?? []).find((diary) => diary.id === editorTarget.diaryId) ?? null)
        : null,
    [diaries, editorTarget]
  );
  const activeDraft = editorTarget?.kind === "draft" ? editorTarget.draft : null;

  const refreshCalendar = useCallback(async () => {
    await Promise.all([mutatePlans(), mutateOccurrences()]);
  }, [mutatePlans, mutateOccurrences]);

  /** 打开写作页（不落库），点保存后才真正创建日记。 */
  const openNewDiary = useCallback(
    (type: TDiaryType, date?: string) => {
      setError("");
      const base = date ? new Date(`${date}T00:00:00`) : new Date();
      if (type !== "daily" && !canCreateSummary(type, base)) {
        setToast({ type: "error", title: "暂不可创建", message: SUMMARY_LOCKED_MESSAGE[type] });
        return;
      }
      let periodKey = "";
      let belongsMonth = "";
      let diaryDate = toISO(base);
      if (type === "weekly") {
        const sunday = sundayOfWeek(base);
        periodKey = isoWeekKey(sunday);
        belongsMonth = `${sunday.getFullYear()}-${pad2(sunday.getMonth() + 1)}`;
        diaryDate = toISO(sunday);
      } else if (type === "monthly") {
        periodKey = `${base.getFullYear()}-${pad2(base.getMonth() + 1)}`;
        belongsMonth = periodKey;
      } else if (type === "yearly") {
        periodKey = `${base.getFullYear()}`;
        belongsMonth = `${base.getFullYear()}-12`;
      }
      selectEditorTarget({
        kind: "draft",
        draft: { diary_type: type, diary_date: diaryDate, period_key: periodKey, belongs_month: belongsMonth },
      });
    },
    [selectEditorTarget]
  );

  /** 所有删除操作统一走确认弹窗，确认后再执行并给出结果提示。 */
  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      if (pendingDelete.type === "diary") {
        await diaryService.deleteDiary(workspaceSlug, pendingDelete.id);
        // 删除的是当前正在编辑的日记时，同步关闭编辑器避免指向已删除数据。
        if (editorTarget?.kind === "existing" && editorTarget.diaryId === pendingDelete.id) {
          setEditorDirty(false);
          setEditorTarget(null);
        }
        await mutateDiaries();
        setToast({ type: "success", title: "已删除", message: "日记已删除。" });
      } else if (pendingDelete.type === "plan") {
        await diaryService.deletePlan(workspaceSlug, pendingDelete.id, "all");
        await refreshCalendar();
        setToast({ type: "success", title: "已删除", message: "计划及其安排已删除。" });
      } else {
        await diaryService.deleteOccurrence(workspaceSlug, pendingDelete.id);
        await mutateOccurrences();
        setToast({ type: "success", title: "已删除", message: "本次安排已删除。" });
      }
      setPendingDelete(null);
    } catch {
      setToast({ type: "error", title: "删除失败", message: "请稍后重试。" });
    } finally {
      setDeleting(false);
    }
  }, [pendingDelete, workspaceSlug, editorTarget, mutateDiaries, refreshCalendar, mutateOccurrences]);

  const setPrimary = useCallback(
    async (diary: TDiary) => {
      await diaryService.setPrimaryDiary(workspaceSlug, diary.id);
      await mutateDiaries();
    },
    [workspaceSlug, mutateDiaries]
  );

  const createPlan = useCallback(
    async (payload: TPlanCreatePayload) => {
      try {
        await diaryService.createPlan(workspaceSlug, payload);
        setError("");
        await refreshCalendar();
      } catch (failure) {
        setError(getApiErrorMessage(failure, "创建计划失败，请重试。"));
        throw failure;
      }
    },
    [workspaceSlug, refreshCalendar]
  );

  const updatePlan = useCallback(
    async (plan: TPlan, payload: Partial<TPlanCreatePayload>) => {
      try {
        await diaryService.updatePlan(workspaceSlug, plan.id, payload);
        setError("");
        await refreshCalendar();
      } catch (failure) {
        setError(getApiErrorMessage(failure, "修改计划失败，请重试。"));
        throw failure;
      }
    },
    [workspaceSlug, refreshCalendar]
  );

  const togglePin = useCallback(
    async (plan: TPlan) => {
      await diaryService.updatePlan(workspaceSlug, plan.id, { is_pinned: !plan.is_pinned });
      await mutatePlans();
    },
    [workspaceSlug, mutatePlans]
  );

  const togglePlanComplete = useCallback(
    async (plan: TPlan) => {
      await diaryService.updatePlan(workspaceSlug, plan.id, { is_completed: !plan.is_completed });
      await mutatePlans();
    },
    [workspaceSlug, mutatePlans]
  );

  const toggleOccurrence = useCallback(
    async (occurrence: TPlanOccurrence) => {
      await diaryService.updateOccurrence(workspaceSlug, occurrence.id, {
        is_completed: !occurrence.is_completed,
      });
      await mutateOccurrences();
    },
    [workspaceSlug, mutateOccurrences]
  );

  const createOccurrence = useCallback(
    async (planId: string, date: string) => {
      setError("");
      try {
        await diaryService.createOccurrence(workspaceSlug, planId, date);
        await mutateOccurrences();
      } catch {
        setError("安排失败，请重试。");
      }
    },
    [workspaceSlug, mutateOccurrences]
  );

  const moveOccurrence = useCallback(
    async (occurrence: TPlanOccurrence, date: string) => {
      setError("");
      try {
        await diaryService.updateOccurrence(workspaceSlug, occurrence.id, { date });
        await mutateOccurrences();
      } catch {
        setError("该计划在这一天已有安排，无法重复放置。");
      }
    },
    [workspaceSlug, mutateOccurrences]
  );

  const projectOptions = useMemo(
    () => (options?.projects ?? []).map((project) => ({ id: project.id, label: project.name })),
    [options]
  );

  // 总结按钮只在周期最后一天可用；其余时间禁用，避免产生不完整的周期总结。
  const today = new Date();
  const summaryAvailability = {
    weekly: canCreateSummary("weekly", today),
    monthly: canCreateSummary("monthly", today),
    yearly: canCreateSummary("yearly", today),
  };

  const editorPanel = editorTarget ? (
    <div className="absolute inset-0 z-20 overflow-y-auto border-l border-subtle bg-surface-1 p-4 md:static md:w-[min(680px,55vw)] md:shrink-0">
      <DiaryEditor
        key={`${editorSession}-${
          editorTarget.kind === "existing"
            ? editorTarget.diaryId
            : `draft-${activeDraft?.diary_type}-${activeDraft?.diary_date}`
        }`}
        workspaceSlug={workspaceSlug}
        workspaceId={workspaceId}
        diary={activeDiary}
        draft={activeDraft}
        templates={templates ?? []}
        diaries={diaries ?? []}
        projects={projectOptions}
        tasks={options?.tasks ?? []}
        problems={problems?.results ?? []}
        onSaved={() => {
          setEditorDirty(false);
          void mutateDiaries();
          // 新草稿保存后已落库，关闭面板避免继续编辑旧草稿。
          if (editorTarget?.kind === "draft") setEditorTarget(null);
        }}
        onDeleted={() => {
          setEditorDirty(false);
          setEditorTarget(null);
          void mutateDiaries();
        }}
        onClose={() => selectEditorTarget(null)}
        onDirtyChange={setEditorDirty}
      />
    </div>
  ) : null;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-surface-1">
      <PageHead title="日记" />
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-subtle px-page-x py-3">
        <h1 className="text-h5-semibold text-primary">日记</h1>
        <div className="flex items-center gap-2">
          <nav className="flex gap-1" aria-label="日记视图">
            {(
              [
                ["list", "日记"],
                ["plans", "计划与日历"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (key === view) return;
                  if (editorDirty && !window.confirm("放弃未保存的日记内容并切换视图吗？")) return;
                  setEditorTarget(null);
                  setEditorDirty(false);
                  setView(key);
                }}
                className={`rounded-sm px-3 py-1 text-body-sm-medium ${
                  view === key ? "bg-layer-2 text-primary" : "text-secondary hover:text-primary"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
          <Button variant="primary" size="md" stretch="auto" label="写日记" onClick={() => openNewDiary("daily")} />
        </div>
      </header>

      {error && (
        <p role="alert" className="bg-red-50 text-red-600 border-b border-subtle px-page-x py-2 text-body-sm-regular">
          {error}
        </p>
      )}

      {view === "list" ? (
        <div className="relative flex flex-1 overflow-hidden">
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 border-b border-subtle px-page-x py-2">
              <nav className="flex gap-1" aria-label="日记类型">
                {TYPE_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setTypeFilter(tab.key)}
                    className={`rounded-sm px-2 py-1 text-body-xs-regular ${
                      typeFilter === tab.key ? "bg-layer-2 text-primary" : "text-secondary hover:text-primary"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
              <input
                aria-label="搜索日记"
                placeholder="搜索标题或内容"
                className="h-7 min-w-48 flex-1 rounded-sm border border-subtle bg-surface-1 px-2 text-body-xs-regular text-primary"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <Button
                variant="secondary"
                size="sm"
                stretch="auto"
                label="本周总结"
                disabled={!summaryAvailability.weekly}
                onClick={() => openNewDiary("weekly")}
              />
              <Button
                variant="secondary"
                size="sm"
                stretch="auto"
                label="本月总结"
                disabled={!summaryAvailability.monthly}
                onClick={() => openNewDiary("monthly")}
              />
              <Button
                variant="secondary"
                size="sm"
                stretch="auto"
                label="本年总结"
                disabled={!summaryAvailability.yearly}
                onClick={() => openNewDiary("yearly")}
              />
              {(!summaryAvailability.weekly || !summaryAvailability.monthly || !summaryAvailability.yearly) && (
                <span className="text-body-xs-regular text-tertiary">
                  周总结限周日、月总结限月末、年总结限 12 月 31 日创建
                </span>
              )}
            </div>

            <div className="flex-1 overflow-auto px-page-x py-4">
              <table className="w-full min-w-[620px] text-left text-body-sm-regular">
                <thead>
                  <tr className="text-body-xs-regular text-tertiary">
                    <th className="px-2 py-2">标题</th>
                    <th className="px-2 py-2">类型</th>
                    <th className="px-2 py-2">所属日期</th>
                    <th className="px-2 py-2">主日记</th>
                    <th className="px-2 py-2">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleDiaries.map((diary) => (
                    <tr key={diary.id} className="border-t border-subtle hover:bg-layer-2/50">
                      <td className="px-2 py-2">
                        <button
                          type="button"
                          className="text-accent-primary hover:underline"
                          onClick={() => selectEditorTarget({ kind: "existing", diaryId: diary.id })}
                        >
                          {diary.title || "（无标题）"}
                        </button>
                      </td>
                      <td className="px-2 py-2 text-secondary">{DIARY_TYPE_LABELS[diary.diary_type]}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-secondary">{diary.diary_date}</td>
                      <td className="px-2 py-2">
                        {diary.is_primary ? (
                          <span className="text-accent-primary">✓ 主日记</span>
                        ) : (
                          <button
                            type="button"
                            className="text-body-xs-regular text-secondary hover:text-primary"
                            onClick={() => void setPrimary(diary)}
                          >
                            设为主日记
                          </button>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <button
                          type="button"
                          className="text-red-600 hover:text-red-700 text-body-xs-regular"
                          onClick={() =>
                            setPendingDelete({
                              type: "diary",
                              id: diary.id,
                              label: diary.title || `${diary.diary_date} 的日记`,
                            })
                          }
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                  {visibleDiaries.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-2 py-8 text-center text-tertiary">
                        还没有日记，点击「写日记」开始。
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {editorPanel}
        </div>
      ) : (
        <div className="relative flex flex-1 overflow-hidden">
          <PlanPanel
            plans={plans ?? []}
            search={planSearch}
            statusFilter={planStatus}
            onSearchChange={setPlanSearch}
            onStatusChange={setPlanStatus}
            onCreate={createPlan}
            onUpdate={updatePlan}
            onTogglePin={(plan) => void togglePin(plan)}
            onToggleComplete={(plan) => void togglePlanComplete(plan)}
            onDelete={(plan) => setPendingDelete({ type: "plan", id: plan.id, label: plan.title })}
          />
          <div className="flex flex-1 flex-col overflow-y-auto p-4">
            <DiaryCalendar
              year={calYear}
              month={calMonth}
              occurrences={occurrences ?? []}
              diaries={diaries ?? []}
              plans={plans ?? []}
              onPrevMonth={() => {
                if (calMonth === 0) {
                  setCalMonth(11);
                  setCalYear((value) => value - 1);
                } else setCalMonth((value) => value - 1);
              }}
              onNextMonth={() => {
                if (calMonth === 11) {
                  setCalMonth(0);
                  setCalYear((value) => value + 1);
                } else setCalMonth((value) => value + 1);
              }}
              onToggleOccurrence={(occurrence) => void toggleOccurrence(occurrence)}
              onDeleteOccurrence={(occurrence) =>
                setPendingDelete({
                  type: "occurrence",
                  id: occurrence.id,
                  label: `${occurrence.date} · ${occurrence.display_title}`,
                })
              }
              onCreateOccurrence={(planId, date) => void createOccurrence(planId, date)}
              onMoveOccurrence={(occurrence, date) => void moveOccurrence(occurrence, date)}
              onOpenDiary={(diary) => selectEditorTarget({ kind: "existing", diaryId: diary.id })}
              onCreateDiary={(date) => openNewDiary("daily", date)}
            />
            <p className="mt-3 text-body-xs-regular text-tertiary">
              提示：把左侧计划拖到日期上即可安排；日历中的计划可拖到其他日期改期，勾选即完成。
            </p>
          </div>
          {editorPanel}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!pendingDelete}
        handleClose={() => setPendingDelete(null)}
        handleSubmit={() => void confirmDelete()}
        isSubmitting={deleting}
        title={
          pendingDelete?.type === "diary" ? "删除日记" : pendingDelete?.type === "plan" ? "删除计划" : "删除这次安排"
        }
        content={
          pendingDelete?.type === "plan" ? (
            <>
              确定删除计划「<span className="font-medium text-primary">{pendingDelete?.label}</span>
              」吗？该计划在日历上的所有安排都会一并删除，此操作无法撤销。
            </>
          ) : (
            <>
              确定删除「<span className="font-medium text-primary">{pendingDelete?.label}</span>
              」吗？删除后无法恢复。
            </>
          )
        }
        primaryButtonText={{ loading: "删除中…", default: "删除" }}
        secondaryButtonText="取消"
      />
    </div>
  );
}

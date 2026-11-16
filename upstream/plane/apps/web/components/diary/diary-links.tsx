/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import useSWR from "swr";
import { Button } from "@makeplane/propel/components/button";
import { ConfirmDialog } from "@plane/blocks/dialog";
import { setToast } from "@plane/blocks/toast";
import { cn } from "@plane/utils";
import type { TDiary, TDiaryLink, TDiaryLinkTargetType } from "@plane/types";
// services
import { diaryService } from "@/services/diary.service";
import type { ProblemTask, PersonalProblem } from "@/services/problem.service";

export type DiaryLinkOption = { id: string; label: string };

type DiaryLinksProps = {
  workspaceSlug: string;
  diaryId: string;
  diaries: TDiary[];
  projects: DiaryLinkOption[];
  tasks: ProblemTask[];
  problems: PersonalProblem[];
};

const TARGET_LABELS: Record<TDiaryLinkTargetType, string> = {
  diary: "同类日记",
  task: "任务",
  project: "项目",
  issue: "问题",
};

const TARGET_ORDER: TDiaryLinkTargetType[] = ["diary", "task", "project", "issue"];

export function DiaryLinks({ workspaceSlug, diaryId, diaries, projects, tasks, problems }: DiaryLinksProps) {
  const [targetType, setTargetType] = useState<TDiaryLinkTargetType>("diary");
  const [targetId, setTargetId] = useState("");
  const [taskQuery, setTaskQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<TDiaryLink | null>(null);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");

  const { data: links, mutate } = useSWR<TDiaryLink[]>(["diary-links", workspaceSlug, diaryId], () =>
    diaryService.listDiaryLinks(workspaceSlug, diaryId)
  );

  const linkedKeys = useMemo(
    () => new Set((links ?? []).map((link) => `${link.target_type}:${link.target_id}`)),
    [links]
  );

  const diaryOptions = useMemo(
    () =>
      diaries
        .filter((diary) => diary.id !== diaryId)
        .map((diary) => ({ id: diary.id, label: diary.title || `${diary.diary_date} 的日记` })),
    [diaries, diaryId]
  );

  const filteredTasks = useMemo(() => {
    const keyword = taskQuery.trim().toLowerCase();
    const rows = tasks.filter((task) => !linkedKeys.has(`task:${task.id}`));
    if (!keyword) return rows.slice(0, 30);
    return rows
      .filter(
        (task) =>
          task.name.toLowerCase().includes(keyword) || (task.project_name ?? "").toLowerCase().includes(keyword)
      )
      .slice(0, 30);
  }, [tasks, taskQuery, linkedKeys]);

  const options: DiaryLinkOption[] =
    targetType === "diary" ? diaryOptions : targetType === "project" ? projects : targetType === "issue" ? problems.map((problem) => ({ id: problem.id, label: `问-${problem.number} ${problem.title}` })) : [];

  const handleAdd = async () => {
    const resolvedId = targetId;
    if (!resolvedId) return;
    setBusy(true);
    setError("");
    try {
      await diaryService.createDiaryLink(workspaceSlug, diaryId, { target_type: targetType, target_id: resolvedId });
      setTargetId("");
      await mutate();
    } catch {
      setError("添加关联失败，请重试。");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (link: TDiaryLink) => {
    setRemoving(true);
    setError("");
    try {
      await diaryService.deleteDiaryLink(workspaceSlug, diaryId, link.id);
      setPendingRemove(null);
      setToast({ type: "success", title: "已解除", message: "关联已解除。" });
      await mutate();
    } catch {
      setError("解除关联失败，请重试。");
      setToast({ type: "error", title: "解除失败", message: "请稍后重试。" });
    } finally {
      setRemoving(false);
    }
  };

  return (
    <section aria-label="日记关联" className="mt-4 rounded-md border border-subtle bg-surface-2/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-body-sm-semibold text-primary">关联</h3>
        <span className="text-body-xs-regular text-tertiary">同类日记与任务 / 项目 / 问题</span>
      </div>

      <ul className="mb-2 space-y-1">
        {(links ?? []).length === 0 && <li className="text-body-xs-regular text-tertiary">暂无关联。</li>}
        {(links ?? []).map((link) => (
          <li
            key={link.id}
            className="flex items-center gap-2 rounded-sm border border-subtle bg-surface-1 px-2 py-1"
          >
            <span className="shrink-0 rounded-sm bg-layer-2 px-1.5 py-0.5 text-body-xs-regular text-secondary">
              {TARGET_LABELS[link.target_type]}
            </span>
            <span className="min-w-0 flex-1 truncate text-body-sm-regular text-primary">
              {link.target_label || link.target_id}
            </span>
            <button
              type="button"
              aria-label="解除关联"
              className="rounded-sm px-1 text-body-xs-regular text-red-600 hover:text-red-700"
              disabled={busy}
              onClick={() => setPendingRemove(link)}
            >
              解除
            </button>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="关联类型"
          className="h-7 rounded-sm border border-subtle bg-surface-1 px-2 text-body-xs-regular text-primary"
          value={targetType}
          onChange={(event) => {
            setTargetType(event.target.value as TDiaryLinkTargetType);
            setTargetId("");
            setTaskQuery("");
          }}
        >
          {TARGET_ORDER.map((type) => (
            <option key={type} value={type}>
              {TARGET_LABELS[type]}
            </option>
          ))}
        </select>

        {targetType === "task" ? (
          <>
            <input
              aria-label="搜索任务"
              placeholder="搜索任务名称"
              className="h-7 min-w-40 flex-1 rounded-sm border border-subtle bg-surface-1 px-2 text-body-xs-regular text-primary"
              value={taskQuery}
              onChange={(event) => setTaskQuery(event.target.value)}
            />
            <select
              aria-label="选择任务"
              className="h-7 max-w-56 rounded-sm border border-subtle bg-surface-1 px-2 text-body-xs-regular text-primary"
              value={targetId}
              onChange={(event) => setTargetId(event.target.value)}
            >
              <option value="">选择任务</option>
              {filteredTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.project_name ? `${task.project_name} / ${task.name}` : task.name}
                </option>
              ))}
            </select>
          </>
        ) : (
          <select
            aria-label="选择关联对象"
            className="h-7 min-w-40 flex-1 rounded-sm border border-subtle bg-surface-1 px-2 text-body-xs-regular text-primary"
            value={targetId}
            onChange={(event) => setTargetId(event.target.value)}
          >
            <option value="">选择{TARGET_LABELS[targetType]}</option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        )}

        <Button
          variant="secondary"
          size="sm"
          stretch="auto"
          label={busy ? "处理中…" : "添加"}
          disabled={busy || !targetId}
          onClick={() => void handleAdd()}
        />
      </div>

      {error && (
        <p role="alert" className={cn("mt-2 text-body-xs-regular text-red-600")}>
          {error}
        </p>
      )}

      <ConfirmDialog
        isOpen={!!pendingRemove}
        handleClose={() => setPendingRemove(null)}
        handleSubmit={() => {
          if (pendingRemove) void handleRemove(pendingRemove);
        }}
        isSubmitting={removing}
        variant="warning"
        title="解除关联"
        content={
          <>
            确定解除与「
            <span className="font-medium text-primary">
              {pendingRemove?.target_label || pendingRemove?.target_id}
            </span>
            」的关联吗？两端的关联会同时移除。
          </>
        }
        primaryButtonText={{ loading: "解除中…", default: "解除" }}
        secondaryButtonText="取消"
      />
    </section>
  );
}

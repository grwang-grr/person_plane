/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { orderBy, sortBy } from "lodash-es";
import { Button } from "@makeplane/propel/components/button";
import { cn } from "@plane/utils";
import type { TPlan, TPlanRecurrence } from "@plane/types";
// services
import type { TPlanCreatePayload } from "@/services/diary.service";

type PlanPanelProps = {
  plans: TPlan[];
  search: string;
  statusFilter: "all" | "pending" | "done";
  onSearchChange: (value: string) => void;
  onStatusChange: (value: "all" | "pending" | "done") => void;
  onCreate: (payload: TPlanCreatePayload) => Promise<void>;
  onUpdate: (plan: TPlan, payload: Partial<TPlanCreatePayload>) => Promise<void>;
  onTogglePin: (plan: TPlan) => void;
  onToggleComplete: (plan: TPlan) => void;
  onDelete: (plan: TPlan) => void;
};

const STATUS_TABS: Array<{ key: "all" | "pending" | "done"; label: string }> = [
  { key: "all", label: "全部" },
  { key: "pending", label: "未完成" },
  { key: "done", label: "已完成" },
];

const RECURRENCE_OPTIONS: Array<{ value: TPlanRecurrence; label: string }> = [
  { value: "none", label: "不重复" },
  { value: "daily", label: "每天" },
  { value: "weekdays", label: "工作日" },
  { value: "weekly", label: "每周" },
  { value: "monthly", label: "每月" },
];

const WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];

const toISO = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const describeRecurrence = (plan: TPlan): string => {
  switch (plan.recurrence) {
    case "daily":
      return plan.recurrence_interval > 1 ? `每 ${plan.recurrence_interval} 天` : "每天";
    case "weekdays":
      return "工作日";
    case "weekly":
      return `每周 ${(plan.recurrence_byweekday ?? []).map((day) => WEEKDAY_LABELS[day] ?? "").join("、") || "-"}`;
    case "monthly":
      return `每月 ${plan.recurrence_bymonthday ?? "-"} 日`;
    default:
      return plan.recurrence_start_date ? `仅 ${plan.recurrence_start_date}` : "单次";
  }
};

function RecurrenceDetails({
  recurrence,
  weekdays,
  monthDay,
  onWeekdaysChange,
  onMonthDayChange,
}: {
  recurrence: TPlanRecurrence;
  weekdays: number[];
  monthDay: string;
  onWeekdaysChange: (days: number[]) => void;
  onMonthDayChange: (day: string) => void;
}) {
  if (recurrence === "weekly")
    return (
      <div className="flex flex-wrap gap-1" role="group" aria-label="每周几">
        {WEEKDAY_LABELS.map((label, index) => (
          <button
            key={label}
            type="button"
            aria-label={`星期${label}`}
            aria-pressed={weekdays.includes(index)}
            className={cn(
              "size-6 rounded-sm border text-body-xs-regular",
              weekdays.includes(index)
                ? "border-accent-primary bg-accent-primary/10 text-primary"
                : "border-subtle text-secondary"
            )}
            onClick={() =>
              onWeekdaysChange(
                weekdays.includes(index) ? weekdays.filter((day) => day !== index) : sortBy([...weekdays, index])
              )
            }
          >
            {label}
          </button>
        ))}
      </div>
    );
  if (recurrence === "monthly")
    return (
      <label className="flex items-center gap-1 text-body-xs-regular text-secondary">
        每月
        <input
          type="number"
          min={1}
          max={31}
          aria-label="每月第几日"
          value={monthDay}
          className="h-7 w-16 rounded-sm border border-subtle bg-surface-1 px-1 text-body-xs-regular text-primary"
          onChange={(event) => onMonthDayChange(event.target.value)}
        />
        日
      </label>
    );
  return null;
}

/** 紧凑侧栏：新建表单默认收起，搜索与筛选同排，列表独立滚动。 */
export function PlanPanel({
  plans,
  search,
  statusFilter,
  onSearchChange,
  onStatusChange,
  onCreate,
  onUpdate,
  onTogglePin,
  onToggleComplete,
  onDelete,
}: PlanPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newRecurrence, setNewRecurrence] = useState<TPlanRecurrence>("none");
  const [newStart, setNewStart] = useState(() => toISO(new Date()));
  const [newWeekdays, setNewWeekdays] = useState<number[]>([]);
  const [newMonthDay, setNewMonthDay] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editRecurrence, setEditRecurrence] = useState<TPlanRecurrence>("none");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editWeekdays, setEditWeekdays] = useState<number[]>([]);
  const [editMonthDay, setEditMonthDay] = useState("");
  const [saving, setSaving] = useState(false);

  const visiblePlans = useMemo(() => orderBy(plans, ["is_pinned"], ["desc"]), [plans]);

  const resetForm = () => {
    setNewTitle("");
    setNewRecurrence("none");
    setNewWeekdays([]);
    setNewMonthDay("");
  };

  const submitNew = async () => {
    const title = newTitle.trim();
    if (!title || creating) return;
    setCreating(true);
    try {
      await onCreate({
        title,
        recurrence: newRecurrence,
        recurrence_start_date: newStart || null,
        recurrence_byweekday: newRecurrence === "weekly" ? newWeekdays : [],
        recurrence_bymonthday: newRecurrence === "monthly" && newMonthDay ? Number(newMonthDay) : null,
      });
      resetForm();
      setShowForm(false);
    } catch {
      // 具体错误由父级页面提示，这里保留已填内容便于修改。
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (plan: TPlan) => {
    if (saving) return;
    setEditingId(plan.id);
    setEditTitle(plan.title);
    setEditRecurrence(plan.recurrence);
    setEditStart(plan.recurrence_start_date ?? "");
    setEditEnd(plan.recurrence_end_date ?? "");
    setEditWeekdays(plan.recurrence_byweekday ?? []);
    setEditMonthDay(plan.recurrence_bymonthday?.toString() ?? "");
  };

  const saveEdit = async (plan: TPlan) => {
    const title = editTitle.trim();
    if (!title || saving) return;
    setSaving(true);
    try {
      await onUpdate(plan, {
        title,
        recurrence: editRecurrence,
        recurrence_start_date: editStart || null,
        recurrence_end_date: editEnd || null,
        recurrence_byweekday: editRecurrence === "weekly" ? editWeekdays : [],
        recurrence_bymonthday: editRecurrence === "monthly" && editMonthDay ? Number(editMonthDay) : null,
      });
      setEditingId(null);
    } catch {
      // 保留编辑态，错误信息由父级展示。
    } finally {
      setSaving(false);
    }
  };

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-subtle bg-surface-1">
      <div className="flex shrink-0 items-center justify-between border-b border-subtle px-3 py-2">
        <h2 className="text-body-sm-semibold text-primary">计划</h2>
        <button
          type="button"
          disabled={creating}
          aria-expanded={showForm}
          className="rounded-sm px-1.5 py-0.5 text-body-xs-regular text-accent-primary hover:bg-accent-primary/10"
          onClick={() => {
            setShowForm((value) => !value);
            if (showForm) resetForm();
          }}
        >
          {showForm ? "收起" : "＋ 新建"}
        </button>
      </div>

      {showForm && (
        <form
          className="flex shrink-0 flex-col gap-2 border-b border-subtle bg-surface-2/40 px-3 py-2"
          onSubmit={(event) => {
            event.preventDefault();
            void submitNew();
          }}
        >
          <fieldset disabled={creating} className="contents">
            <input
              aria-label="新建计划标题"
              placeholder="要做什么？例如：每天晨跑"
              className="focus:border-accent-primary h-7 w-full rounded-sm border border-subtle bg-surface-1 px-2 text-body-xs-regular text-primary outline-none"
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
            />
            <div className="flex items-center gap-1">
              <select
                aria-label="重复规则"
                className="h-7 min-w-0 flex-1 rounded-sm border border-subtle bg-surface-1 px-1 text-body-xs-regular text-primary"
                value={newRecurrence}
                onChange={(event) => setNewRecurrence(event.target.value as TPlanRecurrence)}
              >
                {RECURRENCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                type="date"
                aria-label="开始日期"
                className="h-7 rounded-sm border border-subtle bg-surface-1 px-1 text-body-xs-regular text-primary"
                value={newStart}
                onChange={(event) => setNewStart(event.target.value)}
              />
              <Button
                variant="primary"
                size="sm"
                stretch="auto"
                label={creating ? "添加中…" : "添加"}
                disabled={creating || !newTitle.trim()}
                onClick={() => void submitNew()}
              />
            </div>
            <RecurrenceDetails
              recurrence={newRecurrence}
              weekdays={newWeekdays}
              monthDay={newMonthDay}
              onWeekdaysChange={setNewWeekdays}
              onMonthDayChange={setNewMonthDay}
            />
          </fieldset>
        </form>
      )}

      <div className="flex shrink-0 items-center gap-1 border-b border-subtle px-3 py-2">
        <input
          aria-label="搜索计划"
          placeholder="搜索计划"
          className="focus:border-accent-primary h-7 min-w-0 flex-1 rounded-sm border border-subtle bg-surface-1 px-2 text-body-xs-regular text-primary outline-none"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <div className="flex shrink-0 rounded-sm border border-subtle p-0.5" role="group" aria-label="计划筛选">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => onStatusChange(tab.key)}
              className={cn(
                "rounded-[2px] px-1.5 py-0.5 text-body-xs-regular",
                statusFilter === tab.key ? "bg-layer-2 text-primary" : "text-secondary hover:text-primary"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <ul className="flex-1 space-y-1 overflow-y-auto p-2">
        {visiblePlans.length === 0 && <li className="py-8 text-center text-body-xs-regular text-tertiary">暂无计划</li>}
        {visiblePlans.map((plan) => (
          <li
            key={plan.id}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData("text/plain", `plan:${plan.id}`);
              event.dataTransfer.effectAllowed = "copy";
            }}
            className={cn(
              "group cursor-grab rounded-sm border border-subtle px-2 py-1.5 active:cursor-grabbing",
              plan.is_pinned && "border-accent-primary/40 bg-accent-primary/5"
            )}
          >
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                aria-label={`完成 ${plan.title}`}
                checked={plan.is_completed}
                onChange={() => onToggleComplete(plan)}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                {editingId === plan.id ? (
                  <fieldset disabled={saving} className="flex min-w-0 flex-col gap-1">
                    <input
                      aria-label="计划标题"
                      className="h-6 w-full rounded-sm border border-subtle bg-surface-1 px-1 text-body-xs-regular text-primary"
                      value={editTitle}
                      onChange={(event) => setEditTitle(event.target.value)}
                    />
                    <div className="flex flex-wrap items-center gap-1">
                      <select
                        aria-label="修改重复规则"
                        className="h-6 min-w-0 flex-1 rounded-sm border border-subtle bg-surface-1 px-1 text-body-xs-regular text-primary"
                        value={editRecurrence}
                        onChange={(event) => setEditRecurrence(event.target.value as TPlanRecurrence)}
                      >
                        {RECURRENCE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="date"
                        aria-label="修改开始日期"
                        className="h-6 rounded-sm border border-subtle bg-surface-1 px-1 text-body-xs-regular text-primary"
                        value={editStart}
                        onChange={(event) => setEditStart(event.target.value)}
                      />
                      <input
                        type="date"
                        aria-label="修改结束日期"
                        className="h-6 rounded-sm border border-subtle bg-surface-1 px-1 text-body-xs-regular text-primary"
                        value={editEnd}
                        onChange={(event) => setEditEnd(event.target.value)}
                      />
                    </div>
                    <RecurrenceDetails
                      recurrence={editRecurrence}
                      weekdays={editWeekdays}
                      monthDay={editMonthDay}
                      onWeekdaysChange={setEditWeekdays}
                      onMonthDayChange={setEditMonthDay}
                    />
                    <div className="flex gap-1">
                      <Button
                        variant="primary"
                        size="sm"
                        stretch="auto"
                        label={saving ? "保存中…" : "保存"}
                        onClick={() => void saveEdit(plan)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        stretch="auto"
                        label="取消"
                        onClick={() => setEditingId(null)}
                      />
                    </div>
                  </fieldset>
                ) : (
                  <>
                    <p
                      className={cn("truncate text-body-sm-medium", plan.is_completed && "text-tertiary line-through")}
                    >
                      {plan.title}
                    </p>
                    <p className="text-body-xs-regular text-tertiary">{describeRecurrence(plan)}</p>
                  </>
                )}
              </div>
              {editingId !== plan.id && (
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <button
                    type="button"
                    aria-label="编辑计划"
                    className="rounded-sm px-0.5 text-body-xs-regular text-secondary hover:text-primary"
                    onClick={() => startEdit(plan)}
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    aria-label={plan.is_pinned ? "取消置顶" : "置顶"}
                    className="rounded-sm px-0.5 text-body-xs-regular text-secondary hover:text-primary"
                    onClick={() => onTogglePin(plan)}
                  >
                    {plan.is_pinned ? "取消置顶" : "置顶"}
                  </button>
                  <button
                    type="button"
                    aria-label="删除计划"
                    className="text-red-600 hover:text-red-700 rounded-sm px-0.5 text-body-xs-regular"
                    onClick={() => onDelete(plan)}
                  >
                    删除
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}

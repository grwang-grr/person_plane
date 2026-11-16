/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { cn } from "@plane/utils";
import type { TDiary, TPlan, TPlanOccurrence } from "@plane/types";

type DiaryCalendarProps = {
  year: number;
  month: number; // 0-11
  occurrences: TPlanOccurrence[];
  diaries: TDiary[];
  plans: TPlan[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToggleOccurrence: (occurrence: TPlanOccurrence) => void;
  onDeleteOccurrence: (occurrence: TPlanOccurrence) => void;
  onCreateOccurrence: (planId: string, date: string) => void;
  onMoveOccurrence: (occurrence: TPlanOccurrence, date: string) => void;
  onOpenDiary: (diary: TDiary) => void;
  onCreateDiary: (date: string) => void;
};

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

const toDateISO = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** 每行以周一开头，首尾补齐整周，用来承接上个月并预览下个月。 */
const gridEdges = (year: number, month: number) => {
  const leading = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const total = leading + daysInMonth;
  const trailing = (7 - (total % 7)) % 7;
  return { leading, daysInMonth, total, trailing };
};

/** 日历当前展示的日期范围（含承接的上月与预览的下月），用于按范围拉取安排。 */
export const calendarGridRange = (year: number, month: number) => {
  const { leading, daysInMonth, trailing } = gridEdges(year, month);
  return {
    start: toDateISO(new Date(year, month, 1 - leading)),
    end: toDateISO(new Date(year, month, daysInMonth + trailing)),
  };
};

export function DiaryCalendar({
  year,
  month,
  occurrences,
  diaries,
  plans,
  onPrevMonth,
  onNextMonth,
  onToggleOccurrence,
  onDeleteOccurrence,
  onCreateOccurrence,
  onMoveOccurrence,
  onOpenDiary,
  onCreateDiary,
}: DiaryCalendarProps) {
  const [addDate, setAddDate] = useState<string | null>(null);
  const [addPlanId, setAddPlanId] = useState("");
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  const occurrencesByDate = useMemo(() => {
    const map = new Map<string, TPlanOccurrence[]>();
    occurrences.forEach((occurrence) => {
      const list = map.get(occurrence.date) ?? [];
      list.push(occurrence);
      map.set(occurrence.date, list);
    });
    return map;
  }, [occurrences]);

  const diariesByDate = useMemo(() => {
    const map = new Map<string, TDiary[]>();
    diaries.forEach((diary) => {
      const list = map.get(diary.diary_date) ?? [];
      list.push(diary);
      map.set(diary.diary_date, list);
    });
    return map;
  }, [diaries]);

  const days = useMemo(() => {
    const { leading, total, trailing } = gridEdges(year, month);
    // 首尾补齐整周：上月末尾与下月开头都可以看到并继续操作。
    return Array.from({ length: total + trailing }, (_, index) => {
      const date = new Date(year, month, 1 - leading + index);
      return { day: date.getDate(), date: toDateISO(date), isCurrentMonth: date.getMonth() === month };
    });
  }, [year, month]);

  const handleDrop = (date: string, event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOverDate(null);
    const payload = event.dataTransfer.getData("text/plain");
    if (payload.startsWith("plan:")) {
      onCreateOccurrence(payload.slice(5), date);
      return;
    }
    if (payload.startsWith("occurrence:")) {
      const occurrence = occurrences.find((item) => item.id === payload.slice(11));
      if (occurrence) onMoveOccurrence(occurrence, date);
    }
  };

  return (
    <div className="flex-1 rounded-lg border border-subtle bg-surface-1 p-4">
      <header className="mb-3 flex items-center justify-between">
        <button
          type="button"
          aria-label="上个月"
          className="rounded-sm px-2 py-1 text-secondary hover:text-primary"
          onClick={onPrevMonth}
        >
          ‹
        </button>
        <h2 className="text-body-sm-semibold text-primary">
          {year} 年 {month + 1} 月
        </h2>
        <button
          type="button"
          aria-label="下个月"
          className="rounded-sm px-2 py-1 text-secondary hover:text-primary"
          onClick={onNextMonth}
        >
          ›
        </button>
      </header>

      <div className="grid grid-cols-7 gap-1 text-center text-body-xs-regular text-tertiary">
        {WEEKDAYS.map((weekday) => (
          <div key={weekday} className="py-1">
            {weekday}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((cell) => (
          <div
            key={cell.date}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOverDate(cell.date);
            }}
            onDragLeave={() => setDragOverDate((current) => (current === cell.date ? null : current))}
            onDrop={(event) => handleDrop(cell.date, event)}
            className={cn(
              "min-h-28 rounded-sm border p-1",
              cell.isCurrentMonth ? "border-subtle" : "border-subtle/60 bg-layer-1/40",
              cell.isCurrentMonth && "hover:border-accent-primary/40",
              dragOverDate === cell.date && "border-accent-primary bg-accent-primary/10"
            )}
          >
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "text-body-xs-regular",
                  cell.isCurrentMonth ? "text-tertiary" : "text-tertiary/60"
                )}
              >
                {cell.day}
              </span>
              <span className="flex items-center gap-1 opacity-0 transition-opacity hover:opacity-100 focus-within:opacity-100">
                <button
                  type="button"
                  aria-label="写日记"
                  className="rounded-sm px-1 text-body-xs-regular text-secondary hover:text-primary"
                  onClick={() => onCreateDiary(cell.date)}
                >
                  日记
                </button>
                <button
                  type="button"
                  aria-label="添加计划安排"
                  className="rounded-sm px-1 text-body-xs-regular text-secondary hover:text-primary"
                  onClick={() => {
                    setAddDate(cell.date);
                    setAddPlanId("");
                  }}
                >
                  +
                </button>
              </span>
            </div>

            {(diariesByDate.get(cell.date) ?? []).map((diary) => (
              <button
                key={diary.id}
                type="button"
                title="打开这篇日记"
                className="mt-1 flex w-full items-center gap-1 truncate rounded-sm border border-accent-primary/30 bg-accent-primary/10 px-1 py-0.5 text-left text-body-xs-regular text-primary hover:bg-accent-primary/20"
                onClick={() => onOpenDiary(diary)}
              >
                <span className="shrink-0 rounded-[2px] bg-accent-primary/20 px-1 text-[10px] text-secondary">
                  日记
                </span>
                <span className="truncate">{diary.title || "（无标题）"}</span>
              </button>
            ))}

            {(occurrencesByDate.get(cell.date) ?? []).map((occurrence) => (
                <div
                  key={occurrence.id}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/plain", `occurrence:${occurrence.id}`);
                    event.dataTransfer.effectAllowed = "move";
                  }}
                  className="mt-1 flex cursor-grab items-start gap-1 rounded-sm bg-layer-2 px-1 py-0.5 text-body-xs-regular active:cursor-grabbing"
                >
                  <input
                    type="checkbox"
                    aria-label={`完成 ${occurrence.display_title}`}
                    checked={occurrence.is_completed}
                    onChange={() => onToggleOccurrence(occurrence)}
                  />
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate",
                      occurrence.is_completed && "text-tertiary line-through"
                    )}
                  >
                    {occurrence.display_title}
                  </span>
                  <button
                    type="button"
                    aria-label="删除这次安排"
                    className="text-red-600"
                    onClick={() => onDeleteOccurrence(occurrence)}
                  >
                    ×
                  </button>
                </div>
              ))}

            {cell.date && cell.date === addDate && (
              <div className="mt-1 flex flex-col gap-1 rounded-sm border border-subtle bg-surface-1 p-1">
                <select
                  aria-label="选择计划"
                  className="h-6 rounded-sm border border-subtle bg-surface-1 px-1 text-body-xs-regular text-primary"
                  value={addPlanId}
                  onChange={(event) => setAddPlanId(event.target.value)}
                >
                  <option value="">选择计划</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.title}
                    </option>
                  ))}
                </select>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="rounded-sm bg-accent-primary px-1.5 py-0.5 text-body-xs-regular text-white"
                    onClick={() => {
                      if (!addPlanId || !cell.date) return;
                      onCreateOccurrence(addPlanId, cell.date);
                      setAddDate(null);
                      setAddPlanId("");
                    }}
                  >
                    添加
                  </button>
                  <button
                    type="button"
                    className="rounded-sm px-1.5 py-0.5 text-body-xs-regular text-secondary"
                    onClick={() => setAddDate(null)}
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

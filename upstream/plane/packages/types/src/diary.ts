/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TDiaryType = "daily" | "weekly" | "monthly" | "yearly";

export type TDiary = {
  id: string;
  workspace: string;
  owner: string;
  title: string;
  diary_type: TDiaryType;
  diary_date: string;
  period_key: string;
  belongs_month: string;
  is_primary: boolean;
  template: string | null;
  description_json: object;
  description_html: string;
  /** 正文以 Markdown 存储。 */
  description_md: string;
  description_stripped: string | null;
  created_at: string;
  updated_at: string;
};

export type TDiaryTemplate = {
  id: string;
  workspace: string;
  owner: string;
  name: string;
  diary_type: TDiaryType;
  description_json: object;
  description_html: string;
  description_stripped: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type TDiaryLinkTargetType = "diary" | "task" | "project" | "issue";

export type TDiaryLink = {
  id: string;
  workspace: string;
  owner: string;
  diary: string;
  target_type: TDiaryLinkTargetType;
  target_id: string;
  /** 后端解析的目标名称，用于直接展示。 */
  target_label: string;
  created_at: string;
};

export type TPlanRecurrence = "none" | "daily" | "weekdays" | "weekly" | "monthly";

export type TPlan = {
  id: string;
  workspace: string;
  owner: string;
  title: string;
  description: string;
  is_pinned: boolean;
  is_completed: boolean;
  recurrence: TPlanRecurrence;
  recurrence_interval: number;
  recurrence_byweekday: number[];
  recurrence_bymonthday: number | null;
  recurrence_start_date: string | null;
  recurrence_end_date: string | null;
  sort_order: number;
  occurrences: TPlanOccurrence[];
  created_at: string;
  updated_at: string;
};

export type TPlanOccurrence = {
  id: string;
  workspace: string;
  owner: string;
  plan: string;
  date: string;
  is_completed: boolean;
  is_deleted: boolean;
  sort_order: number;
  override_title: string;
  override_description: string;
  display_title: string;
  display_description: string;
  created_at: string;
  updated_at: string;
};

export type TDiaryLinkCreate = {
  target_type: TDiaryLinkTargetType;
  target_id: string;
};

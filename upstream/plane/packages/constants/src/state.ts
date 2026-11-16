/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TStateGroups } from "@plane/types";

export type TDraggableData = {
  groupKey: TStateGroups;
  id: string;
};

export type TStateGroupMeta = {
  key: TStateGroups;
  label: string;
  defaultStateName: string;
  color: string;
};

/**
 * The buckets every project starts with. Anything a user adds afterwards is
 * still a valid group key, so look values up through `getStateGroupMeta`.
 */
export const STATE_GROUPS: Record<string, TStateGroupMeta> = {
  backlog: {
    key: "backlog",
    label: "待办",
    defaultStateName: "Backlog",
    color: "#d9d9d9",
  },
  unstarted: {
    key: "unstarted",
    label: "未开始",
    defaultStateName: "Todo",
    color: "#3f76ff",
  },
  started: {
    key: "started",
    label: "进行中",
    defaultStateName: "In Progress",
    color: "#f59e0b",
  },
  acceptance: {
    key: "acceptance",
    label: "验收",
    defaultStateName: "Acceptance",
    color: "#8b5cf6",
  },
  completed: {
    key: "completed",
    label: "已完成",
    defaultStateName: "Done",
    color: "#16a34a",
  },
  cancelled: {
    key: "cancelled",
    label: "已取消",
    defaultStateName: "Cancelled",
    color: "#dc2626",
  },
};

/** Fallback keeps unknown (user-added) groups rendering instead of crashing. */
export function getStateGroupMeta(key: TStateGroups): TStateGroupMeta {
  return (
    STATE_GROUPS[key] ?? {
      key,
      label: key,
      defaultStateName: key,
      color: "#8b5cf6",
    }
  );
}

export const ARCHIVABLE_STATE_GROUPS = [STATE_GROUPS.completed.key, STATE_GROUPS.cancelled.key];
export const COMPLETED_STATE_GROUPS = [STATE_GROUPS.completed.key];
export const PENDING_STATE_GROUPS = [
  STATE_GROUPS.backlog.key,
  STATE_GROUPS.unstarted.key,
  STATE_GROUPS.started.key,
  STATE_GROUPS.acceptance.key,
  STATE_GROUPS.cancelled.key,
];

export const STATE_DISTRIBUTION = {
  [STATE_GROUPS.backlog.key]: {
    key: STATE_GROUPS.backlog.key,
    issues: "backlog_issues",
    points: "backlog_estimate_points",
  },
  [STATE_GROUPS.unstarted.key]: {
    key: STATE_GROUPS.unstarted.key,
    issues: "unstarted_issues",
    points: "unstarted_estimate_points",
  },
  [STATE_GROUPS.started.key]: {
    key: STATE_GROUPS.started.key,
    issues: "started_issues",
    points: "started_estimate_points",
  },
  [STATE_GROUPS.completed.key]: {
    key: STATE_GROUPS.completed.key,
    issues: "completed_issues",
    points: "completed_estimate_points",
  },
  [STATE_GROUPS.cancelled.key]: {
    key: STATE_GROUPS.cancelled.key,
    issues: "cancelled_issues",
    points: "cancelled_estimate_points",
  },
};

export const PROGRESS_STATE_GROUPS_DETAILS = [
  {
    key: "completed_issues",
    title: "已完成",
    color: "#16A34A",
  },
  {
    key: "started_issues",
    title: "进行中",
    color: "#F59E0B",
  },
  {
    key: "unstarted_issues",
    title: "未开始",
    color: "#3A3A3A",
  },
  {
    key: "backlog_issues",
    title: "待办",
    color: "#A3A3A3",
  },
];

export const DISPLAY_WORKFLOW_PRO_CTA = false;

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type IntakeStateGroup = "triage";

export type StateGroupKey = "backlog" | "unstarted" | "started" | "acceptance" | "completed" | "cancelled";
/**
 * Grouping buckets are user-defined per project, so anything outside the
 * built-in keys is valid too. `(string & {})` keeps literal autocomplete while
 * still accepting a custom key.
 */
export type StateGroup = StateGroupKey | (string & {});

export type StateIconSize = "xs" | "sm" | "md" | "lg" | "xl";

export const STATE_GROUP_COLORS: Record<string, string> = {
  backlog: "#60646C",
  unstarted: "#60646C",
  started: "#F59E0B",
  acceptance: "#8B5CF6",
  completed: "#46A758",
  cancelled: "#9AA4BC",
  triage: "#4E5355",
};

/** Fallback keeps user-defined groups colored instead of rendering undefined. */
export function getStateGroupColor(stateGroup: StateGroup): string {
  return STATE_GROUP_COLORS[stateGroup] ?? "#8B5CF6";
}

export const INTAKE_STATE_GROUP_COLORS: { [key in IntakeStateGroup]: string } = { triage: "#4E5355" };

export function getStateIconSize(size: StateIconSize): string {
  switch (size) {
    case "xs":
      return "10px";
    case "sm":
      return "12px";
    case "md":
      return "14px";
    case "lg":
      return "16px";
    case "xl":
      return "18px";
  }
}

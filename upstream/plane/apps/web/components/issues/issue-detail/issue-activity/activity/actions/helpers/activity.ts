/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TIssueActivity } from "@plane/types";

export const getRelationActivityContent = (activity: TIssueActivity | undefined): string | undefined => {
  if (!activity) return;

  switch (activity.field) {
    case "blocking":
      return activity.old_value === ""
        ? "标记此工作项阻塞的工作项为"
        : "移除了阻塞工作项";
    case "blocked_by":
      return activity.old_value === ""
        ? "标记此工作项被阻塞于"
        : "移除了此工作项的阻塞关系";
    case "duplicate":
      return activity.old_value === ""
        ? "将此工作项标记为重复项，原项为"
        : "移除了此工作项的重复关系";
    case "relates_to":
      return activity.old_value === "" ? "标记此工作项关联于" : "移除了关联";
  }

  return;
};

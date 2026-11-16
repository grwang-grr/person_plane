/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// hooks
import { useLabel } from "@/hooks/store/use-label";
import { useMember } from "@/hooks/store/use-member";
// local imports
import { FilterDate } from "./date";
import { FilterLabels } from "./labels";
import { FilterMember } from "./members";
import { FilterPriority } from "./priority";
import { FilterStatus } from "./status";

export const InboxIssueFilterSelection = observer(function InboxIssueFilterSelection() {
  // hooks
  const {
    project: { projectMemberIds },
  } = useMember();
  const { projectLabels } = useLabel();

  return (
    <>
      {/* status */}
      <FilterStatus />
      {/* Priority */}
      <FilterPriority />
      {/* assignees */}
      <FilterMember filterKey="assignees" label="负责人" memberIds={projectMemberIds ?? []} />
      {/* Created By */}
      <FilterMember filterKey="created_by" label="创建者" memberIds={projectMemberIds ?? []} />
      {/* Labels */}
      <FilterLabels labels={projectLabels ?? []} />
      {/* Created at */}
      <FilterDate filterKey="created_at" label="创建日期" />
      {/* Updated at */}
      <FilterDate filterKey="updated_at" label="最后更新时间" />
    </>
  );
});

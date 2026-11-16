/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import useSWR from "swr";
import { observer } from "mobx-react";
// services
import { WorkItemStatusService } from "@/services/work-item-status.service";
import type { TStateStatusCount } from "@/services/work-item-status.service";

const workItemStatusService = new WorkItemStatusService();

type Props = {
  workspaceSlug: string;
  projectId: string;
};

type Segment = { id: string; label: string; color: string; count: number };

const percentage = (count: number, total: number) => (total > 0 ? Math.round((count / total) * 100) : 0);

/**
 * Completion overview for a single project. It reads live aggregations from the
 * status summary endpoint, so whenever a work item moves between states - including
 * custom states picked in the status menu - this block re-renders with the new split.
 */
export const ProjectOverviewStatus = observer(function ProjectOverviewStatus(props: Props) {
  const { workspaceSlug, projectId } = props;
  const { data, error } = useSWR(
    workspaceSlug && projectId ? ["PROJECT_STATUS_SUMMARY", workspaceSlug, projectId] : null,
    () => workItemStatusService.fetchSummary(workspaceSlug, [projectId]),
    { revalidateOnFocus: false }
  );

  const states = data?.states ?? [];
  const total = data?.total ?? 0;
  const segments: Segment[] = states
    .filter((state: TStateStatusCount) => state.count > 0)
    .map((state: TStateStatusCount) => ({
      id: state.id,
      label: state.name,
      color: state.color,
      count: state.count,
    }));
  const completedCount = states
    .filter((state: TStateStatusCount) => state.group === "completed")
    .reduce((sum: number, state: TStateStatusCount) => sum + state.count, 0);

  return (
    <section className="rounded-lg border border-subtle bg-surface-1 p-5" aria-label="项目完成情况">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-h6-semibold text-primary">完成情况</h2>
        <p className="text-body-xs-regular text-tertiary">
          共 {total} 个工作项 · 已完成 {percentage(completedCount, total)}%
        </p>
      </div>

      {error ? (
        <p role="alert" className="text-body-sm-regular text-danger-primary">
          无法读取完成情况，请稍后重试。
        </p>
      ) : !data ? (
        <div className="h-2 w-full animate-pulse rounded-full bg-layer-2" />
      ) : total === 0 ? (
        <p className="text-body-sm-regular text-secondary">还没有工作项，创建之后这里会按状态汇总进度。</p>
      ) : (
        <>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-layer-2" role="img" aria-label="按状态分布的工作项占比">
            {segments.map((segment) => (
              <div
                key={segment.id}
                className="h-full"
                style={{ width: `${(segment.count / total) * 100}%`, backgroundColor: segment.color }}
                title={`${segment.label} ${segment.count}`}
              />
            ))}
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
            {states.map((state: TStateStatusCount) => (
              <li key={state.id} className="flex items-center gap-2 text-body-xs-regular">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: state.color }}
                  aria-hidden="true"
                />
                <span className="truncate text-secondary">{state.name}</span>
                <span className="ml-auto shrink-0 tabular-nums text-primary">{state.count}</span>
                <span className="w-9 shrink-0 text-right tabular-nums text-tertiary">
                  {percentage(state.count, total)}%
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
});

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";

export type TStateGroup = "backlog" | "unstarted" | "started" | "completed" | "cancelled";

export type TStateStatusCount = {
  id: string;
  name: string;
  color: string;
  group: TStateGroup;
  project_id: string;
  count: number;
  is_terminal: boolean;
};

export type TWorkItemStatusSummary = {
  /** Counts per state group across the selected projects. */
  groups: Record<TStateGroup, number>;
  /** Counts per individual state, ordered by the board sequence. */
  states: TStateStatusCount[];
  /** Work items whose state is outside the visible project set. */
  untracked: number;
  total: number;
};

export class WorkItemStatusService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchSummary(workspaceSlug: string, projectIds?: string[]): Promise<TWorkItemStatusSummary> {
    return this.get(`/api/workspaces/${workspaceSlug}/work-item-status-summary/`, {
      params: projectIds?.length ? { project_ids: projectIds.join(",") } : {},
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

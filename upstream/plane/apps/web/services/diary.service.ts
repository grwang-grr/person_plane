/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// constants
import { API_BASE_URL } from "@plane/constants";
// types
import type {
  TDiary,
  TDiaryLink,
  TDiaryLinkCreate,
  TDiaryTemplate,
  TDiaryType,
  TPlan,
  TPlanOccurrence,
  TPlanRecurrence,
} from "@plane/types";
// services
import { APIService } from "@/services/api.service";
import { isAxiosError } from "axios";
import type { AxiosResponse } from "axios";

export type TDiaryListParams = {
  diary_type?: TDiaryType;
  date_from?: string;
  date_to?: string;
  query?: string;
  per_page?: number;
  cursor?: string;
};

export type TPlanCreatePayload = {
  title: string;
  description?: string;
  is_pinned?: boolean;
  is_completed?: boolean;
  recurrence?: TPlanRecurrence;
  recurrence_interval?: number;
  recurrence_byweekday?: number[];
  recurrence_bymonthday?: number | null;
  recurrence_start_date?: string | null;
  recurrence_end_date?: string | null;
};

export class DiaryService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /** Keep network failures intact while preserving the existing DRF error contract. */
  private async responseData<T>(request: Promise<AxiosResponse<T>>): Promise<T> {
    try {
      return (await request).data;
    } catch (error) {
      if (isAxiosError(error) && error.response) throw error.response.data;
      throw error;
    }
  }

  // ------------------------------ 日记 ------------------------------
  async listDiaries(
    workspaceSlug: string,
    params: TDiaryListParams = {}
  ): Promise<{ results: TDiary[]; total_pages: number }> {
    return this.responseData(this.get(`/api/workspaces/${workspaceSlug}/diaries/`, { params }));
  }

  async getDiary(workspaceSlug: string, id: string): Promise<TDiary> {
    return this.responseData(this.get(`/api/workspaces/${workspaceSlug}/diaries/${id}/`));
  }

  async createDiary(
    workspaceSlug: string,
    payload: {
      diary_date: string;
      diary_type: TDiaryType;
      template?: string;
      title?: string;
      period_key?: string;
      belongs_month?: string;
      description_html?: string;
    }
  ): Promise<TDiary> {
    return this.responseData(this.post(`/api/workspaces/${workspaceSlug}/diaries/`, payload));
  }

  async updateDiary(workspaceSlug: string, id: string, payload: Partial<TDiary>): Promise<TDiary> {
    return this.responseData(this.patch(`/api/workspaces/${workspaceSlug}/diaries/${id}/`, payload));
  }

  async deleteDiary(workspaceSlug: string, id: string): Promise<void> {
    return this.responseData(this.delete(`/api/workspaces/${workspaceSlug}/diaries/${id}/`));
  }

  async setPrimaryDiary(workspaceSlug: string, id: string): Promise<TDiary> {
    return this.responseData(this.post(`/api/workspaces/${workspaceSlug}/diaries/${id}/set-primary/`, {}));
  }

  // ------------------------------ 链接 ------------------------------
  async listDiaryLinks(workspaceSlug: string, diaryId: string): Promise<TDiaryLink[]> {
    return this.responseData(this.get(`/api/workspaces/${workspaceSlug}/diaries/${diaryId}/links/`));
  }

  async createDiaryLink(workspaceSlug: string, diaryId: string, payload: TDiaryLinkCreate): Promise<TDiaryLink> {
    return this.responseData(this.post(`/api/workspaces/${workspaceSlug}/diaries/${diaryId}/links/`, payload));
  }

  async deleteDiaryLink(workspaceSlug: string, diaryId: string, linkId: string): Promise<void> {
    return this.responseData(this.delete(`/api/workspaces/${workspaceSlug}/diaries/${diaryId}/links/${linkId}/`));
  }

  // ------------------------------ 模板 ------------------------------
  async listDiaryTemplates(workspaceSlug: string, diaryType?: TDiaryType): Promise<TDiaryTemplate[]> {
    return this.responseData(
      this.get(`/api/workspaces/${workspaceSlug}/diary-templates/`, { params: { diary_type: diaryType } })
    );
  }

  async createDiaryTemplate(workspaceSlug: string, payload: Partial<TDiaryTemplate>): Promise<TDiaryTemplate> {
    return this.responseData(this.post(`/api/workspaces/${workspaceSlug}/diary-templates/`, payload));
  }

  async updateDiaryTemplate(
    workspaceSlug: string,
    id: string,
    payload: Partial<TDiaryTemplate>
  ): Promise<TDiaryTemplate> {
    return this.responseData(this.patch(`/api/workspaces/${workspaceSlug}/diary-templates/${id}/`, payload));
  }

  async deleteDiaryTemplate(workspaceSlug: string, id: string): Promise<void> {
    return this.responseData(this.delete(`/api/workspaces/${workspaceSlug}/diary-templates/${id}/`));
  }

  // ------------------------------ 计划 ------------------------------
  async listPlans(workspaceSlug: string, params: { query?: string; status?: string } = {}): Promise<TPlan[]> {
    return this.responseData(this.get(`/api/workspaces/${workspaceSlug}/plans/`, { params }));
  }

  async createPlan(workspaceSlug: string, payload: TPlanCreatePayload): Promise<TPlan> {
    return this.responseData(this.post(`/api/workspaces/${workspaceSlug}/plans/`, payload));
  }

  async updatePlan(workspaceSlug: string, id: string, payload: Partial<TPlanCreatePayload>): Promise<TPlan> {
    return this.responseData(this.patch(`/api/workspaces/${workspaceSlug}/plans/${id}/`, payload));
  }

  async deletePlan(
    workspaceSlug: string,
    id: string,
    scope: "this" | "future" | "all" = "all",
    date?: string
  ): Promise<void> {
    return this.responseData(this.delete(`/api/workspaces/${workspaceSlug}/plans/${id}/`, { params: { scope, date } }));
  }

  // ------------------------------ 日程 ------------------------------
  async listOccurrences(workspaceSlug: string, dateFrom: string, dateTo: string): Promise<TPlanOccurrence[]> {
    return this.responseData(
      this.get(`/api/workspaces/${workspaceSlug}/plan-occurrences/`, {
        params: { date_from: dateFrom, date_to: dateTo },
      })
    );
  }

  async createOccurrence(workspaceSlug: string, planId: string, date: string): Promise<TPlanOccurrence> {
    return this.responseData(
      this.post(`/api/workspaces/${workspaceSlug}/plan-occurrences/`, { plan_id: planId, date })
    );
  }

  async updateOccurrence(
    workspaceSlug: string,
    id: string,
    payload: { date?: string; is_completed?: boolean; override_title?: string; override_description?: string }
  ): Promise<TPlanOccurrence> {
    return this.responseData(this.patch(`/api/workspaces/${workspaceSlug}/plan-occurrences/${id}/`, payload));
  }

  async deleteOccurrence(workspaceSlug: string, id: string): Promise<void> {
    return this.responseData(this.delete(`/api/workspaces/${workspaceSlug}/plan-occurrences/${id}/`));
  }
}

export const diaryService = new DiaryService();

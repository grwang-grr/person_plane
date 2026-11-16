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

  // ------------------------------ 日记 ------------------------------
  async listDiaries(workspaceSlug: string, params: TDiaryListParams = {}): Promise<{ results: TDiary[]; total_pages: number }> {
    return this.get(`/api/workspaces/${workspaceSlug}/diaries/`, { params })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getDiary(workspaceSlug: string, id: string): Promise<TDiary> {
    return this.get(`/api/workspaces/${workspaceSlug}/diaries/${id}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
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
    return this.post(`/api/workspaces/${workspaceSlug}/diaries/`, payload)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateDiary(workspaceSlug: string, id: string, payload: Partial<TDiary>): Promise<TDiary> {
    return this.patch(`/api/workspaces/${workspaceSlug}/diaries/${id}/`, payload)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteDiary(workspaceSlug: string, id: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/diaries/${id}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async setPrimaryDiary(workspaceSlug: string, id: string): Promise<TDiary> {
    return this.post(`/api/workspaces/${workspaceSlug}/diaries/${id}/set-primary/`, {})
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  // ------------------------------ 链接 ------------------------------
  async listDiaryLinks(workspaceSlug: string, diaryId: string): Promise<TDiaryLink[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/diaries/${diaryId}/links/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createDiaryLink(workspaceSlug: string, diaryId: string, payload: TDiaryLinkCreate): Promise<TDiaryLink> {
    return this.post(`/api/workspaces/${workspaceSlug}/diaries/${diaryId}/links/`, payload)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteDiaryLink(workspaceSlug: string, diaryId: string, linkId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/diaries/${diaryId}/links/${linkId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  // ------------------------------ 模板 ------------------------------
  async listDiaryTemplates(workspaceSlug: string, diaryType?: TDiaryType): Promise<TDiaryTemplate[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/diary-templates/`, { params: { diary_type: diaryType } })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createDiaryTemplate(workspaceSlug: string, payload: Partial<TDiaryTemplate>): Promise<TDiaryTemplate> {
    return this.post(`/api/workspaces/${workspaceSlug}/diary-templates/`, payload)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateDiaryTemplate(workspaceSlug: string, id: string, payload: Partial<TDiaryTemplate>): Promise<TDiaryTemplate> {
    return this.patch(`/api/workspaces/${workspaceSlug}/diary-templates/${id}/`, payload)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteDiaryTemplate(workspaceSlug: string, id: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/diary-templates/${id}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  // ------------------------------ 计划 ------------------------------
  async listPlans(workspaceSlug: string, params: { query?: string; status?: string } = {}): Promise<TPlan[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/plans/`, { params })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createPlan(workspaceSlug: string, payload: TPlanCreatePayload): Promise<TPlan> {
    return this.post(`/api/workspaces/${workspaceSlug}/plans/`, payload)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updatePlan(workspaceSlug: string, id: string, payload: Partial<TPlanCreatePayload>): Promise<TPlan> {
    return this.patch(`/api/workspaces/${workspaceSlug}/plans/${id}/`, payload)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deletePlan(workspaceSlug: string, id: string, scope: "this" | "future" | "all" = "all", date?: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/plans/${id}/`, { params: { scope, date } })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  // ------------------------------ 日程 ------------------------------
  async listOccurrences(workspaceSlug: string, dateFrom: string, dateTo: string): Promise<TPlanOccurrence[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/plan-occurrences/`, {
      params: { date_from: dateFrom, date_to: dateTo },
    })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createOccurrence(workspaceSlug: string, planId: string, date: string): Promise<TPlanOccurrence> {
    return this.post(`/api/workspaces/${workspaceSlug}/plan-occurrences/`, { plan_id: planId, date })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateOccurrence(
    workspaceSlug: string,
    id: string,
    payload: { date?: string; is_completed?: boolean; override_title?: string; override_description?: string }
  ): Promise<TPlanOccurrence> {
    return this.patch(`/api/workspaces/${workspaceSlug}/plan-occurrences/${id}/`, payload)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteOccurrence(workspaceSlug: string, id: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/plan-occurrences/${id}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}

export const diaryService = new DiaryService();

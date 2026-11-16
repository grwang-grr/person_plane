import { isAxiosError } from "axios";
import { APIService } from "./api.service";

export const problemPriority = { urgent: "紧急", high: "高", medium: "中", low: "低" } as const;
export const problemSeverity = {
  critical: "致命",
  major: "严重",
  normal: "一般",
  minor: "轻微",
  unknown: "待评估",
} as const;
export const problemStatus = {
  open: "待处理",
  progress: "处理中",
  verify: "待验证",
  closed: "已关闭",
  paused: "暂缓",
} as const;
export const problemKind = {
  defect: "功能缺陷",
  data: "数据异常",
  blocker: "流程阻塞",
  improvement: "体验改进",
  other: "其他",
} as const;
export type ProblemProject = { id: string; name: string; identifier: string; archived: boolean; deleted: boolean };
export type ProblemTask = {
  id: string;
  name: string;
  number: string;
  project_id: string;
  project_name: string;
  archived: boolean;
  deleted: boolean;
};
export type ProblemEntry = {
  id: string;
  text: string;
  changes: Record<string, [unknown, unknown]>;
  created_at: string;
};
export type ProblemAttachment = { id: string; name: string; size: number; created_at: string; url: string };
export type PersonalProblem = {
  id: string;
  number: string;
  title: string;
  description_html: string;
  project: ProblemProject | null;
  task: ProblemTask | null;
  severity: keyof typeof problemSeverity;
  priority: keyof typeof problemPriority;
  status: keyof typeof problemStatus;
  kind: keyof typeof problemKind;
  due_date: string | null;
  resolution: string;
  labels: string[];
  revision: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  deleted_at: string | null;
  overdue: boolean;
  entries?: ProblemEntry[];
  attachments?: ProblemAttachment[];
};
export type ProblemInput = Pick<
  PersonalProblem,
  "title" | "description_html" | "severity" | "priority" | "kind" | "due_date" | "labels"
> & { project_id: string | null; task_id: string | null };
export type ProblemList = {
  results: PersonalProblem[];
  total: number;
  page: number;
  page_size: number;
  counts: Record<string, number>;
  /** 未删除问题按状态聚合的数量，用于状态分布概览。 */
  status_counts: Record<string, number>;
};
export type ProblemOptions = { projects: ProblemProject[]; tasks: ProblemTask[]; task_count: number; labels: string[] };

export function problemError(error: unknown): string {
  if (isAxiosError<unknown>(error) && error.response) {
    const body = error.response.data;
    if (typeof body === "object" && body !== null) {
      const messages = Object.values(body)
        .flat()
        .filter((value): value is string => typeof value === "string");
      if (messages.length) return messages.join("；");
    }
  }
  return "操作失败，请检查连接后重试。";
}

class ProblemService extends APIService {
  constructor() {
    super("");
  }
  async list(params: URLSearchParams): Promise<ProblemList> {
    return (await this.get(`/api/personal/problems/?${params}`)).data;
  }
  async options(params = new URLSearchParams()): Promise<ProblemOptions> {
    return (await this.get(`/api/personal/problems/options/?${params}`)).data;
  }
  async detail(id: string, deleted = false): Promise<PersonalProblem> {
    return (await this.get(`/api/personal/problems/${id}/${deleted ? "?deleted=1" : ""}`)).data;
  }
  async create(data: ProblemInput): Promise<PersonalProblem> {
    return (await this.post("/api/personal/problems/", data)).data;
  }
  async update(
    problem: PersonalProblem,
    data: Partial<ProblemInput> & { status?: PersonalProblem["status"]; resolution?: string }
  ): Promise<PersonalProblem> {
    return (await this.patch(`/api/personal/problems/${problem.id}/`, { ...data, revision: problem.revision })).data;
  }
  async trash(problem: PersonalProblem): Promise<void> {
    await this.delete(`/api/personal/problems/${problem.id}/`, { revision: problem.revision });
  }
  async restore(problem: PersonalProblem): Promise<PersonalProblem> {
    return (await this.post(`/api/personal/problems/${problem.id}/restore/`, { revision: problem.revision })).data;
  }
  async addEntry(id: string, text: string): Promise<PersonalProblem> {
    return (await this.post(`/api/personal/problems/${id}/entries/`, { text })).data;
  }
  async upload(id: string, file: File): Promise<PersonalProblem> {
    const data = new FormData();
    data.append("file", file);
    return (await this.post(`/api/personal/problems/${id}/attachments/`, data)).data;
  }
  async removeAttachment(id: string, attachment: string): Promise<PersonalProblem> {
    return (await this.delete(`/api/personal/problems/${id}/attachments/${attachment}/`)).data;
  }
}
export const problemService = new ProblemService();

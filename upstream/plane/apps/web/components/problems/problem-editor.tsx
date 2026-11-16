import { useCallback, useEffect, useState } from "react";
import { useBeforeUnload, useBlocker } from "react-router";
import useSWR from "swr";
import { Button } from "@makeplane/propel/components/button";
import { Icon } from "@makeplane/propel/components/icon";
import { Input } from "@makeplane/propel/components/input";
import { Dialog, DialogContent, DialogTitle } from "@makeplane/propel/components/dialog";
import { AddFilled, CheckDoneFilled, X } from "@makeplane/propel/icons";
import { RichTextEditor } from "@/components/editor/rich-text";
import {
  problemError,
  problemKind,
  problemPriority,
  problemService,
  problemSeverity,
} from "@/services/problem.service";
import type { PersonalProblem, ProblemInput, ProblemProject, ProblemTask } from "@/services/problem.service";

export const controlClass =
  "w-full rounded-sm border border-subtle bg-surface-1 px-3 py-2 text-body-sm-regular text-primary";

export function useProblemDraftGuard(dirty: boolean) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty &&
      `${currentLocation.pathname}${currentLocation.search}` !== `${nextLocation.pathname}${nextLocation.search}`
  );
  useEffect(() => {
    if (blocker.state === "blocked") {
      if (window.confirm("有未保存的内容，确定离开并放弃更改吗？")) blocker.proceed();
      else blocker.reset();
    }
  }, [blocker]);
  useBeforeUnload(
    useCallback(
      (event: BeforeUnloadEvent) => {
        if (dirty) {
          event.preventDefault();
          event.returnValue = "";
        }
      },
      [dirty]
    )
  );
}

export function ProblemChoices({
  label,
  value,
  choices,
  onChange,
  empty,
}: {
  label: string;
  value: string;
  choices: Record<string, string>;
  onChange: (value: string) => void;
  empty?: string;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5 text-body-sm-regular text-secondary">
      {label}
      <select aria-label={label} className={controlClass} value={value} onChange={(e) => onChange(e.target.value)}>
        {empty !== undefined && <option value="">{empty}</option>}
        {Object.entries(choices).map(([key, text]) => (
          <option key={key} value={key}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ProblemDescription({
  id,
  html,
  onChange,
  workspaceSlug,
  workspaceId,
}: {
  id: string;
  html: string;
  onChange?: (html: string) => void;
  workspaceSlug: string;
  workspaceId: string;
}) {
  const shared = {
    id,
    initialValue: html,
    containerClassName: "problem-rich-text min-h-32 rounded-sm border border-subtle bg-surface-1 p-2",
    workspaceSlug,
    workspaceId,
    disabledExtensions: ["image", "issue-embed", "collaboration-cursor"] as (
      | "image"
      | "issue-embed"
      | "collaboration-cursor"
    )[],
    placeholder: "现象、影响、复现步骤或期望结果",
    dragDropEnabled: false,
  };
  if (!onChange) return <RichTextEditor {...shared} editable={false} />;
  return (
    <RichTextEditor
      {...shared}
      editable
      searchMentionCallback={async () => ({})}
      uploadFile={async () => {
        throw new Error("请保存问题后在附件区上传文件。");
      }}
      duplicateFile={async () => {
        throw new Error("请在附件区添加文件。");
      }}
      onChange={(_json, next) => onChange(next === "<p></p>" ? "" : next)}
    />
  );
}

export function ProblemEditor({
  initial,
  workspaceSlug,
  workspaceId,
  onClose,
  onSaved,
}: {
  initial: PersonalProblem | null;
  workspaceSlug: string;
  workspaceId: string;
  onClose: () => void;
  onSaved: (problem: PersonalProblem) => Promise<void>;
}) {
  const [baseline] = useState<ProblemInput>(() => ({
    title: initial?.title ?? "",
    description_html: initial?.description_html ?? "",
    project_id: initial?.project?.id ?? null,
    task_id: initial?.task?.id ?? null,
    kind: initial?.kind ?? "other",
    priority: initial?.priority ?? "medium",
    severity: initial?.severity ?? "unknown",
    due_date: initial?.due_date ?? null,
    labels: initial?.labels ?? [],
  }));
  const [draft, setDraft] = useState(baseline);
  const [linkedProject, setLinkedProject] = useState<ProblemProject | null>(initial?.project ?? null);
  const [linkedTask, setLinkedTask] = useState<ProblemTask | null>(initial?.task ?? null);
  const [mode, setMode] = useState(initial?.task ? "task" : initial?.project ? "project" : "none");
  const [taskQuery, setTaskQuery] = useState("");
  const [projectQuery, setProjectQuery] = useState("");
  const [search, setSearch] = useState({ task: "", project: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(baseline) !== JSON.stringify(draft);
  useProblemDraftGuard(dirty && !saving);
  useEffect(() => {
    const timer = setTimeout(() => setSearch({ task: taskQuery, project: projectQuery }), 250);
    return () => clearTimeout(timer);
  }, [taskQuery, projectQuery]);
  const optionsParams = new URLSearchParams({ q: search.task, project_q: search.project });
  const {
    data: options,
    error: optionsError,
    mutate: retryOptions,
  } = useSWR(["problem-options", optionsParams.toString()], () => problemService.options(optionsParams));
  const projects = [...(options?.projects ?? [])];
  if (linkedProject && !projects.some((p) => p.id === linkedProject.id)) projects.push(linkedProject);
  const tasks = [...(options?.tasks ?? [])];
  if (linkedTask && !tasks.some((t) => t.id === linkedTask.id)) tasks.push(linkedTask);
  const selectedTask = tasks.find((t) => t.id === draft.task_id);
  const patch = <K extends keyof ProblemInput>(key: K, value: ProblemInput[K]) =>
    setDraft((old) => ({ ...old, [key]: value }));
  const changeMode = (value: string) => {
    if (draft.task_id && value !== "task" && !window.confirm("切换关联方式将清除当前任务关联，确定继续吗？")) return;
    setMode(value);
    if (value === "none") setDraft((old) => ({ ...old, project_id: null, task_id: null }));
    else if (value === "project") patch("task_id", null);
  };
  const close = () => {
    if (!dirty || window.confirm("放弃未保存的问题内容吗？")) onClose();
  };
  const submit = async () => {
    if (!draft.title.trim()) {
      setError("请输入问题标题。");
      return;
    }
    if ((mode === "project" && !draft.project_id) || (mode === "task" && !draft.task_id)) {
      setError("请选择要关联的项目或任务。");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...draft,
        labels: draft.labels.map((label) => label.trim()).filter(Boolean),
        title: draft.title.trim(),
        project_id:
          mode === "none" ? null : mode === "task" ? (selectedTask?.project_id ?? draft.project_id) : draft.project_id,
        task_id: mode === "task" ? draft.task_id : null,
      };
      const result = initial ? await problemService.update(initial, payload) : await problemService.create(payload);
      await onSaved(result);
    } catch (e) {
      setError(problemError(e));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      discard={{
        when: dirty && !saving,
        title: "放弃未保存的更改？",
        description: "当前问题内容尚未保存。",
        discardLabel: "放弃更改",
        keepLabel: "继续编辑",
      }}
    >
      <DialogContent size="xl" data-problem-dialog="editor">
        <div className="max-h-[88dvh] overflow-y-auto p-5 sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <DialogTitle>{initial ? `编辑问题 · ${initial.number}` : "新建问题"}</DialogTitle>
            <Button
              stretch="auto"
              variant="ghost"
              size="sm"
              label="关闭"
              disabled={saving}
              onClick={close}
              icon={<Icon icon={X} />}
            />
          </div>
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0 space-y-5">
              <label htmlFor="problem-title-input" className="flex flex-col gap-2 text-body-sm-medium text-primary">
                问题标题（必填）
                <Input
                  size="md"
                  aria-label="问题标题"
                  id="problem-title-input"
                  autoFocus
                  value={draft.title}
                  maxLength={200}
                  placeholder="一句话描述遇到的问题"
                  onChange={(e) => patch("title", e.target.value)}
                />
              </label>
              <div className="space-y-2">
                <span className="text-body-sm-medium text-primary">问题说明</span>
                <ProblemDescription
                  id={`problem-editor-${initial?.id ?? "new"}`}
                  html={baseline.description_html}
                  onChange={(html) => patch("description_html", html)}
                  workspaceId={workspaceId}
                  workspaceSlug={workspaceSlug}
                />
                <p className="text-body-xs-regular text-tertiary">
                  可记录现象、影响、复现步骤与期望结果；保存问题后可添加附件。
                </p>
              </div>
              <label className="flex flex-col gap-2 text-body-sm-regular text-secondary">
                标签
                <Input
                  size="md"
                  value={draft.labels.join("，")}
                  list="personal-problem-labels"
                  placeholder="用逗号分隔多个标签"
                  onChange={(e) =>
                    patch(
                      "labels",
                      e.target.value.split(/[,，]/).map((v) => v.trim())
                    )
                  }
                />
                <datalist id="personal-problem-labels">
                  {options?.labels.map((label) => (
                    <option key={label} value={label} />
                  ))}
                </datalist>
              </label>
            </div>
            <div className="space-y-4">
              <ProblemChoices
                label="关联方式"
                value={mode}
                onChange={changeMode}
                choices={{ none: "独立问题", project: "关联项目", task: "关联任务" }}
              />
              {mode === "project" && (
                <>
                  <Input
                    size="md"
                    aria-label="搜索关联项目"
                    placeholder="搜索项目名称或标识"
                    value={projectQuery}
                    onChange={(e) => setProjectQuery(e.target.value)}
                  />
                  <ProblemChoices
                    label="关联项目"
                    value={draft.project_id ?? ""}
                    empty="请选择项目"
                    onChange={(id) => {
                      setLinkedProject(projects.find((p) => p.id === id) ?? null);
                      patch("project_id", id || null);
                    }}
                    choices={Object.fromEntries(
                      projects.map((p) => [
                        p.id,
                        `${p.name}${p.deleted ? "（已删除）" : p.archived ? "（已归档）" : ""}`,
                      ])
                    )}
                  />
                </>
              )}
              {mode === "task" && (
                <>
                  <Input
                    size="md"
                    aria-label="搜索关联任务"
                    placeholder="搜索任务标题、编号或项目"
                    value={taskQuery}
                    onChange={(e) => setTaskQuery(e.target.value)}
                  />
                  <ProblemChoices
                    label="关联任务"
                    value={draft.task_id ?? ""}
                    empty="请选择任务"
                    onChange={(id) => {
                      const task = tasks.find((t) => t.id === id);
                      setLinkedTask(task ?? null);
                      setLinkedProject(projects.find((p) => p.id === task?.project_id) ?? null);
                      setDraft((old) => ({
                        ...old,
                        task_id: id || null,
                        project_id: task?.project_id ?? old.project_id,
                      }));
                    }}
                    choices={Object.fromEntries(
                      tasks.map((t) => [
                        t.id,
                        `${t.number} · ${t.name}${t.deleted ? "（已删除）" : t.archived ? "（已归档）" : ""}`,
                      ])
                    )}
                  />
                  <p className="text-body-xs-regular text-secondary">
                    所属项目：{selectedTask?.project_name ?? "选择任务后自动带出"}
                  </p>
                  {options && options.task_count > 100 && (
                    <p className="text-body-xs-regular text-secondary">显示最近 100 条，请输入关键词查找其他任务。</p>
                  )}
                </>
              )}
              {optionsError && (
                <div role="alert" className="text-danger-primary text-body-xs-regular">
                  关联选项加载失败。
                  <button type="button" className="underline" onClick={() => void retryOptions()}>
                    重试
                  </button>
                </div>
              )}
              <ProblemChoices
                label="严重程度（影响大小）"
                value={draft.severity}
                choices={problemSeverity}
                onChange={(v) => patch("severity", v as ProblemInput["severity"])}
              />
              <ProblemChoices
                label="优先级（处理顺序）"
                value={draft.priority}
                choices={problemPriority}
                onChange={(v) => patch("priority", v as ProblemInput["priority"])}
              />
              <ProblemChoices
                label="问题类型"
                value={draft.kind}
                choices={problemKind}
                onChange={(v) => patch("kind", v as ProblemInput["kind"])}
              />
              <label htmlFor="problem-due-input" className="flex flex-col gap-1.5 text-body-sm-regular text-secondary">
                预计解决日期
                <Input
                  size="md"
                  type="date"
                  id="problem-due-input"
                  value={draft.due_date ?? ""}
                  onChange={(e) => patch("due_date", e.target.value || null)}
                />
              </label>
            </div>
          </div>
          {error && (
            <p role="alert" className="text-danger-primary mt-5 text-body-sm-regular">
              {error}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <Button
              stretch="auto"
              variant="secondary"
              size="md"
              label="取消"
              disabled={saving}
              onClick={close}
              icon={<Icon icon={X} />}
            />
            <Button
              stretch="auto"
              variant="primary"
              size="md"
              label={saving ? "正在保存…" : initial ? "保存更改" : "创建问题"}
              disabled={saving}
              onClick={() => void submit()}
              icon={<Icon icon={initial ? CheckDoneFilled : AddFilled} />}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

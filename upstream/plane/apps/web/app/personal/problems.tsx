import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import useSWR from "swr";
import { Button } from "@makeplane/propel/components/button";
import { Icon } from "@makeplane/propel/components/icon";
import { Input } from "@makeplane/propel/components/input";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
import {
  AddFilled,
  ArchiveFilled,
  CheckDoneFilled,
  ChevronLeftFilled,
  ChevronRightFilled,
  CopyFilled,
  DisplayFilled,
  FilterFilled,
  InfoFilled,
  MoreHorizontalFilled,
  PauseFilled,
  PlayFilled,
  RefreshFilled,
} from "@makeplane/propel/icons";
import { PageHead } from "@/components/core/page-title";
import { useWorkspace } from "@/hooks/store/use-workspace";
import {
  problemError,
  problemKind,
  problemPriority,
  problemService,
  problemSeverity,
  problemStatus,
} from "@/services/problem.service";
import type { PersonalProblem } from "@/services/problem.service";
import { ProblemEditor, ProblemChoices, controlClass } from "@/components/problems/problem-editor";
import { ProblemDetail } from "@/components/problems/problem-detail";
import {
  ProblemMetaBadges,
  ProblemOverdueBadge,
  ProblemPrioritySelect,
  ProblemSeveritySelect,
  ProblemStatusOverview,
  ProblemStatusSelect,
  VIEW_ICONS,
} from "@/components/problems/problem-meta";
// oxlint-disable-next-line import/no-unassigned-import -- Page-specific layout styles.
import "./problems.css";

const tabs = { open: "未关闭", important: "重要", closed: "已关闭", all: "全部", trash: "回收站" } as const;
const allColumns = { kind: "类型", labels: "标签", due_date: "预计解决日期", closed_at: "关闭日期" };

export default function ProblemsPage() {
  const { workspaceSlug = "personal" } = useParams();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? "00000000-0000-4000-8000-000000000002";
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [showFilters, setShowFilters] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  const [editor, setEditor] = useState<PersonalProblem | "new" | null>(null);
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [projectQuery, setProjectQuery] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const view = params.get("view") ?? "open";
  const queryText = params.get("q") ?? "";
  const selectedId = params.get("problem");
  const selectedColumns = new Set((params.get("columns") ?? "").split(",").filter(Boolean));
  const query = new URLSearchParams(params);
  query.delete("problem");
  query.delete("columns");
  const { data, error, isLoading, mutate } = useSWR(
    ["personal-problems", query.toString()],
    () => problemService.list(query),
    { keepPreviousData: true }
  );
  const { data: options } = useSWR(["problem-list-options", projectSearch], () =>
    problemService.options(new URLSearchParams({ project_q: projectSearch, include_inactive: "1" }))
  );
  const setFilter = useCallback((key: string, value: string, replace = false) =>
    setParams(
      (old) => {
        const next = new URLSearchParams(old);
        if (value) next.set(key, value);
        else next.delete(key);
        next.delete("page");
        if (key === "view") next.delete("problem");
        return next;
      },
      { replace }
    ), [setParams]);
  useEffect(() => {
    setSearch(queryText);
  }, [queryText]);
  useEffect(() => {
    const timer = setTimeout(() => setProjectSearch(projectQuery), 250);
    return () => clearTimeout(timer);
  }, [projectQuery]);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== queryText) setFilter("q", search, true);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, queryText, setFilter]);
  const select = (id: string | null) =>
    setParams((old) => {
      const next = new URLSearchParams(old);
      if (id) next.set("problem", id);
      else next.delete("problem");
      return next;
    });
  const refresh = async () => {
    await mutate();
  };
  const run = async (problem: PersonalProblem, operation: () => Promise<unknown>) => {
    setBusyId(problem.id);
    setActionError("");
    try {
      await operation();
      await refresh();
    } catch (e) {
      setActionError(problemError(e));
    } finally {
      setBusyId(null);
    }
  };
  const toggleColumn = (column: string) => {
    const next = new Set(selectedColumns);
    if (next.has(column)) next.delete(column);
    else next.add(column);
    setParams(
      (old) => {
        const update = new URLSearchParams(old);
        if (next.size) update.set("columns", [...next].join(","));
        else update.delete("columns");
        return update;
      },
      { replace: true }
    );
  };
  const clearFilters = () => {
    setSearch("");
    setProjectQuery("");
    setParams(new URLSearchParams({ view }));
  };
  return (
    <div className="problem-page h-full overflow-y-auto bg-surface-1 px-page-x py-6">
      <PageHead title="问题台账" />
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-h5-semibold text-primary">
          问题 <span className="ml-2 text-body-sm-regular text-tertiary">{data?.counts.all ?? 0}</span>
        </h1>
        <div className="flex gap-2">
          <Button
            stretch="auto"
            variant="secondary"
            size="md"
            label="刷新"
            onClick={() => void refresh()}
            icon={<Icon icon={RefreshFilled} />}
          />
          <Button
            stretch="auto"
            variant="primary"
            size="md"
            label="新建问题"
            onClick={() => setEditor("new")}
            icon={<Icon icon={AddFilled} />}
          />
        </div>
      </header>
      <nav className="mb-5 flex flex-wrap gap-5 border-b border-subtle" aria-label="问题视图">
        {Object.entries(tabs).map(([key, label]) => {
          const ViewIcon = VIEW_ICONS[key];
          return (
            <button
              key={key}
              type="button"
              aria-current={view === key ? "page" : undefined}
              className={`inline-flex items-center gap-1.5 border-b-2 pb-3 text-body-sm-medium ${view === key ? "border-primary text-primary" : "border-transparent text-tertiary hover:text-secondary"}`}
              onClick={() => setFilter("view", key)}
            >
              {ViewIcon && <ViewIcon className="h-3.5 w-3.5 shrink-0" />}
              {label}
              <span className="text-body-xs-regular text-tertiary">{data?.counts[key] ?? 0}</span>
            </button>
          );
        })}
      </nav>
      {view !== "trash" && data?.status_counts && (
        <ProblemStatusOverview
          counts={data.status_counts}
          activeStatus={params.get("status") ?? ""}
          onSelect={(status) => setFilter("status", params.get("status") === status ? "" : status)}
        />
      )}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1 rounded-sm border border-subtle px-2">
          <Input
            size="md"
            aria-label="搜索问题"
            placeholder="搜索问题标题或编号"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="min-w-40">
          <ProblemChoices
            label="关联项目"
            value={params.get("project") ?? ""}
            empty="全部项目"
            onChange={(value) => setFilter("project", value)}
            choices={{
              none: "未关联项目",
              ...Object.fromEntries((options?.projects ?? []).map((p) => [p.id, p.name])),
            }}
          />
        </div>
        <Button
          stretch="auto"
          variant="secondary"
          size="md"
          label="筛选"
          aria-expanded={showFilters}
          onClick={() => setShowFilters(!showFilters)}
          icon={<Icon icon={FilterFilled} />}
        />
        <Button
          stretch="auto"
          variant="secondary"
          size="md"
          label="显示列"
          aria-expanded={showColumns}
          onClick={() => setShowColumns(!showColumns)}
          icon={<Icon icon={DisplayFilled} />}
        />
        <div className="min-w-36">
          <ProblemChoices
            label="排序"
            value={params.get("order") ?? "importance"}
            onChange={(value) => setFilter("order", value)}
            choices={{
              importance: "重要程度",
              "-updated_at": "最近更新",
              "-created_at": "最近创建",
              due_date: "预计解决日期",
              number: "问题编号",
            }}
          />
        </div>
      </div>
      {showFilters && (
        <div className="mb-5 grid grid-cols-1 items-end gap-3 rounded-sm border border-subtle p-4 sm:grid-cols-2 xl:grid-cols-4">
          <ProblemChoices
            label="严重程度"
            value={params.get("severity") ?? ""}
            empty="全部严重程度"
            choices={problemSeverity}
            onChange={(v) => setFilter("severity", v)}
          />
          <ProblemChoices
            label="优先级"
            value={params.get("priority") ?? ""}
            empty="全部优先级"
            choices={problemPriority}
            onChange={(v) => setFilter("priority", v)}
          />
          <ProblemChoices
            label="状态"
            value={params.get("status") ?? ""}
            empty="全部状态"
            choices={problemStatus}
            onChange={(v) => setFilter("status", v)}
          />
          <ProblemChoices
            label="类型"
            value={params.get("kind") ?? ""}
            empty="全部类型"
            choices={problemKind}
            onChange={(v) => setFilter("kind", v)}
          />
          <label className="space-y-1 text-body-sm-regular text-secondary">
            标签
            <select
              aria-label="筛选标签"
              className={controlClass}
              value={params.get("label") ?? ""}
              onChange={(e) => setFilter("label", e.target.value)}
            >
              <option value="">全部标签</option>
              {options?.labels.map((label) => (
                <option key={label}>{label}</option>
              ))}
            </select>
          </label>
          <label htmlFor="problem-project-search" className="space-y-1 text-body-sm-regular text-secondary">
            搜索项目选项
            <Input
              id="problem-project-search"
              size="md"
              value={projectQuery}
              onChange={(e) => setProjectQuery(e.target.value)}
              placeholder="查找更多项目"
            />
          </label>
          <label className="flex items-center gap-2 text-body-sm-regular text-secondary">
            <input
              type="checkbox"
              checked={params.get("overdue") === "1"}
              onChange={(e) => setFilter("overdue", e.target.checked ? "1" : "")}
            />
            仅显示已逾期
          </label>
          <Button stretch="auto" variant="ghost" size="md" label="清除筛选" onClick={clearFilters} />
        </div>
      )}
      {showColumns && (
        <div className="mb-4 flex flex-wrap gap-5 rounded-sm border border-subtle p-3">
          {Object.entries(allColumns).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-body-sm-regular text-secondary">
              <input type="checkbox" checked={selectedColumns.has(key)} onChange={() => toggleColumn(key)} />
              {label}
            </label>
          ))}
        </div>
      )}
      {(error || actionError) && (
        <div role="alert" className="text-danger-primary mb-4 text-body-sm-regular">
          {actionError || problemError(error)}
          <button
            type="button"
            className="ml-2 underline"
            onClick={() => {
              setActionError("");
              void refresh();
            }}
          >
            重新加载
          </button>
        </div>
      )}
      <div className="problem-list" role="table" aria-label="问题列表">
        <div className="problem-row problem-head border-b border-subtle text-body-xs-regular text-tertiary" role="row">
          <div className="problem-cell problem-cell-title" role="columnheader">
            问题 / 关联对象
          </div>
          <div className="problem-cell problem-cell-severity" role="columnheader">
            严重程度
          </div>
          <div className="problem-cell problem-cell-priority" role="columnheader">
            优先级
          </div>
          <div className="problem-cell problem-cell-status" role="columnheader">
            状态
          </div>
          <div className="problem-cell problem-cell-updated" role="columnheader">
            更新时间
          </div>
          <div className="problem-cell problem-cell-actions" role="columnheader" aria-label="操作" />
        </div>
        {data?.results.map((problem) => (
          <div className="problem-row border-b border-subtle text-body-sm-regular" role="row" key={problem.id}>
            <div className="problem-cell problem-cell-title min-w-0" role="cell">
              <button
                className="w-full text-left font-medium break-words text-primary hover:text-accent-primary"
                type="button"
                onClick={() => select(problem.id)}
              >
                <span className="mr-2 text-body-xs-regular text-tertiary">{problem.number}</span>
                {problem.title}
              </button>
              <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-body-xs-regular text-tertiary">
                <span>
                  {problem.project?.name ?? "独立问题"}
                  {problem.project?.deleted ? "（已删除）" : problem.project?.archived ? "（已归档）" : ""}
                </span>
                {problem.task && (
                  <span>
                    · {problem.task.number} {problem.task.name}
                    {problem.task.deleted ? "（已删除）" : problem.task.archived ? "（已归档）" : ""}
                  </span>
                )}
                {problem.overdue && <ProblemOverdueBadge />}
              </div>
              <div className="problem-mobile-badges mt-2 gap-2">
                <ProblemMetaBadges severity={problem.severity} priority={problem.priority} status={problem.status} />
              </div>
              {selectedColumns.size > 0 && (
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-body-xs-regular text-secondary">
                  {selectedColumns.has("kind") && <span>类型：{problemKind[problem.kind]}</span>}
                  {selectedColumns.has("labels") && <span>标签：{problem.labels.join("、") || "无"}</span>}
                  {selectedColumns.has("due_date") && <span>预计解决：{problem.due_date ?? "未设置"}</span>}
                  {selectedColumns.has("closed_at") && (
                    <span>关闭日期：{problem.closed_at?.slice(0, 10) ?? "未关闭"}</span>
                  )}
                </div>
              )}
            </div>
            <div className="problem-cell problem-cell-severity" role="cell">
              <ProblemSeveritySelect
                severity={problem.severity}
                disabled={view === "trash" || busyId === problem.id}
                onChange={(severity) => void run(problem, () => problemService.update(problem, { severity }))}
              />
            </div>
            <div className="problem-cell problem-cell-priority" role="cell">
              <ProblemPrioritySelect
                priority={problem.priority}
                disabled={view === "trash" || busyId === problem.id}
                onChange={(priority) => void run(problem, () => problemService.update(problem, { priority }))}
              />
            </div>
            <div className="problem-cell problem-cell-status" role="cell">
              <ProblemStatusSelect
                status={problem.status}
                disabled={view === "trash" || busyId === problem.id}
                onChange={(status) => void run(problem, () => problemService.update(problem, { status }))}
              />
            </div>
            <div className="problem-cell problem-cell-updated text-body-xs-regular text-tertiary" role="cell">
              {new Date(problem.updated_at).toLocaleDateString("zh-CN")}
            </div>
            <div className="problem-cell problem-cell-actions" role="cell">
              <Menu>
                <MenuTrigger
                  render={
                    <button
                      type="button"
                      aria-label={`${problem.number} 更多操作`}
                      className="rounded-sm p-1 text-tertiary hover:bg-layer-1-hover hover:text-secondary"
                      disabled={busyId === problem.id}
                    />
                  }
                >
                  <MoreHorizontalFilled className="h-4 w-4" />
                </MenuTrigger>
                <MenuContent align="end">
                  <MenuItem
                    label="查看详情"
                    icon={<Icon icon={InfoFilled} />}
                    onClick={() => select(problem.id)}
                  />
                  {view === "trash" ? (
                    <MenuItem
                      label="恢复问题"
                      icon={<Icon icon={RefreshFilled} />}
                      onClick={() => void run(problem, () => problemService.restore(problem))}
                    />
                  ) : (
                    <>
                      <MenuItem
                        label="复制链接"
                        icon={<Icon icon={CopyFilled} />}
                        onClick={() =>
                          void navigator.clipboard
                            .writeText(`${window.location.origin}/${workspaceSlug}/problems/?problem=${problem.id}`)
                            .catch(() => setActionError("无法复制链接，请从详情复制浏览器地址。"))
                        }
                      />
                      {problem.status === "closed" ? (
                        <MenuItem
                          label="重新打开"
                          icon={<Icon icon={PlayFilled} />}
                          onClick={() => void run(problem, () => problemService.update(problem, { status: "open" }))}
                        />
                      ) : (
                        <>
                          <MenuItem
                            label={problem.status === "paused" ? "恢复处理" : "暂缓"}
                            icon={<Icon icon={problem.status === "paused" ? PlayFilled : PauseFilled} />}
                            onClick={() =>
                              void run(problem, () =>
                                problemService.update(problem, {
                                  status: problem.status === "paused" ? "open" : "paused",
                                })
                              )
                            }
                          />
                          <MenuItem
                            label="关闭问题"
                            icon={<Icon icon={CheckDoneFilled} />}
                            onClick={() => select(problem.id)}
                          />
                        </>
                      )}
                      <MenuItem
                        label="移至回收站"
                        icon={<Icon icon={ArchiveFilled} />}
                        onClick={() => {
                          if (window.confirm("将此问题移至回收站？之后可以恢复。"))
                            void run(problem, () => problemService.trash(problem));
                        }}
                      />
                    </>
                  )}
                </MenuContent>
              </Menu>
            </div>
          </div>
        ))}
      </div>
      {isLoading && (
        <p className="py-12 text-center text-body-sm-regular text-secondary" role="status">
          正在加载问题…
        </p>
      )}
      {!isLoading && data?.results.length === 0 && (
        <div className="py-16 text-center">
          <h2 className="text-body-md-medium">{view === "trash" ? "回收站为空" : "暂无符合条件的问题"}</h2>
          <p className="mt-2 text-body-sm-regular text-tertiary">
            {view === "trash" ? "移入回收站的问题可在这里恢复。" : "可以新建独立问题，也可以关联项目或任务。"}
          </p>
          {view !== "trash" && (
            <div className="mt-5 flex justify-center">
              <Button
                stretch="auto"
                variant="primary"
                size="md"
                label="新建问题"
                onClick={() => setEditor("new")}
                icon={<Icon icon={AddFilled} />}
              />
            </div>
          )}
        </div>
      )}
      {data && (
        <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 text-body-xs-regular text-tertiary">
          <span aria-live="polite">
            共 {data.total} 条 · 每页 {data.page_size} 条
          </span>
          <div className="flex items-center gap-3">
            <Button
              stretch="auto"
              variant="secondary"
              size="sm"
              label="上一页"
              disabled={data.page <= 1}
              icon={<Icon icon={ChevronLeftFilled} />}
              onClick={() =>
                setParams((old) => {
                  const next = new URLSearchParams(old);
                  next.set("page", String(data.page - 1));
                  return next;
                })
              }
            />
            <span>第 {data.page} 页</span>
            <Button
              stretch="auto"
              variant="secondary"
              size="sm"
              label="下一页"
              disabled={data.page * data.page_size >= data.total}
              icon={<Icon icon={ChevronRightFilled} />}
              iconPosition="end"
              onClick={() =>
                setParams((old) => {
                  const next = new URLSearchParams(old);
                  next.set("page", String(data.page + 1));
                  return next;
                })
              }
            />
          </div>
        </footer>
      )}
      {selectedId && !editor && (
        <ProblemDetail
          key={selectedId}
          id={selectedId}
          deleted={view === "trash"}
          workspaceSlug={workspaceSlug}
          workspaceId={workspaceId}
          onClose={() => select(null)}
          onEdit={setEditor}
          onChanged={refresh}
        />
      )}
      {editor && (
        <ProblemEditor
          key={editor === "new" ? "new" : `${editor.id}:${editor.revision}`}
          initial={editor === "new" ? null : editor}
          workspaceSlug={workspaceSlug}
          workspaceId={workspaceId}
          onClose={() => setEditor(null)}
          onSaved={async (problem) => {
            setEditor(null);
            await refresh();
            select(problem.id);
          }}
        />
      )}
    </div>
  );
}

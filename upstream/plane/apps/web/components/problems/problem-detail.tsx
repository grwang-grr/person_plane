import { useState } from "react";
import useSWR from "swr";
import { Link } from "react-router";
import { Button } from "@makeplane/propel/components/button";
import {
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderActions,
  DrawerHeaderContent,
  DrawerHeaderStart,
  DrawerPanel,
  DrawerTitle,
} from "@makeplane/propel/components/drawer";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import {
  ArchiveFilled,
  AttachFilled,
  CheckDoneFilled,
  CopyFilled,
  EditFilled,
  PauseFilled,
  PlayFilled,
  RefreshFilled,
  VerifiedFilled,
  X,
} from "@makeplane/propel/icons";
import {
  problemError,
  problemKind,
  problemPriority,
  problemService,
  problemSeverity,
  problemStatus,
} from "@/services/problem.service";
import type { PersonalProblem } from "@/services/problem.service";
import { controlClass, ProblemDescription, useProblemDraftGuard } from "./problem-editor";
import {
  ProblemKindBadge,
  ProblemKindSelect,
  ProblemOverdueBadge,
  ProblemPrioritySelect,
  ProblemSeveritySelect,
  ProblemStatusFlow,
  ProblemStatusSelect,
} from "./problem-meta";

export const problemDate = (value: string | null) =>
  value ? new Date(value).toLocaleString("zh-CN", { hour12: false }) : "未设置";
const fieldLabels: Record<string, string> = {
  title: "标题",
  description_html: "问题说明",
  project_id: "关联项目",
  task_id: "关联任务",
  severity: "严重程度",
  priority: "优先级",
  status: "状态",
  kind: "类型",
  due_date: "预计解决日期",
  resolution: "处理结果",
  labels: "标签",
};
const enums: Record<string, Record<string, string>> = {
  severity: problemSeverity,
  priority: problemPriority,
  status: problemStatus,
  kind: problemKind,
};
function changeSummary(field: string, values: [unknown, unknown]) {
  if (enums[field])
    return `${fieldLabels[field]}：${enums[field][String(values[0])] ?? "未设置"} → ${enums[field][String(values[1])] ?? "未设置"}`;
  return `${fieldLabels[field] ?? "属性"}已更新`;
}

export function ProblemDetail({
  id,
  deleted,
  workspaceSlug,
  workspaceId,
  onClose,
  onEdit,
  onChanged,
}: {
  id: string;
  deleted: boolean;
  workspaceSlug: string;
  workspaceId: string;
  onClose: () => void;
  onEdit: (problem: PersonalProblem) => void;
  onChanged: () => Promise<void>;
}) {
  const {
    data: problem,
    error: loadError,
    mutate,
  } = useSWR(["problem-detail", id, deleted], () => problemService.detail(id, deleted));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [note, setNote] = useState("");
  const [closing, setClosing] = useState(false);
  const [resolution, setResolution] = useState("");
  const dirty = !!note.trim() || (closing && !!resolution.trim());
  useProblemDraftGuard(dirty && !busy);
  const act = async (operation: () => Promise<PersonalProblem | void>, close = false): Promise<boolean> => {
    setBusy(true);
    setError("");
    try {
      const result = await operation();
      if (result) await mutate(result, false);
      await onChanged();
      if (close) onClose();
      return true;
    } catch (e) {
      setError(problemError(e));
      return false;
    } finally {
      setBusy(false);
    }
  };
  // 状态、严重程度、优先级、类型都可以直接在详情里改，不需要进入编辑表单。
  const changeStatus = (status: PersonalProblem["status"]) => {
    if (problem) void act(() => problemService.update(problem, { status }));
  };
  const changeSeverity = (severity: PersonalProblem["severity"]) => {
    if (problem) void act(() => problemService.update(problem, { severity }));
  };
  const changePriority = (priority: PersonalProblem["priority"]) => {
    if (problem) void act(() => problemService.update(problem, { priority }));
  };
  const changeKind = (kind: PersonalProblem["kind"]) => {
    if (problem) void act(() => problemService.update(problem, { kind }));
  };
  const close = () => {
    if (!dirty || window.confirm("放弃未保存的处理记录吗？")) onClose();
  };
  const copyLink = () => {
    const url = `${window.location.origin}/${workspaceSlug}/problems/?problem=${problem?.id ?? id}`;
    void navigator.clipboard
      .writeText(url)
      .then(() => setNotice("链接已复制。"))
      .catch(() => setError("无法复制链接，请复制浏览器地址。"));
  };
  return (
    <Drawer
      open
      modal
      swipeDirection="right"
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DrawerPanel variant="overlay" side="end" size="lg" backdrop>
        <DrawerHeader>
          <DrawerHeaderStart>
            {problem && <ProblemKindBadge kind={problem.kind} />}
            <DrawerHeaderContent>
              <DrawerTitle>{problem?.number ?? "问题详情"}</DrawerTitle>
            </DrawerHeaderContent>
          </DrawerHeaderStart>
          <DrawerHeaderActions side="end">
            {problem && !deleted && (
              <IconButton
                variant="ghost"
                size="sm"
                aria-label="编辑问题"
                disabled={busy}
                onClick={() => {
                  if (!dirty || window.confirm("放弃未保存的处理记录并编辑问题吗？")) onEdit(problem);
                }}
                icon={<Icon icon={EditFilled} />}
              />
            )}
            {problem && (
              <IconButton
                variant="ghost"
                size="sm"
                aria-label="复制链接"
                onClick={copyLink}
                icon={<Icon icon={CopyFilled} />}
              />
            )}
            <IconButton variant="ghost" size="sm" aria-label="关闭详情" disabled={busy} onClick={close} icon={<Icon icon={X} />} />
          </DrawerHeaderActions>
        </DrawerHeader>
        <DrawerBody render={<div className="vertical-scrollbar scrollbar-sm" />}>
          <div className="mx-auto max-w-3xl space-y-6">
            {loadError && (
              <div role="alert" className="space-y-3">
                <p className="text-danger-primary text-body-sm-regular">{problemError(loadError)}</p>
                <Button
                  stretch="auto"
                  variant="secondary"
                  size="sm"
                  label="重新加载"
                  onClick={() => void mutate()}
                  icon={<Icon icon={RefreshFilled} />}
                />
              </div>
            )}
            {!problem && !loadError && (
              <p role="status" className="text-body-sm-regular text-tertiary">
                正在加载问题…
              </p>
            )}
            {problem && (
              <>
                <div className="space-y-3">
                  <h2 className="text-h5-semibold break-words text-primary">{problem.title}</h2>
                  <ProblemStatusFlow status={problem.status} />
                </div>
                <dl className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-x-3 gap-y-2.5 text-body-sm-regular">
                  <dt className="text-tertiary">状态</dt>
                  <dd className="flex flex-wrap items-center gap-2">
                    <ProblemStatusSelect status={problem.status} disabled={busy || deleted} onChange={changeStatus} />
                    {problem.deleted_at && <span className="text-secondary text-body-xs-regular">已在回收站</span>}
                  </dd>
                  <dt className="text-tertiary">严重程度</dt>
                  <dd>
                    <ProblemSeveritySelect
                      severity={problem.severity}
                      disabled={busy || deleted}
                      onChange={changeSeverity}
                    />
                  </dd>
                  <dt className="text-tertiary">优先级</dt>
                  <dd>
                    <ProblemPrioritySelect
                      priority={problem.priority}
                      disabled={busy || deleted}
                      onChange={changePriority}
                    />
                  </dd>
                  <dt className="text-tertiary">类型</dt>
                  <dd>
                    <ProblemKindSelect kind={problem.kind} disabled={busy || deleted} onChange={changeKind} />
                  </dd>
                  <dt className="text-tertiary">关联项目</dt>
                  <dd>
                    {problem.project ? (
                      <>
                        <Link
                          className="text-accent-primary"
                          to={`/${workspaceSlug}/projects/${problem.project.id}/issues/`}
                        >
                          {problem.project.name}
                        </Link>
                        {problem.project.deleted ? "（已删除）" : problem.project.archived ? "（已归档）" : ""}
                      </>
                    ) : (
                      "未关联"
                    )}
                  </dd>
                  <dt className="text-tertiary">关联任务</dt>
                  <dd className="break-words">
                    {problem.task ? (
                      <>
                        <Link
                          className="text-accent-primary"
                          to={`/${workspaceSlug}/browse/${encodeURIComponent(problem.task.number)}/`}
                        >
                          {problem.task.number} · {problem.task.name}
                        </Link>
                        {problem.task.deleted ? "（已删除）" : problem.task.archived ? "（已归档）" : ""}
                      </>
                    ) : (
                      "未关联"
                    )}
                  </dd>
                  <dt className="text-tertiary">预计解决</dt>
                  <dd className="flex flex-wrap items-center gap-2">
                    {problem.due_date ?? "未设置"}
                    {problem.overdue && <ProblemOverdueBadge />}
                  </dd>
                  <dt className="text-tertiary">标签</dt>
                  <dd>{problem.labels.join("、") || "未设置"}</dd>
                  <dt className="text-tertiary">创建时间</dt>
                  <dd>{problemDate(problem.created_at)}</dd>
                  <dt className="text-tertiary">更新时间</dt>
                  <dd>{problemDate(problem.updated_at)}</dd>
                  {problem.closed_at && (
                    <>
                      <dt className="text-tertiary">关闭时间</dt>
                      <dd>{problemDate(problem.closed_at)}</dd>
                    </>
                  )}
                </dl>
                <section className="space-y-2">
                  <h3 className="text-body-md-medium text-primary">问题说明</h3>
                  {problem.description_html ? (
                    <ProblemDescription
                      id={`problem-read-${id}-${problem.revision}`}
                      html={problem.description_html}
                      workspaceSlug={workspaceSlug}
                      workspaceId={workspaceId}
                    />
                  ) : (
                    <p className="text-body-sm-regular text-tertiary">暂无说明</p>
                  )}
                </section>
                {problem.resolution && (
                  <section className="space-y-2">
                    <h3 className="text-body-md-medium">处理结果</h3>
                    <p className="text-body-sm-regular break-words whitespace-pre-wrap">{problem.resolution}</p>
                  </section>
                )}
                {!deleted && (
                  <div className="flex flex-wrap gap-2">
                    {problem.status === "closed" ? (
                      <Button
                        stretch="auto"
                        variant="secondary"
                        size="sm"
                        label="重新打开"
                        disabled={busy}
                        onClick={() => changeStatus("open")}
                        icon={<Icon icon={RefreshFilled} />}
                      />
                    ) : (
                      <>
                        <Button
                          stretch="auto"
                          variant="secondary"
                          size="sm"
                          label={
                            problem.status === "progress"
                              ? "提交验证"
                              : problem.status === "paused"
                                ? "恢复处理"
                                : "开始处理"
                          }
                          disabled={busy}
                          onClick={() =>
                            changeStatus(
                              problem.status === "progress" ? "verify" : problem.status === "paused" ? "open" : "progress"
                            )
                          }
                          icon={<Icon icon={problem.status === "progress" ? VerifiedFilled : PlayFilled} />}
                        />
                        {problem.status !== "paused" && (
                          <Button
                            stretch="auto"
                            variant="secondary"
                            size="sm"
                            label="暂缓"
                            disabled={busy}
                            onClick={() => changeStatus("paused")}
                            icon={<Icon icon={PauseFilled} />}
                          />
                        )}
                        <Button
                          stretch="auto"
                          variant="primary"
                          size="sm"
                          label="关闭问题"
                          disabled={busy}
                          onClick={() => {
                            setClosing(true);
                            setResolution(problem.resolution);
                          }}
                          icon={<Icon icon={CheckDoneFilled} />}
                        />
                      </>
                    )}
                    <Button
                      stretch="auto"
                      variant="ghost"
                      size="sm"
                      label="移至回收站"
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm("将此问题移至回收站？之后可以恢复。"))
                          void act(() => problemService.trash(problem), true);
                      }}
                      icon={<Icon icon={ArchiveFilled} />}
                    />
                  </div>
                )}
                {deleted && (
                  <Button
                    stretch="auto"
                    variant="primary"
                    size="md"
                    label="恢复问题"
                    disabled={busy}
                    onClick={() => void act(() => problemService.restore(problem), true)}
                    icon={<Icon icon={RefreshFilled} />}
                  />
                )}
                {closing && (
                  <section className="space-y-3 rounded-sm border border-subtle p-4">
                    <label className="flex flex-col gap-2 text-body-sm-medium">
                      处理结果（必填）
                      <textarea
                        className={controlClass}
                        rows={3}
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        maxLength={20000}
                        placeholder="记录解决办法或关闭原因"
                      />
                    </label>
                    <div className="flex gap-2">
                      <Button
                        stretch="auto"
                        variant="primary"
                        size="sm"
                        label="确认关闭"
                        disabled={busy}
                        onClick={() => {
                          if (!resolution.trim()) {
                            setError("请填写处理结果后再关闭。");
                            return;
                          }
                          void act(() =>
                            problemService.update(problem, { status: "closed", resolution: resolution.trim() })
                          ).then((ok) => {
                            if (ok) {
                              setClosing(false);
                              setResolution("");
                            }
                            return ok;
                          });
                        }}
                        icon={<Icon icon={CheckDoneFilled} />}
                      />
                      <Button
                        stretch="auto"
                        variant="secondary"
                        size="sm"
                        label="取消"
                        disabled={busy}
                        onClick={() => {
                          setClosing(false);
                          setResolution("");
                        }}
                      />
                    </div>
                  </section>
                )}
                {notice && (
                  <p role="status" className="text-success-primary text-body-sm-regular">
                    {notice}
                  </p>
                )}
                {error && (
                  <p role="alert" className="text-danger-primary text-body-sm-regular">
                    {error}
                  </p>
                )}
                <section className="space-y-3">
                  <h3 className="text-body-md-medium">附件</h3>
                  {problem.attachments?.length ? (
                    <ul className="space-y-2">
                      {problem.attachments.map((file) => (
                        <li
                          key={file.id}
                          className="flex items-center justify-between gap-2 rounded-sm border border-subtle px-3 py-2"
                        >
                          <a
                            className="min-w-0 text-body-sm-regular break-all text-accent-primary"
                            href={`/api/personal/problems/${id}/attachments/${file.id}/`}
                          >
                            {file.name} <span className="text-tertiary">（{(file.size / 1024).toFixed(1)} KB）</span>
                          </a>
                          {!deleted && (
                            <IconButton
                              variant="ghost"
                              size="sm"
                              aria-label={`移除附件 ${file.name}`}
                              disabled={busy}
                              onClick={() => {
                                if (window.confirm("移除此附件？文件仍会保留在备份中。"))
                                  void act(() => problemService.removeAttachment(id, file.id));
                              }}
                              icon={<Icon icon={X} />}
                            />
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-body-sm-regular text-tertiary">暂无附件</p>
                  )}
                  {!deleted && (
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm border border-subtle px-3 py-2 text-body-sm-regular hover:bg-layer-1-hover">
                      <AttachFilled className="h-3.5 w-3.5 shrink-0" />
                      {busy ? "正在处理…" : "添加附件"}
                      <input
                        className="sr-only"
                        type="file"
                        multiple
                        disabled={busy}
                        onChange={(event) => {
                          const files = Array.from(event.target.files ?? []);
                          event.target.value = "";
                          void act(async () => {
                            let result: PersonalProblem | undefined;
                            // Sequential uploads keep a single authoritative attachment snapshot.
                            for (const file of files) {
                              // oxlint-disable-next-line no-await-in-loop
                              result = await problemService.upload(id, file);
                            }
                            return result;
                          });
                        }}
                      />
                    </label>
                  )}
                </section>
                <section className="space-y-3">
                  <h3 className="text-body-md-medium">处理记录</h3>
                  {!deleted && (
                    <>
                      <textarea
                        aria-label="补充处理记录"
                        className={controlClass}
                        rows={3}
                        maxLength={20000}
                        placeholder="补充调查进展、尝试或结论…"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                      <Button
                        stretch="auto"
                        variant="secondary"
                        size="sm"
                        label="添加处理记录"
                        disabled={busy || !note.trim()}
                        onClick={() =>
                          void act(() => problemService.addEntry(id, note.trim())).then((ok) => {
                            if (ok) setNote("");
                            return ok;
                          })
                        }
                        icon={<Icon icon={EditFilled} />}
                      />
                    </>
                  )}
                  <ol className="space-y-4">
                    {problem.entries?.map((entry) => (
                      <li key={entry.id} className="border-l-2 border-subtle pl-3">
                        <div className="text-body-xs-regular text-tertiary">{problemDate(entry.created_at)} · 我</div>
                        <p className="mt-1 text-body-sm-regular break-words whitespace-pre-wrap">{entry.text}</p>
                        {Object.entries(entry.changes).map(([key, values]) => (
                          <p key={key} className="mt-1 text-body-xs-regular text-secondary">
                            {changeSummary(key, values)}
                          </p>
                        ))}
                      </li>
                    ))}
                  </ol>
                </section>
              </>
            )}
          </div>
        </DrawerBody>
      </DrawerPanel>
    </Drawer>
  );
}

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@makeplane/propel/components/button";
import type { EditorRefApi } from "@plane/editor";
import { ConfirmDialog } from "@plane/blocks/dialog";
import { setToast } from "@plane/blocks/toast";
import { Icon } from "@makeplane/propel/components/icon";
import { ImageOutline } from "@makeplane/propel/icons";
import { EFileAssetType } from "@plane/types";
import type { TDiary, TDiaryTemplate, TDiaryType } from "@plane/types";
// components
import { RichTextEditor } from "@/components/editor/rich-text";
import { DiaryLinks } from "@/components/diary/diary-links";
// hooks
import { useEditorAsset } from "@/hooks/store/use-editor-asset";
// services
import { diaryService } from "@/services/diary.service";
import { WorkspaceService } from "@/services/workspace.service";
import type { ProblemTask, PersonalProblem } from "@/services/problem.service";

const workspaceService = new WorkspaceService();

const DIARY_TYPE_LABELS: Record<TDiaryType, string> = {
  daily: "普通日记",
  weekly: "周总结",
  monthly: "月总结",
  yearly: "年总结",
};

/** 新建日记的默认信息：保存时才真正落库。 */
export type DiaryDraft = {
  diary_type: TDiaryType;
  diary_date: string;
  period_key: string;
  belongs_month: string;
};

type DiaryEditorProps = {
  workspaceSlug: string;
  workspaceId: string;
  /** 已存在的日记；为空表示新建草稿。 */
  diary: TDiary | null;
  draft?: DiaryDraft | null;
  templates: TDiaryTemplate[];
  diaries: TDiary[];
  projects: Array<{ id: string; label: string }>;
  tasks: ProblemTask[];
  problems: PersonalProblem[];
  onSaved: () => void;
  onDeleted: () => void;
  onClose: () => void;
};

export function DiaryEditor({
  workspaceSlug,
  workspaceId,
  diary,
  draft = null,
  templates,
  diaries,
  projects,
  tasks,
  problems,
  onSaved,
  onDeleted,
  onClose,
}: DiaryEditorProps) {
  const { uploadEditorAsset, duplicateEditorAsset } = useEditorAsset();
  const editorRef = useRef<EditorRefApi>(null);
  const [title, setTitle] = useState(diary?.title ?? "");
  const [html, setHtml] = useState(diary?.description_html ?? "");
  const [diaryDate, setDiaryDate] = useState(diary?.diary_date ?? draft?.diary_date ?? "");
  const [templateId, setTemplateId] = useState(diary?.template ?? "");
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const diaryType: TDiaryType = diary?.diary_type ?? draft?.diary_type ?? "daily";

  useEffect(() => {
    setTitle(diary?.title ?? "");
    setHtml(diary?.description_html ?? "");
    setDiaryDate(diary?.diary_date ?? draft?.diary_date ?? "");
    setTemplateId(diary?.template ?? "");
    setError("");
  }, [diary, draft]);

  const typeTemplates = useMemo(
    () => templates.filter((template) => template.diary_type === diaryType),
    [templates, diaryType]
  );

  const applyTemplate = (nextTemplateId: string) => {
    setTemplateId(nextTemplateId);
    const template = typeTemplates.find((item) => item.id === nextTemplateId);
    // 模板只填充空白内容，避免覆盖已写好的正文。
    if (template && !html.trim()) {
      setHtml(template.description_html ?? "");
      editorRef.current?.setEditorValue(template.description_html ?? "<p></p>");
    }
  };

  const handleSave = async () => {
    setBusy(true);
    setError("");
    try {
      if (diary) {
        await diaryService.updateDiary(workspaceSlug, diary.id, {
          title,
          description_html: html || "<p></p>",
          diary_date: diaryDate,
          template: templateId || null,
        });
      } else if (draft) {
        // 新建：保存时才创建记录，取消/关闭不会留下空日记。
        await diaryService.createDiary(workspaceSlug, {
          diary_date: diaryDate,
          diary_type: draft.diary_type,
          period_key: draft.period_key,
          belongs_month: draft.belongs_month,
          title,
          description_html: html || "<p></p>",
          template: templateId || undefined,
        });
      }
      setToast({ type: "success", title: "已保存", message: "日记已保存。" });
      onSaved();
    } catch (failure) {
      const data = (failure as { response?: { data?: Record<string, unknown> } })?.response?.data;
      const firstError = data && typeof data === "object" ? Object.values(data)[0] : undefined;
      const message =
        typeof firstError === "string"
          ? firstError
          : Array.isArray(firstError) && typeof firstError[0] === "string"
            ? firstError[0]
            : "保存失败，请重试。";
      setError(message);
      setToast({ type: "error", title: "保存失败", message });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!diary) return;
    setDeleting(true);
    setError("");
    try {
      await diaryService.deleteDiary(workspaceSlug, diary.id);
      setConfirmingDelete(false);
      setToast({ type: "success", title: "已删除", message: "日记已删除。" });
      onDeleted();
    } catch {
      setError("删除失败，请重试。");
      setToast({ type: "error", title: "删除失败", message: "请稍后重试。" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-sm bg-layer-2 px-2 py-1 text-body-xs-medium text-secondary">
          {DIARY_TYPE_LABELS[diaryType]}
        </span>
        <label className="flex items-center gap-1 text-body-xs-regular text-secondary">
          所属日期
          <input
            type="date"
            aria-label="所属日期"
            className="h-7 rounded-sm border border-subtle bg-surface-1 px-2 text-body-xs-regular text-primary"
            value={diaryDate}
            onChange={(event) => setDiaryDate(event.target.value)}
          />
        </label>
        <select
          aria-label="选择模板"
          className="h-7 rounded-sm border border-subtle bg-surface-1 px-2 text-body-xs-regular text-primary"
          value={templateId}
          onChange={(event) => applyTemplate(event.target.value)}
        >
          <option value="">不使用模板</option>
          {typeTemplates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
              {template.is_default ? "（默认）" : ""}
            </option>
          ))}
        </select>
        {!diary && <span className="text-body-xs-regular text-tertiary">未保存的草稿</span>}
      </div>

      <input
        aria-label="日记标题"
        placeholder="日记标题"
        className="h-8 w-full rounded-sm border border-subtle bg-surface-1 px-2 text-body-sm-medium text-primary outline-none focus:border-accent-primary"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />

      {/* 与项目概览一致的编辑工具栏 */}
      <div className="flex flex-wrap items-center gap-1 rounded-md border border-subtle bg-layer-1 p-1">
        <select
          aria-label="标题层级"
          defaultValue="text"
          onChange={(event) => {
            editorRef.current?.createSelectionAtCursorPosition();
            editorRef.current?.executeMenuItemCommand({
              itemKey: event.target.value as "text" | "h1" | "h2" | "h3",
            });
          }}
          className="rounded-sm bg-transparent px-2 py-1 text-body-xs-regular text-primary outline-none"
        >
          <option value="text">正文</option>
          <option value="h1">一级标题</option>
          <option value="h2">二级标题</option>
          <option value="h3">三级标题</option>
        </select>
        <span className="mx-1 h-4 w-px bg-subtle-1" />
        {(
          [
            ["bold", "B"],
            ["italic", "I"],
            ["underline", "U"],
            ["strikethrough", "S"],
          ] as const
        ).map(([command, label]) => (
          <button
            key={command}
            type="button"
            title={command}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => editorRef.current?.executeMenuItemCommand({ itemKey: command })}
            className={`min-w-7 rounded-sm px-1.5 py-1 text-body-xs-medium text-secondary hover:bg-layer-2 hover:text-primary ${
              command === "italic" ? "italic" : ""
            } ${command === "underline" ? "underline" : ""} ${command === "strikethrough" ? "line-through" : ""}`}
          >
            {label}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-subtle-1" />
        {(
          [
            ["bulleted-list", "列表"],
            ["numbered-list", "编号"],
            ["quote", "引用"],
            ["code", "代码"],
          ] as const
        ).map(([command, label]) => (
          <button
            key={command}
            type="button"
            title={label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => editorRef.current?.executeMenuItemCommand({ itemKey: command })}
            className="rounded-sm px-2 py-1 text-body-xs-regular text-secondary hover:bg-layer-2 hover:text-primary"
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          title="插入图片（也可直接粘贴或拖拽）"
          aria-label="插入图片"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            editorRef.current?.createSelectionAtCursorPosition();
            editorRef.current?.executeMenuItemCommand({ itemKey: "image", savedSelection: null });
          }}
          className="flex size-7 items-center justify-center rounded-sm text-secondary transition-colors hover:bg-layer-2 hover:text-primary"
        >
          <Icon icon={ImageOutline} />
        </button>
      </div>

      <RichTextEditor
        key={`diary-${diary?.id ?? draft?.diary_date ?? "new"}-${diary?.updated_at ?? ""}`}
        ref={editorRef}
        bubbleMenuEnabled={false}
        id={`diary-${diary?.id ?? "new"}`}
        initialValue={html || "<p></p>"}
        containerClassName="min-h-64 rounded-md border border-subtle bg-layer-1 p-3"
        workspaceSlug={workspaceSlug}
        workspaceId={workspaceId}
        disabledExtensions={["issue-embed", "collaboration-cursor"] as ("issue-embed" | "collaboration-cursor")[]}
        editable
        placeholder="记录今天发生了什么、想法与感受"
        searchMentionCallback={async (payload) => await workspaceService.searchEntity(workspaceSlug, payload)}
        uploadFile={async (blockId, file) => {
          // 草稿先借用日记日期作为临时实体标识，保存后附件仍归属该日记。
          const { asset_id } = await uploadEditorAsset({
            blockId,
            data: {
              entity_identifier: diary?.id ?? `${draft?.diary_type ?? "daily"}-${draft?.diary_date ?? diaryDate}`,
              entity_type: EFileAssetType.DIARY_DESCRIPTION,
            },
            file,
            workspaceSlug,
          });
          return asset_id;
        }}
        duplicateFile={async (assetId) => {
          const { asset_id } = await duplicateEditorAsset({
            assetId,
            entityId: diary?.id ?? `${draft?.diary_type ?? "daily"}-${draft?.diary_date ?? diaryDate}`,
            entityType: EFileAssetType.DIARY_DESCRIPTION,
            workspaceSlug,
          });
          return asset_id;
        }}
        onChange={(_json, next) => setHtml(next === "<p></p>" ? "" : next)}
      />

      {diary ? (
        <DiaryLinks
          workspaceSlug={workspaceSlug}
          diaryId={diary.id}
          diaries={diaries}
          projects={projects}
          tasks={tasks}
          problems={problems}
        />
      ) : (
        <p className="rounded-md border border-dashed border-subtle bg-layer-1 px-3 py-2 text-body-xs-regular text-tertiary">
          保存后可以添加同类日记、任务、项目、问题等关联。
        </p>
      )}

      {error && (
        <p role="alert" className="text-body-sm-regular text-red-600">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button
          variant="primary"
          size="md"
          stretch="auto"
          label={busy ? "保存中…" : diary ? "保存" : "保存并创建"}
          disabled={busy}
          onClick={() => void handleSave()}
        />
        {diary && (
          <Button
            variant="ghost"
            size="md"
            stretch="auto"
            label="删除日记"
            disabled={busy}
            onClick={() => setConfirmingDelete(true)}
          />
        )}
        <Button variant="secondary" size="md" stretch="auto" label={diary ? "关闭" : "取消"} onClick={onClose} />
      </div>

      {diary && (
        <ConfirmDialog
          isOpen={confirmingDelete}
          handleClose={() => setConfirmingDelete(false)}
          handleSubmit={() => void handleDelete()}
          isSubmitting={deleting}
          title="删除日记"
          content={<>确定删除「{diary.title || "（无标题）"}」吗？删除后无法恢复。</>}
          primaryButtonText={{ loading: "删除中…", default: "删除" }}
          secondaryButtonText="取消"
        />
      )}
    </div>
  );
}

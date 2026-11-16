/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@makeplane/propel/components/button";
import type { EditorRefApi } from "@plane/editor";
import { Icon } from "@makeplane/propel/components/icon";
import { CheckDoneFilled, EditFilled, ImageOutline, X } from "@makeplane/propel/icons";
import { EFileAssetType } from "@plane/types";
import { getEditorAssetSrc } from "@plane/utils";
import { useTranslation } from "@plane/i18n";
// components
import { RichTextEditor } from "@/components/editor/rich-text";
import { MARKDOWN_STYLES, parseTableOfContents } from "@/components/markdown/markdown-document";
// hooks
import { useEditorAsset } from "@/hooks/store/use-editor-asset";
import { useProject } from "@/hooks/store/use-project";
// services
import { WorkspaceService } from "@/services/workspace.service";

const workspaceService = new WorkspaceService();

type Props = {
  workspaceSlug: string;
  workspaceId: string;
  projectId: string;
  descriptionHtml: string;
  canEdit: boolean;
};

const toErrorMessage = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(toErrorMessage).filter(Boolean).join("；") || undefined;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return toErrorMessage(record.error ?? record.detail ?? record.message);
  }
  return undefined;
};

const resolveSaveError = (failure: unknown): string => {
  if (failure && typeof failure === "object") {
    const record = failure as Record<string, unknown>;
    const message = toErrorMessage(record.error ?? record.detail ?? record.message ?? record.description_html);
    if (message) return message;
  }
  return failure instanceof Error ? failure.message : "保存失败，请稍后再试";
};

const isLegacyHtml = (value: string) => /^\s*</.test(value);

/**
 * The editor persists images as `<image-component src="assetId">` custom elements.
 * Browsers cannot paint those elements on their own, so the read-only view resolves
 * each asset id back to a real image URL before injecting the HTML.
 */
const normalizeDescriptionHtml = (value: string, workspaceSlug: string, projectId: string): string => {
  if (typeof DOMParser === "undefined" || !value.includes("image-component")) return value;
  const document = new DOMParser().parseFromString(value, "text/html");
  document.querySelectorAll("image-component").forEach((component) => {
    // 上传窗口期保存的内容只带 data-id（没有 src），同样要能回显。
    const assetId =
      component.getAttribute("src") ?? component.getAttribute("data-id") ?? component.getAttribute("id");
    if (!assetId) {
      component.remove();
      return;
    }
    if (/^https?:\/\//.test(assetId) || assetId.startsWith("/")) {
      const direct = document.createElement("img");
      direct.setAttribute("src", assetId);
      direct.setAttribute("alt", component.getAttribute("alt") ?? "项目介绍图片");
      direct.setAttribute("loading", "lazy");
      component.replaceWith(direct);
      return;
    }
    const image = document.createElement("img");
    image.setAttribute("src", getEditorAssetSrc({ assetId, projectId, workspaceSlug }) ?? assetId);
    image.setAttribute("alt", component.getAttribute("alt") ?? "项目介绍图片");
    image.setAttribute("loading", "lazy");
    const width = component.getAttribute("width");
    const height = component.getAttribute("height");
    if (width && width !== "auto") image.setAttribute("width", width.replace("px", ""));
    if (height && height !== "auto") image.setAttribute("height", height.replace("px", ""));
    component.replaceWith(image);
  });
  return document.body.innerHTML;
};

/**
 * Project introduction rendered as a Markdown document with a generated table
 * of contents. Legacy HTML descriptions remain readable until they are saved.
 */
export const ProjectOverviewDescription = observer(function ProjectOverviewDescription(props: Props) {
  const { workspaceSlug, workspaceId, projectId, descriptionHtml, canEdit } = props;
  const { updateProject } = useProject();
  const { uploadEditorAsset, duplicateEditorAsset } = useEditorAsset();
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(descriptionHtml);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorRefApi>(null);
  const tableOfContents = useMemo(() => parseTableOfContents(descriptionHtml), [descriptionHtml]);
  const normalizedHtml = useMemo(
    () => normalizeDescriptionHtml(descriptionHtml, workspaceSlug, projectId),
    [descriptionHtml, workspaceSlug, projectId]
  );

  useEffect(() => {
    setDraft(descriptionHtml);
  }, [descriptionHtml]);

  useEffect(() => {
    if (editing) return;
    const frame = requestAnimationFrame(() => {
      contentRef.current?.querySelectorAll("h1, h2, h3, h4").forEach((heading, index) => {
        heading.setAttribute("id", `overview-heading-${index}`);
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [descriptionHtml, editing]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await updateProject(workspaceSlug, projectId, { description_html: draft });
      setEditing(false);
    } catch (failure) {
      setError(resolveSaveError(failure));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(descriptionHtml);
    setEditing(false);
    setError("");
  };

  const renderDocument = () =>
    isLegacyHtml(descriptionHtml) ? (
      <div className={MARKDOWN_STYLES} dangerouslySetInnerHTML={{ __html: normalizedHtml }} />
    ) : (
      <div className={MARKDOWN_STYLES}>
        <ReactMarkdown>{descriptionHtml}</ReactMarkdown>
      </div>
    );

  if (editing) {
    return (
      <section aria-label="项目介绍">
        <div className="mb-2 flex flex-wrap items-center gap-1 rounded-md border border-subtle bg-layer-1 p-1">
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
          <select
            aria-label="文字颜色"
            defaultValue=""
            onChange={(event) => {
              if (!event.target.value) return;
              editorRef.current?.createSelectionAtCursorPosition();
              editorRef.current?.executeMenuItemCommand({ itemKey: "text-color", color: event.target.value });
              event.target.value = "";
            }}
            className="rounded-sm bg-transparent px-2 py-1 text-body-xs-regular text-primary outline-none"
          >
            <option value="">颜色</option>
            <option value="gray">默认</option>
            <option value="peach">桃色</option>
            <option value="orange">橙色</option>
            <option value="green">绿色</option>
            <option value="dark-blue">蓝色</option>
            <option value="purple">紫色</option>
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
              ["text-align", "left", "左对齐"],
              ["text-align", "center", "居中"],
              ["text-align", "right", "右对齐"],
            ] as const
          ).map(([command, alignment, label]) => (
            <button
              key={alignment}
              type="button"
              title={label}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => editorRef.current?.executeMenuItemCommand({ itemKey: command, alignment })}
              className="rounded-sm px-2 py-1 text-body-xs-regular text-secondary hover:bg-layer-2 hover:text-primary"
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
              ["table", "表格"],
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
          ref={editorRef}
          bubbleMenuEnabled={false}
          id="project-overview-description"
          initialValue={draft || "<p></p>"}
          containerClassName="min-h-72 rounded-md border border-subtle bg-layer-1 p-3"
          workspaceSlug={workspaceSlug}
          workspaceId={workspaceId}
          projectId={projectId}
          disabledExtensions={["issue-embed", "collaboration-cursor"] as ("issue-embed" | "collaboration-cursor")[]}
          editable
          placeholder="写下这个项目要解决什么问题、范围是什么、当前进展如何"
          searchMentionCallback={async (payload) =>
            await workspaceService.searchEntity(workspaceSlug, { ...payload, project_id: projectId })
          }
          uploadFile={async (blockId, file) => {
            const { asset_id } = await uploadEditorAsset({
              blockId,
              data: {
                entity_identifier: projectId,
                entity_type: EFileAssetType.PROJECT_DESCRIPTION,
              },
              file,
              projectId,
              workspaceSlug,
            });
            return asset_id;
          }}
          duplicateFile={async (assetId) => {
            const { asset_id } = await duplicateEditorAsset({
              assetId,
              entityId: projectId,
              entityType: EFileAssetType.PROJECT_DESCRIPTION,
              projectId,
              workspaceSlug,
            });
            return asset_id;
          }}
          onChange={(_json, html) => setDraft(html === "<p></p>" ? "" : html)}
        />
        {error && (
          <p role="alert" className="mt-3 text-body-sm-regular text-danger-primary">
            {error}
          </p>
        )}
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            size="md"
            stretch="auto"
            label={t("cancel")}
            icon={<Icon icon={X} />}
            disabled={saving}
            onClick={handleCancel}
          />
          <Button
            variant="primary"
            size="md"
            stretch="auto"
            label="保存介绍"
            icon={<Icon icon={CheckDoneFilled} />}
            loading={saving}
            onClick={() => void handleSave()}
          />
        </div>
      </section>
    );
  }

  return (
    <section aria-label="项目介绍">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-h6-semibold text-primary">项目介绍</h2>
        {canEdit && (
          <Button
            variant="secondary"
            size="sm"
            stretch="auto"
            label="编辑介绍"
            icon={<Icon icon={EditFilled} />}
            onClick={() => setEditing(true)}
          />
        )}
      </div>
      {descriptionHtml.trim() ? (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div ref={contentRef} className="min-w-0 max-w-3xl">
            {renderDocument()}
          </div>
          {tableOfContents.length > 0 && (
            <aside className="hidden lg:block">
              <nav className="sticky top-6 rounded-lg border border-subtle bg-layer-1 p-4" aria-label="项目介绍目录">
                <p className="mb-3 text-body-xs-medium text-secondary">目录</p>
                <ul className="space-y-1">
                  {tableOfContents.map((item) => (
                    <li key={item.index}>
                      <button
                        type="button"
                        className="block w-full truncate rounded-sm py-1 text-left text-body-xs-regular text-secondary transition-colors hover:bg-layer-1-hover hover:text-primary"
                        style={{ paddingLeft: `${8 + (item.level - 1) * 12}px` }}
                        title={item.text}
                        onClick={() =>
                          document
                            .getElementById(`overview-heading-${item.index}`)
                            ?.scrollIntoView({ behavior: "smooth", block: "start" })
                        }
                      >
                        {item.text}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          )}
        </div>
      ) : (
        <div className="rounded-sm border border-dashed border-subtle-1 bg-layer-1 px-4 py-8 text-center">
          <p className="text-body-sm-regular text-secondary">点击添加项目介绍</p>
          <p className="mt-1 text-body-xs-regular text-tertiary">支持 Markdown：# 标题、**加粗**、- 列表</p>
          {canEdit && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="primary"
                size="md"
                stretch="auto"
                label="撰写介绍"
                icon={<Icon icon={EditFilled} />}
                onClick={() => setEditing(true)}
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
});

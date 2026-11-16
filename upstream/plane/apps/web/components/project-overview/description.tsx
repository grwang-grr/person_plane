/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Button } from "@makeplane/propel/components/button";
import { Icon } from "@makeplane/propel/components/icon";
import { CheckDoneFilled, EditFilled, X } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
// components
import { RichTextEditor } from "@/components/editor/rich-text";
// hooks
import { useProject } from "@/hooks/store/use-project";

type Props = {
  workspaceSlug: string;
  workspaceId: string;
  projectId: string;
  descriptionHtml: string;
  canEdit: boolean;
};

/**
 * The overview page is primarily an introduction, so the project description gets
 * the full-width reading column and stays editable in place: clicking "编辑介绍"
 * swaps the rendered document for the editor instead of sending the author to the
 * project settings modal.
 */
export const ProjectOverviewDescription = observer(function ProjectOverviewDescription(props: Props) {
  const { workspaceSlug, workspaceId, projectId, descriptionHtml, canEdit } = props;
  // store hooks
  const { updateProject } = useProject();
  // plane hooks
  const { t } = useTranslation();
  // states
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(descriptionHtml);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setDraft(descriptionHtml);
  }, [descriptionHtml]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await updateProject(workspaceSlug, projectId, { description_html: draft });
      setEditing(false);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "保存失败，请稍后再试");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(descriptionHtml);
    setEditing(false);
    setError("");
  };

  if (editing) {
    return (
      <section className="rounded-lg border border-subtle bg-surface-1 p-5" aria-label="项目介绍">
        <RichTextEditor
          id="project-overview-description"
          initialValue={draft || "<p></p>"}
          containerClassName="min-h-64 rounded-sm border border-subtle bg-layer-1 p-3"
          workspaceSlug={workspaceSlug}
          workspaceId={workspaceId}
          projectId={projectId}
          disabledExtensions={["image", "issue-embed", "collaboration-cursor"] as ("image" | "issue-embed" | "collaboration-cursor")[]}
          editable
          placeholder="写下这个项目要解决什么问题、范围是什么、当前进展如何"
          searchMentionCallback={async () => ({})}
          uploadFile={async () => {
            throw new Error("请使用附件功能上传文件。");
          }}
          duplicateFile={async () => {
            throw new Error("请使用附件功能上传文件。");
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
    <section className="group/description rounded-lg border border-subtle bg-surface-1 p-6" aria-label="项目介绍">
      <div className="mb-3 flex items-center justify-between gap-3">
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
      {descriptionHtml ? (
        <RichTextEditor
          id="project-overview-description"
          initialValue={descriptionHtml}
          workspaceSlug={workspaceSlug}
          workspaceId={workspaceId}
          projectId={projectId}
          editable={false}
        />
      ) : (
        <div className="rounded-sm border border-dashed border-subtle-1 bg-layer-1 px-4 py-10 text-center">
          <p className="text-body-sm-regular text-secondary">还没有项目介绍。</p>
          <p className="mt-1 text-body-xs-regular text-tertiary">
            用一段话说明这个项目为什么存在、覆盖哪些工作，团队成员一进来就能读懂。
          </p>
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

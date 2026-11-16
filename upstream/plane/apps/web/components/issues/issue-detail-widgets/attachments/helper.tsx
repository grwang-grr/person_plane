/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import { setPromiseToast, setToast } from "@plane/blocks/toast";
import type { TIssueServiceType } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// types
import type { TAttachmentUploadStatus } from "@/store/issue/issue-details/attachment.store";

export type TAttachmentOperations = {
  create: (file: File) => Promise<void>;
  remove: (attachmentId: string) => Promise<void>;
};

export type TAttachmentSnapshot = {
  uploadStatus: TAttachmentUploadStatus[] | undefined;
};

export type TAttachmentHelpers = {
  operations: TAttachmentOperations;
  snapshot: TAttachmentSnapshot;
};

export const useAttachmentOperations = (
  workspaceSlug: string,
  projectId: string,
  issueId: string,
  issueServiceType: TIssueServiceType = EIssueServiceType.ISSUES
): TAttachmentHelpers => {
  const {
    attachment: { createAttachment, removeAttachment, getAttachmentsUploadStatusByIssueId },
  } = useIssueDetail(issueServiceType);

  const attachmentOperations: TAttachmentOperations = useMemo(
    () => ({
      create: async (file) => {
        if (!workspaceSlug || !projectId || !issueId) throw new Error("请填写必填字段");
        const attachmentUploadPromise = createAttachment(workspaceSlug, projectId, issueId, file);
        setPromiseToast(attachmentUploadPromise, {
          loading: "正在上传附件…",
          success: {
            title: "附件已上传",
            message: () => "附件已上传",
          },
          error: {
            title: "附件未上传",
            message: () => "无法上传附件",
          },
        });

        await attachmentUploadPromise;
      },
      remove: async (attachmentId) => {
        try {
          if (!workspaceSlug || !projectId || !issueId) throw new Error("请填写必填字段");
          await removeAttachment(workspaceSlug, projectId, issueId, attachmentId);
          setToast({
            message: "附件已移除",
            type: "success",
            title: "附件已移除",
          });
        } catch (_error) {
          setToast({
            message: "无法移除附件",
            type: "error",
            title: "附件未移除",
          });
        }
      },
    }),
    [workspaceSlug, projectId, issueId, createAttachment, removeAttachment]
  );
  const attachmentsUploadStatus = getAttachmentsUploadStatusByIssueId(issueId);

  return {
    operations: attachmentOperations,
    snapshot: { uploadStatus: attachmentsUploadStatus },
  };
};

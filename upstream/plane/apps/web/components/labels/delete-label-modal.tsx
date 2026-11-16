/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import { setToast } from "@plane/blocks/toast";
import type { IIssueLabel } from "@plane/types";
// ui
import { ConfirmDialog } from "@plane/blocks/dialog";
// hooks
import { useLabel } from "@/hooks/store/use-label";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  data: IIssueLabel | null;
};

export const DeleteLabelModal = observer(function DeleteLabelModal(props: Props) {
  const { isOpen, onClose, data } = props;
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { deleteLabel } = useLabel();
  // states
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const handleClose = () => {
    onClose();
    setIsDeleteLoading(false);
  };

  const handleDeletion = async () => {
    if (!workspaceSlug || !projectId || !data) return;

    setIsDeleteLoading(true);

    try {
      await deleteLabel(workspaceSlug.toString(), projectId.toString(), data.id);
      handleClose();
    } catch (err) {
      setIsDeleteLoading(false);
      const error =
        err && typeof err === "object" && "error" in err && typeof err.error === "string" && err.error
          ? err.error
          : "无法删除标签，请重试。";
      setToast({
        type: "error",
        title: "错误！",
        message: error,
      });
    }
  };

  return (
    <ConfirmDialog
      handleClose={handleClose}
      handleSubmit={handleDeletion}
      isSubmitting={isDeleteLoading}
      isOpen={isOpen}
      title="删除标签"
      content={
        <>
          您确定要删除 <span className="font-medium text-primary">{data?.name}</span>？这将从所有工作项及使用此标签筛选的视图中移除此标签。
        </>
      }
    />
  );
});

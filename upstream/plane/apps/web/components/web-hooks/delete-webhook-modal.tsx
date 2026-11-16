/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { useParams } from "next/navigation";
// ui
import { ConfirmDialog } from "@plane/blocks/dialog";
import { setToast } from "@plane/blocks/toast";
// hooks
import { useWebhook } from "@/hooks/store/use-webhook";
import { useAppRouter } from "@/hooks/use-app-router";

interface IDeleteWebhook {
  isOpen: boolean;
  onClose: () => void;
  /** The webhook to delete; defaults to the one in the route (its detail page). */
  webhookId?: string;
}

export function DeleteWebhookModal(props: IDeleteWebhook) {
  const { isOpen, onClose, webhookId: webhookIdProp } = props;
  // states
  const [isDeleting, setIsDeleting] = useState(false);
  // router
  const router = useAppRouter();
  // store hooks
  const { removeWebhook } = useWebhook();

  const { workspaceSlug, webhookId: webhookIdParam } = useParams();
  const webhookId = webhookIdProp ?? webhookIdParam;

  const handleClose = () => {
    onClose();
  };

  const handleDelete = async () => {
    if (!workspaceSlug || !webhookId) return;
    setIsDeleting(true);
    try {
      await removeWebhook(workspaceSlug.toString(), webhookId.toString());
      handleClose();
      router.replace(`/${workspaceSlug}/settings/webhooks/`);
      setToast({
        type: "success",
        title: "成功！",
        message: "网络钩子已删除。",
      });
    } catch (_error) {
      setToast({
        type: "error",
        title: "错误！",
        message: "无法删除网络钩子，请重试。",
      });
    }
    setIsDeleting(false);
  };

  return (
    <ConfirmDialog
      handleClose={handleClose}
      handleSubmit={handleDelete}
      isSubmitting={isDeleting}
      isOpen={isOpen}
      title="删除网络钩子"
      content={
        <>
          确定删除此网络钩子吗？后续事件将不再发送，此操作无法撤销。
        </>
      }
    />
  );
}

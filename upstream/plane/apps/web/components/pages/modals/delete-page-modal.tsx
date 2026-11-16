/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
// ui
import { useParams } from "next/navigation";
import { setToast } from "@plane/blocks/toast";
import { ConfirmDialog } from "@plane/blocks/dialog";
import { getPageName } from "@plane/utils";
// constants
// plane web hooks
import { useAppRouter } from "@/hooks/use-app-router";
import type { EPageStoreType } from "@/hooks/store";
import { usePageStore } from "@/hooks/store";
// store
import type { TPageInstance } from "@/store/pages/base-page";

type TConfirmPageDeletionProps = {
  isOpen: boolean;
  onClose: () => void;
  page: TPageInstance;
  storeType: EPageStoreType;
};

export const DeletePageModal = observer(function DeletePageModal(props: TConfirmPageDeletionProps) {
  const { isOpen, onClose, page, storeType } = props;
  // states
  const [isDeleting, setIsDeleting] = useState(false);
  // store hooks
  const { removePage } = usePageStore(storeType);

  // derived values
  const { id: pageId, name } = page;

  const handleClose = () => {
    setIsDeleting(false);
    onClose();
  };

  const router = useAppRouter();
  const { pageId: routePageId } = useParams();

  const handleDelete = async () => {
    if (!pageId) return;
    setIsDeleting(true);
    try {
      await removePage({ pageId });
      handleClose();
      setToast({
        type: "success",
        title: "成功！",
        message: "页面已删除。",
      });

      if (routePageId) {
        router.back();
      }
    } catch {
      setToast({
        type: "error",
        title: "错误！",
        message: "无法删除页面，请重试。",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!page || !page.id) return null;

  return (
    <ConfirmDialog
      handleClose={handleClose}
      handleSubmit={handleDelete}
      isSubmitting={isDeleting}
      isOpen={isOpen}
      title="删除页面"
      content={
        <>
          确定删除此页面吗：{" "}
          <span className="font-medium break-words break-all text-primary">{getPageName(name)}</span> ？此页面将永久删除，此操作无法撤销。
        </>
      }
    />
  );
});

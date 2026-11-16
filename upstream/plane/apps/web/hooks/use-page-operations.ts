/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
// plane imports
import { IS_FAVORITE_MENU_OPEN } from "@plane/constants";
import { setToast } from "@plane/blocks/toast";
import { EPageAccess } from "@plane/types";
import { copyUrlToClipboard } from "@plane/utils";
// hooks
import { useCollaborativePageActions } from "@/hooks/use-collaborative-page-actions";
// store types
import type { TPageInstance } from "@/store/pages/base-page";
// local storage
import useLocalStorage from "./use-local-storage";

export type TPageOperations = {
  toggleLock: () => void;
  toggleAccess: () => void;
  toggleFavorite: () => void;
  openInNewTab: () => void;
  copyLink: () => void;
  duplicate: () => void;
  toggleArchive: () => void;
};

type Props = {
  page: TPageInstance;
};

export const usePageOperations = (
  props: Props
): {
  pageOperations: TPageOperations;
} => {
  const { page } = props;
  // derived values
  const {
    access,
    addToFavorites,
    archived_at,
    duplicate,
    is_favorite,
    is_locked,
    getRedirectionLink,
    removePageFromFavorites,
  } = page;
  // collaborative actions
  const { executeCollaborativeAction } = useCollaborativePageActions(props);
  // local storage
  const { setValue: toggleFavoriteMenu, storedValue: isFavoriteMenuOpen } = useLocalStorage<boolean>(
    IS_FAVORITE_MENU_OPEN,
    false
  );
  // page operations
  const pageOperations: TPageOperations = useMemo(() => {
    const pageLink = getRedirectionLink();

    return {
      copyLink: async () => {
        await copyUrlToClipboard(pageLink);
        setToast({
          type: "success",
          title: "链接已复制！",
          message: "页面链接已复制到剪贴板。",
        });
      },
      duplicate: async () => {
        try {
          await duplicate();
          setToast({
            type: "success",
            title: "成功！",
            message: "页面已复制。",
          });
        } catch (_error) {
          setToast({
            type: "error",
            title: "错误！",
            message: "无法复制页面，请稍后重试。",
          });
        }
      },
      move: async () => {},
      openInNewTab: () => window.open(pageLink, "_blank"),
      toggleAccess: async () => {
        const changedPageType = access === EPageAccess.PUBLIC ? "private" : "public";
        try {
          if (access === EPageAccess.PUBLIC)
            await executeCollaborativeAction({ type: "sendMessageToServer", message: "make-private" });
          else await executeCollaborativeAction({ type: "sendMessageToServer", message: "make-public" });
          setToast({
            type: "success",
            title: "成功！",
            message: `页面已设为${changedPageType}，并移至${changedPageType}分区。`,
          });
        } catch (_error) {
          setToast({
            type: "error",
            title: "错误！",
            message: `无法将页面设为${changedPageType}，请重试。`,
          });
        }
      },
      toggleArchive: async () => {
        if (archived_at) {
          try {
            await executeCollaborativeAction({ type: "sendMessageToServer", message: "unarchive" });
            setToast({
              type: "success",
              title: "成功！",
              message: "页面已恢复。",
            });
          } catch (_error) {
            setToast({
              type: "error",
              title: "错误！",
              message: "无法恢复页面，请稍后重试。",
            });
          }
        } else {
          try {
            await executeCollaborativeAction({ type: "sendMessageToServer", message: "archive" });
            setToast({
              type: "success",
              title: "成功！",
              message: "页面已归档。",
            });
          } catch (_error) {
            setToast({
              type: "error",
              title: "错误！",
              message: "无法归档页面，请稍后重试。",
            });
          }
        }
      },
      toggleFavorite: async () => {
        if (is_favorite) {
          try {
            await removePageFromFavorites();
            setToast({
              type: "success",
              title: "成功！",
              message: "页面已取消收藏。",
            });
          } catch (_error) {
            setToast({
              type: "error",
              title: "错误！",
              message: "无法取消收藏页面，请稍后重试。",
            });
          }
        } else {
          try {
            await addToFavorites();
            if (!isFavoriteMenuOpen) toggleFavoriteMenu(true);
            setToast({
              type: "success",
              title: "成功！",
              message: "页面已收藏。",
            });
          } catch (_error) {
            setToast({
              type: "error",
              title: "错误！",
              message: "无法收藏页面，请稍后重试。",
            });
          }
        }
      },
      toggleLock: async () => {
        if (is_locked) {
          try {
            await executeCollaborativeAction({ type: "sendMessageToServer", message: "unlock" });
            setToast({
              type: "success",
              title: "成功！",
              message: "页面已解锁。",
            });
          } catch (_error) {
            setToast({
              type: "error",
              title: "错误！",
              message: "无法解锁页面，请稍后重试。",
            });
          }
        } else {
          try {
            await executeCollaborativeAction({ type: "sendMessageToServer", message: "lock" });
            setToast({
              type: "success",
              title: "成功！",
              message: "页面已锁定。",
            });
          } catch (_error) {
            setToast({
              type: "error",
              title: "错误！",
              message: "无法锁定页面，请稍后重试。",
            });
          }
        }
      },
    };
  }, [
    access,
    addToFavorites,
    archived_at,
    duplicate,
    executeCollaborativeAction,
    getRedirectionLink,
    is_favorite,
    is_locked,
    isFavoriteMenuOpen,
    removePageFromFavorites,
    toggleFavoriteMenu,
  ]);
  return {
    pageOperations,
  };
};

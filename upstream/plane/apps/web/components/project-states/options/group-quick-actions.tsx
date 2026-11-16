/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@makeplane/propel/components/menu";
import { DeleteOutline, EditOutline, MoreHorizontalOutline } from "@makeplane/propel/icons";
// plane imports
import { ConfirmDialog } from "@plane/blocks/dialog";
import { setToast } from "@plane/blocks/toast";
import { useTranslation } from "@plane/i18n";
import type { TStateGroupDef, TStateGroupOperationsCallbacks } from "@plane/types";

type TStateGroupQuickActions = {
  group: TStateGroupDef;
  /** 该分组下还有多少状态，用于决定是否允许删除。 */
  totalStates: number;
  /** 由上层（GroupItem）打开内联编辑表单，菜单本身只负责发起。 */
  onEdit: () => void;
  stateGroupOperationsCallbacks: Pick<TStateGroupOperationsCallbacks, "deleteGroup">;
};

/** 分组列头的「…」菜单：重命名/改色，以及（仅自定义分组）删除。 */
export const StateGroupQuickActions = observer(function StateGroupQuickActions(props: TStateGroupQuickActions) {
  const { group, totalStates, onEdit, stateGroupOperationsCallbacks } = props;
  // plane hooks
  const { t } = useTranslation();
  // states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 内置分组不可删除；分组下还有状态时后端也会拒绝，这里先给出理由。
  const isDeleteDisabled = group.is_builtin || totalStates > 0;
  const deleteDisabledReason = group.is_builtin
    ? "内置分组不可删除。"
    : totalStates > 0
      ? "该分组下还有状态，请先移动到其他分组。"
      : undefined;

  const handleDeleteGroup = async () => {
    if (isDeleteDisabled) return;
    setIsDeleting(true);
    try {
      await stateGroupOperationsCallbacks.deleteGroup(group.id);
    } catch (error) {
      const errorStatus = error as { status?: number; data?: { error?: string } };
      setToast({
        type: "error",
        title: "错误！",
        message: errorStatus?.data?.error ?? "无法删除分组，请重试。",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <>
      <ConfirmDialog
        handleClose={() => setIsDeleteModalOpen(false)}
        handleSubmit={handleDeleteGroup}
        isSubmitting={isDeleting}
        isOpen={isDeleteModalOpen}
        title="删除状态分组"
        content={
          <>
            确定删除此状态分组吗： <span className="font-medium text-primary">{group?.name}</span>？此操作无法撤销。
          </>
        }
      />
      <Menu>
        <MenuTrigger
          render={
            <IconButton
              type="button"
              variant="ghost"
              size="xs"
              aria-label={t("aria_labels.common.more_actions")}
              icon={<Icon icon={MoreHorizontalOutline} />}
            />
          }
        />
        <MenuContent side="bottom" align="end">
          <MenuItem icon={<Icon icon={EditOutline} />} label={t("common.actions.edit")} onClick={onEdit} />
          <MenuSeparator />
          <MenuItem
            variant="danger"
            icon={<Icon icon={DeleteOutline} />}
            label={t("common.actions.delete")}
            description={deleteDisabledReason}
            disabled={isDeleteDisabled}
            onClick={() => setIsDeleteModalOpen(true)}
          />
        </MenuContent>
      </Menu>
    </>
  );
});

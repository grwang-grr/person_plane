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
import { DefaultTabOutline, DeleteOutline, EditOutline, MoreHorizontalOutline } from "@makeplane/propel/icons";
// plane imports
import { ConfirmDialog } from "@plane/blocks/dialog";
import { setToast } from "@plane/blocks/toast";
import { useTranslation } from "@plane/i18n";
import type { IState, TStateOperationsCallbacks } from "@plane/types";

type TStateQuickActions = {
  totalStates: number;
  state: IState;
  onEdit: () => void;
  stateOperationsCallbacks: Pick<TStateOperationsCallbacks, "markStateAsDefault" | "deleteState">;
};

/** The state row's "…" menu: edit, mark as default, and delete behind a confirmation. */
export const StateQuickActions = observer(function StateQuickActions(props: TStateQuickActions) {
  const { totalStates, state, onEdit, stateOperationsCallbacks } = props;
  // plane hooks
  const { t } = useTranslation();
  // states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMarkingAsDefault, setIsMarkingAsDefault] = useState(false);
  // derived values
  const isDeleteDisabled = !!state.default || totalStates === 1;
  const deleteDisabledReason = state.default
    ? "无法删除默认状态。"
    : totalStates === 1
      ? "分组不能为空。"
      : undefined;

  const handleMarkAsDefault = async () => {
    if (state.default || isMarkingAsDefault) return;
    setIsMarkingAsDefault(true);
    try {
      await stateOperationsCallbacks.markStateAsDefault(state.id);
    } catch {
      // a failed update leaves the current default in place
    } finally {
      setIsMarkingAsDefault(false);
    }
  };

  const handleDeleteState = async () => {
    if (isDeleteDisabled) return;
    setIsDeleting(true);
    try {
      await stateOperationsCallbacks.deleteState(state.id);
    } catch (error) {
      const errorStatus = error as { status: number; data: { error: string } };
      setToast({
        type: "error",
        title: "错误！",
        message:
          errorStatus.status === 400
            ? "此状态下还有工作项，请先将其移动到其他状态再删除。"
            : "无法删除状态，请重试。",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <ConfirmDialog
        handleClose={() => setIsDeleteModalOpen(false)}
        handleSubmit={handleDeleteState}
        isSubmitting={isDeleting}
        isOpen={isDeleteModalOpen}
        title="删除状态"
        content={
          <>
            确定删除此状态吗： <span className="font-medium text-primary">{state?.name}</span>？此状态的全部关联数据将永久删除，此操作无法撤销。
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
          {!state.default && (
            <MenuItem
              icon={<Icon icon={DefaultTabOutline} />}
              label={isMarkingAsDefault ? "正在设为默认" : "设为默认"}
              disabled={isMarkingAsDefault}
              onClick={() => void handleMarkAsDefault()}
            />
          )}
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

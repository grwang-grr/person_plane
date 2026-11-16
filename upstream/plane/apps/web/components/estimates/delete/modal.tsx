/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
// ui
import { Button } from "@makeplane/propel/components/button";
import { setToast } from "@plane/blocks/toast";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogHeading,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
// hooks
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useEstimate } from "@/hooks/store/estimates/use-estimate";
import { useProject } from "@/hooks/store/use-project";

type TDeleteEstimateModal = {
  workspaceSlug: string;
  projectId: string;
  estimateId: string | undefined;
  isOpen: boolean;
  handleClose: () => void;
};

export const DeleteEstimateModal = observer(function DeleteEstimateModal(props: TDeleteEstimateModal) {
  // props
  const { workspaceSlug, projectId, estimateId, isOpen, handleClose } = props;
  // hooks
  const { areEstimateEnabledByProjectId, deleteEstimate } = useProjectEstimates();
  const { asJson: estimate } = useEstimate(estimateId);
  const { updateProject } = useProject();
  // states
  const [buttonLoader, setButtonLoader] = useState(false);

  const handleDeleteEstimate = async () => {
    try {
      if (!workspaceSlug || !projectId || !estimateId) return;
      setButtonLoader(true);
      await deleteEstimate(workspaceSlug, projectId, estimateId);
      if (areEstimateEnabledByProjectId(projectId)) {
        await updateProject(workspaceSlug, projectId, { estimate: null });
      }
      setButtonLoader(false);
      setToast({
        type: "success",
        title: "估算已删除",
        message: "估算已从项目中移除。",
      });
      handleClose();
    } catch (_error) {
      setButtonLoader(false);
      setToast({
        type: "error",
        title: "无法创建估算点数",
        message: "无法删除估算，请重试。",
      });
    }
  };

  return (
    <Dialog
      open={isOpen}
      disablePointerDismissal
      onOpenChange={(open, eventDetails) => {
        if (open) return;
        // The legacy modal took no `handleClose`, so Escape was swallowed: only Cancel closed it.
        if (eventDetails.reason === "escape-key") return;
        handleClose();
      }}
    >
      <DialogContent size="md">
        <DialogMain>
          {/* heading */}
          <DialogHeader>
            <DialogHeading>
              <DialogTitle>删除估算体系</DialogTitle>
            </DialogHeading>
          </DialogHeader>

          {/* estimate steps */}
          <DialogBody tabIndex={0}>
            <div className="text-body-sm-regular text-secondary">
              正在删除估算 <span className="font-bold text-primary">{estimate?.name}</span>
              将从所有工作项中永久移除此估算，此操作无法撤销。重新添加估算后需要更新所有工作项。
            </div>
          </DialogBody>
        </DialogMain>

        <DialogActions>
          <Button
            variant="secondary"
            size="md"
            onClick={handleClose}
            disabled={buttonLoader}
            stretch="auto"
            label="取消"
          />
          <Button
            variant="danger"
            size="md"
            onClick={handleDeleteEstimate}
            disabled={buttonLoader}
            stretch="auto"
            label={buttonLoader ? "删除中" : "删除估算"}
          />
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
});

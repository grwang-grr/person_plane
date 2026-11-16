/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
// ui
import { Button } from "@makeplane/propel/components/button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogHeading,
  DialogInfo,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  onDiscard: () => void;
  onConfirm: () => Promise<void>;
};

export function ConfirmIssueDiscard(props: Props) {
  const { isOpen, handleClose, onDiscard, onConfirm } = props;

  const [isLoading, setIsLoading] = useState(false);

  const onClose = () => {
    handleClose();
    setIsLoading(false);
  };

  const handleDeletion = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent size="md">
        <DialogMain>
          <DialogHeader>
            <DialogHeading>
              <DialogTitle>保存此草稿吗？</DialogTitle>
              <DialogDescription>
                可以将此工作项保存到草稿，稍后继续编辑。
              </DialogDescription>
            </DialogHeading>
          </DialogHeader>
        </DialogMain>
        <DialogActions>
          <DialogInfo>
            <Button variant="secondary" size="sm" stretch="auto" onClick={onDiscard} label="放弃" />
          </DialogInfo>
          <Button variant="secondary" size="sm" stretch="auto" onClick={onClose} label="取消" />
          <Button
            variant="primary"
            size="sm"
            stretch="auto"
            onClick={() => void handleDeletion()}
            loading={isLoading}
            label={isLoading ? "保存中" : "保存到草稿"}
          />
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}

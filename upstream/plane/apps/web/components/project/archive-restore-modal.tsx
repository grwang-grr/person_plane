/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
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
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";

type Props = {
  workspaceSlug: string;

  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  archive: boolean;
};

export function ArchiveRestoreProjectModal(props: Props) {
  const { workspaceSlug, projectId, isOpen, onClose, archive } = props;
  // router
  const router = useAppRouter();
  // states
  const [isLoading, setIsLoading] = useState(false);
  // store hooks
  const { getProjectById, archiveProject, restoreProject } = useProject();

  const projectDetails = getProjectById(projectId);
  if (!projectDetails) return null;

  const handleClose = () => {
    setIsLoading(false);
    onClose();
  };

  const handleArchiveProject = async () => {
    setIsLoading(true);
    await archiveProject(workspaceSlug, projectId)
      .then(() => {
        setToast({
          type: "success",
          title: "归档成功",
          message: `${projectDetails.name}已归档`,
        });
        onClose();
        router.push(`/${workspaceSlug}/projects/`);
        return;
      })
      .catch(() =>
        setToast({
          type: "error",
          title: "错误！",
          message: "无法归档项目，请重试。",
        })
      )
      .finally(() => setIsLoading(false));
  };

  const handleRestoreProject = async () => {
    setIsLoading(true);
    await restoreProject(workspaceSlug, projectId)
      .then(() => {
        setToast({
          type: "success",
          title: "恢复成功",
          message: `可在项目列表中找到${projectDetails.name}。`,
        });
        onClose();
        router.push(`/${workspaceSlug}/projects/`);
        return;
      })
      .catch(() =>
        setToast({
          type: "error",
          title: "错误！",
          message: "无法恢复项目，请重试。",
        })
      )
      .finally(() => setIsLoading(false));
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent size="sm">
        <DialogMain>
          <DialogHeader>
            <DialogHeading>
              <DialogTitle>
                {archive ? "归档" : "恢复"} {projectDetails.name}
              </DialogTitle>
            </DialogHeading>
          </DialogHeader>
          <DialogBody>
            <p className="text-body-xs-regular text-secondary">
              {archive
                ? "此项目及其工作项、周期、模块和页面将被归档。工作项不再显示在搜索中，项目管理员可恢复项目。"
                : "恢复后将重新启用项目，并对项目成员可见。确定继续吗？"}
            </p>
          </DialogBody>
        </DialogMain>
        <DialogActions>
          <Button variant="secondary" size="md" stretch="auto" label="取消" onClick={onClose} />
          <Button
            variant="primary"
            size="md"
            stretch="auto"
            label={archive ? (isLoading ? "归档中" : "归档") : isLoading ? "正在恢复" : "恢复"}
            onClick={archive ? handleArchiveProject : handleRestoreProject}
            loading={isLoading}
          />
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}

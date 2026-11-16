/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
import { observer } from "mobx-react";

import { useTheme } from "next-themes";
// plane imports
import { Button } from "@makeplane/propel/components/button";

// assets
import ProjectDarkEmptyState from "@/app/assets/empty-state/project-settings/no-projects-dark.png?url";
import ProjectLightEmptyState from "@/app/assets/empty-state/project-settings/no-projects-light.png?url";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";

function ProjectSettingsPage() {
  // store hooks
  const { resolvedTheme } = useTheme();
  const { toggleCreateProjectModal } = useCommandPalette();
  // derived values
  const resolvedPath = resolvedTheme === "dark" ? ProjectDarkEmptyState : ProjectLightEmptyState;
  return (
    <div className="mx-auto flex h-full max-w-[480px] flex-col items-center justify-center gap-4">
      <img src={resolvedPath} alt="暂无项目" />
      <div className="text-body-md-semibold text-tertiary">暂无项目</div>
      <div className="text-center text-body-xs-regular text-tertiary">
        创建项目后，即可管理项目团队、任务与项目计划。
      </div>
      <div className="flex gap-2">
        <></>
        <Button
          variant="primary"
          size="sm"
          stretch="auto"
          label="创建第一个项目"
          onClick={() => toggleCreateProjectModal(true)}
        />
      </div>
    </div>
  );
}

export default observer(ProjectSettingsPage);

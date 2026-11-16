/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
// components
import { ProjectOverviewDescription } from "./description";
import { ProjectOverviewStatus } from "./status-progress";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useWorkspace } from "@/hooks/store/use-workspace";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

/**
 * The project overview leads with the introduction and closes with a compact
 * completion summary, so the narrative comes first and the numbers stay secondary.
 */
export const ProjectOverviewRoot = observer(function ProjectOverviewRoot(props: Props) {
  const { workspaceSlug, projectId } = props;
  // store hooks
  const { getProjectById } = useProject();
  const { allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  // derived values
  const project = getProjectById(projectId);
  const workspaceId = currentWorkspace?.id ?? "00000000-0000-4000-8000-000000000002";
  const canEdit = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );

  if (!project) return null;

  return (
    <div className="h-full w-full overflow-y-auto bg-surface-1 px-page-x py-6">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <header>
          <h1 className="text-h4-semibold text-primary">{project.name}</h1>
          <p className="mt-1 text-body-sm-regular text-tertiary">
            {project.identifier} · 项目概览由项目介绍和当前完成情况组成
          </p>
        </header>

        <ProjectOverviewDescription
          workspaceSlug={workspaceSlug}
          workspaceId={workspaceId}
          projectId={projectId}
          descriptionHtml={project.description_html ?? ""}
          canEdit={canEdit}
        />

        <ProjectOverviewStatus workspaceSlug={workspaceSlug} projectId={projectId} />
      </div>
    </div>
  );
});

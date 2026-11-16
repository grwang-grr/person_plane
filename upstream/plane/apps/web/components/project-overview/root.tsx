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

  const emoji = project.logo_props?.in_use === "emoji" ? project.logo_props.emoji?.value : undefined;

  return (
    <div className="h-full w-full overflow-y-auto bg-surface-1">
      <div className="mx-auto w-full max-w-5xl pb-12">
        <div className="relative h-40 overflow-hidden rounded-b-2xl bg-gradient-to-br from-accent-primary/25 via-layer-2 to-layer-2">
          {"cover_image_url" in project && project.cover_image_url ? (
            <img src={project.cover_image_url} alt="" className="size-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.28),transparent_55%)]" />
          )}
        </div>
        <div className="px-page-x">
          <div className="-mt-8 flex items-end">
            <div className="grid size-16 place-items-center rounded-xl border border-subtle bg-surface-1 text-3xl shadow-md">
              {emoji || "📘"}
            </div>
          </div>
          <header className="mt-4">
            <h1 className="text-h4-semibold text-primary">{project.name}</h1>
            <p className="mt-1 text-body-xs-regular text-tertiary">
              {project.identifier} · 项目概览由项目介绍和当前完成情况组成
            </p>
          </header>

          <div className="mt-6 rounded-xl border border-subtle bg-surface-1 p-6">
            <ProjectOverviewDescription
              workspaceSlug={workspaceSlug}
              workspaceId={workspaceId}
              projectId={projectId}
              descriptionHtml={project.description_html ?? ""}
              canEdit={canEdit}
            />
          </div>

          <div className="mt-6 rounded-xl border border-subtle bg-surface-1 p-6">
            <ProjectOverviewStatus workspaceSlug={workspaceSlug} projectId={projectId} />
          </div>
        </div>
      </div>
    </div>
  );
});

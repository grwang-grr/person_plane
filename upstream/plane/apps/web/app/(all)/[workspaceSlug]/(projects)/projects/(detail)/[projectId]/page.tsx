/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { PageHead } from "@/components/core/page-title";
import { AppHeader } from "@/components/core/app-header";
import { ProjectOverviewRoot } from "@/components/project-overview";
import { OverviewHeader } from "@/components/project-overview/header";
import { useProject } from "@/hooks/store/use-project";

export default observer(function ProjectOverviewPage() {
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { getProjectById } = useProject();
  // derived values
  const project = getProjectById(projectId?.toString());

  return (
    <>
      <PageHead title={project?.name ? `${project.name} - 概览` : undefined} />
      <AppHeader header={<OverviewHeader />} />
      <ContentWrapper>
        <ProjectOverviewRoot workspaceSlug={workspaceSlug?.toString() ?? ""} projectId={projectId?.toString() ?? ""} />
      </ContentWrapper>
    </>
  );
});

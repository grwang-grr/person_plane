/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ArchiveOutline, CyclesOutline, ModuleOutline, WorkItemsOutline } from "@makeplane/propel/icons";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { EIssuesStoreType } from "@plane/types";
// ui
import { Breadcrumbs } from "@plane/blocks/breadcrumb";
import { Header } from "@plane/blocks/layout";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web imports
import { CommonProjectBreadcrumbs } from "@/components/breadcrumbs/common";
import { useProjectCrumbProps } from "@/components/breadcrumbs/use-project-crumb-props";

type TProps = {
  activeTab: "issues" | "cycles" | "modules";
};

const PROJECT_ARCHIVES_BREADCRUMB_LIST: {
  [key: string]: {
    label: string;
    href: string;
    icon: React.FC<React.SVGAttributes<SVGElement> & { className?: string }>;
  };
} = {
  issues: {
    label: "工作项",
    href: "/issues",
    icon: WorkItemsOutline,
  },
  cycles: {
    label: "周期",
    href: "/cycles",
    icon: CyclesOutline,
  },
  modules: {
    label: "模块",
    href: "/modules",
    icon: ModuleOutline,
  },
};

export const ProjectArchivesHeader = observer(function ProjectArchivesHeader(props: TProps) {
  const { activeTab } = props;
  // router
  const { workspaceSlug, projectId } = useParams();
  const projectCrumb = useProjectCrumbProps(workspaceSlug?.toString(), projectId?.toString());
  // store hooks
  const {
    issues: { getGroupIssueCount },
  } = useIssues(EIssuesStoreType.ARCHIVED);
  const { loader } = useProject();
  // hooks
  const { isMobile } = usePlatformOS();

  const issueCount = getGroupIssueCount(undefined, undefined, false);

  const activeTabBreadcrumbDetail =
    PROJECT_ARCHIVES_BREADCRUMB_LIST[activeTab as keyof typeof PROJECT_ARCHIVES_BREADCRUMB_LIST];

  return (
    <Header>
      <Header.LeftItem>
        <div className="flex items-center gap-2.5">
          <Breadcrumbs isLoading={loader === "init-loader"}>
            <CommonProjectBreadcrumbs
              workspaceSlug={workspaceSlug?.toString()}
              projectId={projectId?.toString()}
              {...projectCrumb}
            />
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/projects/${projectId}/archives/issues`}
                  label="归档"
                  icon={<ArchiveOutline className="h-4 w-4 text-tertiary" />}
                />
              }
            />
            {activeTabBreadcrumbDetail && (
              <Breadcrumbs.Item
                component={
                  <BreadcrumbLink
                    label={activeTabBreadcrumbDetail.label}
                    icon={<activeTabBreadcrumbDetail.icon className="h-4 w-4 text-tertiary" />}
                  />
                }
              />
            )}
          </Breadcrumbs>
          {activeTab === "issues" && issueCount && issueCount > 0 ? (
            <Tooltip
              label={`项目归档中有 ${issueCount} 个${issueCount > 1 ? "工作项" : "工作项"}`}
              layout="stacked"
              side="bottom"
              disabled={isMobile}
            >
              <span className="flex flex-shrink-0 cursor-default items-center justify-center rounded-xl bg-accent-primary/20 px-2.5 py-0.5 text-center text-caption-sm-semibold text-accent-primary">
                {issueCount}
              </span>
            </Tooltip>
          ) : null}
        </div>
      </Header.LeftItem>
    </Header>
  );
});

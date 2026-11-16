/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { setPromiseToast } from "@plane/blocks/toast";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import type { IProject } from "@plane/types";
import { CyclesOutline, IntakeOutline, ModuleOutline, PagesOutline, ViewsOutline } from "@makeplane/propel/icons";
// components
import { SettingsBoxedControlItem } from "@/components/settings/boxed-control-item";
import { SettingsHeading } from "@/components/settings/heading";
// hooks
import { useProject } from "@/hooks/store/use-project";
// plane web imports
import { UpgradeBadge } from "@/components/workspace/upgrade-badge";
// local imports
import { ProjectFeatureToggle } from "./helper";

type Props = {
  workspaceSlug: string;
  projectId: string;
  isAdmin: boolean;
};

const PROJECT_FEATURES_LIST = {
  cycles: {
    key: "cycles",
    property: "cycle_view",
    title: "周期",
    description: "按项目安排工作周期，灵活调整周期时长。",
    icon: <CyclesOutline className="h-5 w-5 flex-shrink-0 rotate-180 text-tertiary" />,
    isPro: false,
    isEnabled: true,
  },
  modules: {
    key: "modules",
    property: "module_view",
    title: "模块",
    description: "将工作划分为独立模块，分别管理负责人和工作项。",
    icon: <ModuleOutline width={20} height={20} className="flex-shrink-0 text-tertiary" />,
    isPro: false,
    isEnabled: true,
  },
  views: {
    key: "views",
    property: "issue_views_view",
    title: "视图",
    description: "保存排序、筛选和显示选项，方便后续使用。",
    icon: <ViewsOutline className="h-5 w-5 flex-shrink-0 text-tertiary" />,
    isPro: false,
    isEnabled: true,
  },
  pages: {
    key: "pages",
    property: "page_view",
    title: "页面",
    description: "自由记录文字和文档。",
    icon: <PagesOutline className="h-5 w-5 flex-shrink-0 text-tertiary" />,
    isPro: false,
    isEnabled: true,
  },
  inbox: {
    key: "intake",
    property: "inbox_view",
    title: "收件箱",
    description: "将工作项加入项目前先进行整理和讨论。",
    icon: <IntakeOutline className="h-5 w-5 flex-shrink-0 text-tertiary" />,
    isPro: false,
    isEnabled: true,
  },
};

export const ProjectFeaturesList = observer(function ProjectFeaturesList(props: Props) {
  const { workspaceSlug, projectId, isAdmin } = props;
  // store hooks
  const { t } = useTranslation();
  const { getProjectById, updateProject } = useProject();
  // derived values
  const currentProjectDetails = getProjectById(projectId);

  const handleSubmit = (_featureKey: string, featureProperty: string) => {
    if (!workspaceSlug || !projectId || !currentProjectDetails) return;

    // making the request to update the project feature
    const settingsPayload = {
      [featureProperty]: !currentProjectDetails?.[featureProperty as keyof IProject],
    };
    const updateProjectPromise = updateProject(workspaceSlug, projectId, settingsPayload);

    setPromiseToast(updateProjectPromise, {
      loading: "正在更新项目功能...",
      success: {
        title: "成功！",
        message: () => "项目功能更新成功。",
      },
      error: {
        title: "错误！",
        message: () => "更新项目功能时出现错误。请重试。",
      },
    });
  };

  return (
    <section className="flex flex-col gap-y-4">
      <SettingsHeading
        title={t("projects_and_issues")}
        description={t("projects_and_issues_description")}
        variant="h5"
      />
      {Object.entries(PROJECT_FEATURES_LIST).map(([featureItemKey, featureItem]) => (
        <SettingsBoxedControlItem
          key={featureItemKey}
          title={
            <span>
              {t("common.actions.enable")} <span className="lowercase">{t(featureItem.key)}</span>
            </span>
          }
          titleAccessory={
            featureItem.isPro ? (
              <Tooltip label="专业版功能">
                <UpgradeBadge className="rounded-sm" />
              </Tooltip>
            ) : undefined
          }
          description={t(`${featureItem.key}_description`)}
          control={
            <ProjectFeatureToggle
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              featureItem={featureItem}
              value={Boolean(currentProjectDetails?.[featureItem.property as keyof IProject])}
              handleSubmit={handleSubmit}
              disabled={!isAdmin}
            />
          }
        />
      ))}
    </section>
  );
});

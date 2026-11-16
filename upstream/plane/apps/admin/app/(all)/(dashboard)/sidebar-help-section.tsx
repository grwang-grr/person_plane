/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
import { observer } from "mobx-react";
import { WEB_BASE_URL } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { ArrowNarrowLeftOutline, NewTabOutline } from "@makeplane/propel/icons";
import { cn } from "@plane/utils";
import { useTheme } from "@/hooks/store";
export const AdminSidebarHelpSection = observer(function AdminSidebarHelpSection() {
  const { t } = useTranslation();
  const { isSidebarCollapsed, toggleSidebar } = useTheme();
  const label = isSidebarCollapsed
    ? t("aria_labels.projects_sidebar.expand_sidebar")
    : t("aria_labels.projects_sidebar.collapse_sidebar");
  const href = WEB_BASE_URL + "/";
  return (
    <div
      className={cn("flex w-full shrink-0 items-center gap-1 border-t border-subtle px-3 py-3", {
        "flex-col": isSidebarCollapsed,
      })}
    >
      {isSidebarCollapsed ? (
        <Tooltip label="返回项目管理" side="right">
          <IconButton
            variant="secondary"
            size="md"
            aria-label="返回项目管理"
            showTooltip={false}
            nativeButton={false}
            render={<a href={href} aria-label="返回项目管理" />}
            icon={<Icon icon={NewTabOutline} />}
          />
        </Tooltip>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          stretch="auto"
          nativeButton={false}
          render={<a href={href} aria-label="返回项目管理" />}
          icon={<Icon icon={NewTabOutline} />}
          label="返回项目管理"
        />
      )}
      <Tooltip label={label} side={isSidebarCollapsed ? "right" : "top"}>
        <IconButton
          type="button"
          variant="ghost"
          size="md"
          aria-label={label}
          aria-expanded={!isSidebarCollapsed}
          aria-controls="admin-sidebar"
          showTooltip={false}
          onClick={() => toggleSidebar(!isSidebarCollapsed)}
          icon={
            <Icon
              icon={
                <ArrowNarrowLeftOutline
                  className={cn("size-4 duration-300 motion-reduce:transition-none", {
                    "rotate-180": isSidebarCollapsed,
                  })}
                />
              }
            />
          }
        />
      </Tooltip>
    </div>
  );
});

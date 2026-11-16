/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router";
import { observer } from "mobx-react";
// plane helpers
import { useOutsideClickDetector } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { PreferencesOutline } from "@makeplane/propel/icons";
import { ScrollArea } from "@makeplane/propel/components/scroll-area";
// components
import { CustomizeNavigationDialog } from "@/components/navigation/customize-navigation-dialog";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import useSize from "@/hooks/use-window-size";
// plane web components
import Link from "next/link";
import { AppSidebarToggleButton } from "./sidebar-toggle-button";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Icon } from "@makeplane/propel/components/icon";

type TSidebarWrapperProps = {
  title: string;
  children: React.ReactNode;
  quickActions?: React.ReactNode;
};

export const SidebarWrapper = observer(function SidebarWrapper(props: TSidebarWrapperProps) {
  const { title, children, quickActions } = props;
  const { workspaceSlug = "personal" } = useParams();
  const { pathname } = useLocation();
  // translation
  const { t } = useTranslation();
  // state
  const [isCustomizeNavDialogOpen, setIsCustomizeNavDialogOpen] = useState(false);
  // store hooks
  const { toggleSidebar, sidebarCollapsed } = useAppTheme();
  const windowSize = useSize();
  // refs
  const ref = useRef<HTMLDivElement>(null);

  useOutsideClickDetector(ref, () => {
    if (sidebarCollapsed === false && window.innerWidth < 768) {
      toggleSidebar();
    }
  });

  useEffect(() => {
    if (windowSize[0] < 768 && !sidebarCollapsed) toggleSidebar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowSize]);

  return (
    <>
      <CustomizeNavigationDialog isOpen={isCustomizeNavDialogOpen} onClose={() => setIsCustomizeNavDialogOpen(false)} />
      <div ref={ref} className="relative flex h-full w-full animate-fade-in flex-col pt-2.5">
        <div className="flex flex-col gap-3 px-3">
          {/* Workspace switcher and settings */}

          <div className="flex items-center justify-between gap-2 px-1">
            <span className="text-body-md-medium text-primary">{title === "Projects" ? "工作" : title}</span>
            <div className="flex items-center gap-2">
              {title === "Projects" && (
                <IconButton
                  size="md"
                  variant="ghost"
                  icon={<Icon icon={PreferencesOutline} />}
                  aria-label={t("customize_navigation")}
                  onClick={() => setIsCustomizeNavDialogOpen(true)}
                />
              )}
              <AppSidebarToggleButton />
            </div>
          </div>
          {/* Quick actions */}
          {quickActions}
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <ScrollArea orientation="vertical" visibility="auto" size="sm">
            <div className="flex min-h-full w-full flex-col gap-3 overflow-x-hidden px-3 pt-3 pb-3">{children}</div>
          </ScrollArea>
        </div>
        {/* Help Section */}
        <div className="flex shrink-0 flex-col gap-1 border-t border-subtle bg-surface-1 p-3">
          <Link
            href={`/${workspaceSlug}/problems`}
            aria-current={pathname.includes("/problems") ? "page" : undefined}
            className={`rounded-sm px-2 py-2 text-body-sm-medium hover:bg-layer-1 hover:text-primary ${pathname.includes("/problems") ? "bg-layer-1 text-primary" : "text-secondary"}`}
          >
            问题
          </Link>
          <Link
            href={`/${workspaceSlug}/data`}
            className="rounded-sm px-2 py-2 text-body-sm-medium text-secondary hover:bg-layer-1 hover:text-primary"
          >
            数据与备份
          </Link>
          {/* TODO: To be checked if we need this */}
          {/* <div className="flex items-center gap-2">
          {!shouldRenderAppRail && <HelpMenu />}
          {!isAppRailEnabled && <AppSidebarToggleButton />}
        </div> */}
        </div>
      </div>
    </>
  );
});

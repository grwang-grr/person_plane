/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Projects } from "@makeplane/propel/icons";
import { AppSidebarItem } from "@/components/sidebar/sidebar-item";

export const AppRailRoot = observer(function AppRailRoot() {
  const { workspaceSlug } = useParams();
  return (
    <nav aria-label="一级导航" className="z-[26] h-full w-[60px] shrink-0 border-r border-subtle bg-canvas px-2 py-3">
      <AppSidebarItem
        item={{
          label: "项目管理",
          icon: <Projects className="size-5" />,
          href: `/${workspaceSlug}/`,
          isActive: true,
          showLabel: true,
        }}
      />
    </nav>
  );
});

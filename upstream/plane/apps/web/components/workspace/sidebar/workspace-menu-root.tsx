/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
import { observer } from "mobx-react";
import Link from "next/link";
import { WorkspaceAvatar } from "@makeplane/propel/components/workspace-avatar";
import { getFileURL } from "@plane/utils";
import { useWorkspace } from "@/hooks/store/use-workspace";

type WorkspaceMenuRootProps = { variant: "sidebar" | "top-navigation" };

export const WorkspaceMenuRoot = observer(function WorkspaceMenuRoot({ variant }: WorkspaceMenuRootProps) {
  const { currentWorkspace } = useWorkspace();
  return (
    <Link href="/personal/" aria-label="个人项目首页" className="flex min-w-0 items-center gap-2 rounded-sm p-1">
      <WorkspaceAvatar size="sm" src={getFileURL(currentWorkspace?.logo_url ?? "")} alt="个人项目" />
      {variant === "top-navigation" && (
        <span className="truncate text-body-sm-medium text-primary">{currentWorkspace?.name ?? "个人项目"}</span>
      )}
    </Link>
  );
});

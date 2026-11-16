/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { ImageOutline, LockOutline, MailOutline, SettingsOutline, WorkspaceOutline } from "@makeplane/propel/icons";
// types
import type { TSidebarMenuItem } from "./types";

export type TCoreSidebarMenuKey = "general" | "email" | "workspace" | "authentication" | "image";

export const coreSidebarMenuLinks: Record<TCoreSidebarMenuKey, TSidebarMenuItem> = {
  general: {
    Icon: SettingsOutline,
    name: "常规设置",
    description: "管理实例的基础配置。",
    href: `/general/`,
  },
  email: {
    Icon: MailOutline,
    name: "邮件服务",
    description: "配置邮件发送服务。",
    href: `/email/`,
  },
  workspace: {
    Icon: WorkspaceOutline,
    name: "企业工作空间",
    description: "管理实例中的企业工作空间。",
    href: `/workspace/`,
  },
  authentication: {
    Icon: LockOutline,
    name: "登录认证",
    description: "配置登录认证方式。",
    href: `/authentication/`,
  },
  image: {
    Icon: ImageOutline,
    name: "图片服务",
    description: "配置第三方图片库。",
    href: `/image/`,
  },
};

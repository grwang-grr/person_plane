/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import Link from "next/link";
// ui
import { Button } from "@makeplane/propel/components/button";
// layouts
import DefaultLayout from "@/layouts/default-layout";

export function NotAWorkspaceMember() {
  return (
    <DefaultLayout>
      <div className="grid h-full place-items-center p-4">
        <div className="space-y-8 text-center">
          <div className="space-y-2">
            <h3 className="text-h6-semibold">没有访问权限！</h3>
            <p className="mx-auto w-1/2 text-body-xs-regular text-secondary">
              你不是此工作空间的成员，请联系管理员获取邀请，或查看待处理邀请。
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              stretch="auto"
              label="查看待处理邀请"
              nativeButton={false}
              render={<Link href="/invitations" />}
            />
            <Button
              variant="primary"
              size="sm"
              stretch="auto"
              label="创建工作空间"
              nativeButton={false}
              render={<Link href="/create-workspace" />}
            />
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}

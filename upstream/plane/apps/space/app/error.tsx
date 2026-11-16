/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
import { Button } from "@makeplane/propel/components/button";
export default function ErrorPage() {
  return (
    <div className="grid h-screen place-items-center bg-surface-1 p-4">
      <div className="space-y-8 text-center">
        <div className="space-y-2">
          <h3 className="text-h6-semibold">页面暂时无法访问</h3>
          <p className="mx-auto text-body-xs-regular text-secondary md:w-1/2">
            请刷新页面后重试，若问题持续，请联系系统管理员。
          </p>
        </div>
        <Button variant="primary" size="md" stretch="auto" label="刷新页面" onClick={() => window.location.reload()} />
      </div>
    </div>
  );
}

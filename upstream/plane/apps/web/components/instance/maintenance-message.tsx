/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export function MaintenanceMessage() {
  return (
    <div className="flex flex-col gap-2.5">
      <h1 className="text-left text-h5-semibold text-primary">项目服务启动异常</h1>
      <span className="text-left text-body-sm-medium text-secondary">
        部分服务可能未能正常启动，请检查容器日志。若问题持续，请联系系统管理员。
      </span>
    </div>
  );
}

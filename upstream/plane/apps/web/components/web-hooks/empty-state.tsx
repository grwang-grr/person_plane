/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
// ui
import { Button } from "@makeplane/propel/components/button";
// assets
import EmptyWebhook from "@/app/assets/empty-state/web-hook.svg?url";

type Props = {
  onClick: () => void;
};

export function WebhooksEmptyState(props: Props) {
  const { onClick } = props;
  return (
    <div
      className={`mx-auto flex w-full items-center justify-center rounded-xs border border-subtle bg-surface-2 px-16 py-10 lg:w-3/4`}
    >
      <div className="flex w-full flex-col items-center text-center">
        <img src={EmptyWebhook} className="w-52 object-cover sm:w-60" alt="empty" />
        <h6 className="mt-6 mb-3 text-h5-semibold sm:mt-8">暂无网络钩子</h6>
        <p className="mb-7 text-tertiary sm:mb-8">创建 webhook 以接收实时更新并自动执行操作。</p>
        <Button variant="primary" size="sm" stretch="auto" label="添加 webhook" onClick={onClick} />
      </div>
    </div>
  );
}

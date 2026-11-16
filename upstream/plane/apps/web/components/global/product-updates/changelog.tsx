/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
import { EmptyStateDetailed } from "@plane/blocks/empty-state";
export function ProductUpdatesChangelog() {
  return (
    <EmptyStateDetailed assetKey="changelog" description="请联系系统管理员了解当前版本的更新内容。" align="center" />
  );
}

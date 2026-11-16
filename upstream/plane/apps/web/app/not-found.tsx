/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import Link from "next/link";
// ui
import { Button } from "@makeplane/propel/components/button";
import { EmptyStateDetailed } from "@plane/blocks/empty-state";
// types
import type { Route } from "./+types/not-found";

export const meta: Route.MetaFunction = () => [
  { title: "404－页面不存在" },
  { name: "robots", content: "noindex, nofollow" },
];

function PageNotFound() {
  return (
    <div className="h-screen w-full overflow-hidden bg-surface-1 p-4">
      <EmptyStateDetailed
        align="center"
        assetKey="error-404"
        assetClassName="size-40"
        title="发生错误。"
        description="找不到此页面，它可能已被删除、重命名或暂时无法访问。"
        customButton={
          <Button
            variant="primary"
            size="lg"
            stretch="auto"
            label="转到主页"
            nativeButton={false}
            render={<Link href="/" />}
          />
        }
      />
    </div>
  );
}

export default PageNotFound;

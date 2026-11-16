/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
import { Button } from "@makeplane/propel/components/button";
import { EmptyStateDetailed } from "@plane/blocks/empty-state";
import DefaultLayout from "@/layouts/default-layout";
interface ProdErrorComponentProps {
  onGoHome: () => void;
  onReload: () => void;
}
export function ProdErrorComponent({ onGoHome, onReload }: ProdErrorComponentProps) {
  return (
    <DefaultLayout>
      <div className="size-full px-6">
        <EmptyStateDetailed
          align="center"
          assetKey="server-error"
          assetClassName="size-40"
          title="页面暂时无法访问"
          description="请刷新页面后重试。若问题持续，请联系系统管理员。"
          customButton={
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button variant="primary" size="lg" stretch="auto" label="重新加载" onClick={onReload} />
              <Button variant="secondary" size="lg" stretch="auto" label="返回首页" onClick={onGoHome} />
            </div>
          }
        />
      </div>
    </DefaultLayout>
  );
}

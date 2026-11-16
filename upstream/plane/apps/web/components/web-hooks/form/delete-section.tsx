/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { Button } from "@makeplane/propel/components/button";
import { Collapsible } from "@makeplane/propel/components/collapsible";

type Props = {
  openDeleteModal: () => void;
};

export function WebhookDeleteSection(props: Props) {
  const { openDeleteModal } = props;
  // states
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full border-t border-subtle">
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        trigger={<span className="text-body-md-regular tracking-tight">危险操作</span>}
      >
        <div className="flex flex-col gap-8">
          <span className="text-body-xs-regular tracking-tight">
            网络钩子删除后无法恢复，后续事件将不再发送。
          </span>
          <div>
            <Button variant="danger" size="md" stretch="auto" label="删除网络钩子" onClick={openDeleteModal} />
          </div>
        </div>
      </Collapsible>
    </div>
  );
}

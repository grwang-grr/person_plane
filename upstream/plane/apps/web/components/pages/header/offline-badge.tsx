/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { Badge } from "@makeplane/propel/components/badge";
import { Icon } from "@makeplane/propel/components/icon";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { WebDisabledOutline } from "@makeplane/propel/icons";
// hooks
import useOnlineStatus from "@/hooks/use-online-status";
// store
import type { TPageInstance } from "@/store/pages/base-page";

type Props = {
  page: TPageInstance;
};

export const PageOfflineBadge = observer(function PageOfflineBadge({ page }: Props) {
  // use online status
  const { isOnline } = useOnlineStatus();

  if (!page.isContentEditable || isOnline) return null;

  return (
    <Tooltip
      label="当前处于离线状态，可以继续编辑，重新连接后会自动同步。"
      layout="stacked"
    >
      <Badge variant="neutral" size="sm" startIcon={<Icon icon={WebDisabledOutline} />} label="离线" />
    </Tooltip>
  );
});

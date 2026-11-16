/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";

import { AcceptanceGroupIcon } from "./acceptance-group-icon";
import { BacklogGroupIcon } from "./backlog-group-icon";
import { CancelledGroupIcon } from "./cancelled-group-icon";
import { CompletedGroupIcon } from "./completed-group-icon";
import type { StateGroup, StateIconSize } from "./helper";
import { getStateGroupColor, getStateIconSize } from "./helper";
import { StartedGroupIcon } from "./started-group-icon";
import type { UnstartedGroupIconProps } from "./unstarted-group-icon";
import { UnstartedGroupIcon } from "./unstarted-group-icon";

export type StateGroupIconProps = {
  className?: string;
  color?: string;
  percentage?: number;
  stateGroup: StateGroup;
  size?: StateIconSize;
};

/** @deprecated Use StateGroupIconProps instead. */
export type IStateGroupIcon = StateGroupIconProps;

const iconComponents: Record<string, React.ComponentType<UnstartedGroupIconProps>> = {
  acceptance: AcceptanceGroupIcon,
  backlog: BacklogGroupIcon,
  cancelled: CancelledGroupIcon,
  completed: CompletedGroupIcon,
  started: StartedGroupIcon,
  unstarted: UnstartedGroupIcon,
};

export function StateGroupIcon({ className = "", color, percentage, stateGroup, size = "sm" }: StateGroupIconProps) {
  // User-defined groups fall back to the plain ring; the group colour is what
  // tells them apart, so an unknown key must never render undefined.
  const StateIconComponent = iconComponents[stateGroup] ?? UnstartedGroupIcon;
  const iconSize = getStateIconSize(size);

  return (
    <StateIconComponent
      height={iconSize}
      width={iconSize}
      color={color ?? getStateGroupColor(stateGroup)}
      className={`shrink-0 ${className}`}
      percentage={percentage}
    />
  );
}

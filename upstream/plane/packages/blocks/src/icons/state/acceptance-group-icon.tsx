/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";

export type AcceptanceGroupIconProps = React.ComponentPropsWithoutRef<"svg"> & {
  // Accepted for interface parity with the other group icons.
  percentage?: number;
};

/**
 * A ring with a tick inside: work has left the build lane and is being checked,
 * which is why it is deliberately not the solid `CompletedGroupIcon`.
 */
export function AcceptanceGroupIcon({
  width = "20",
  height = "20",
  className,
  color = "#8B5CF6",
}: AcceptanceGroupIconProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 16 16" className={className} fill="none">
      <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.5" />
      <path d="M5.5 8.2 7.2 9.9 10.5 6.3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
// constants
import type { IWebhook } from "@plane/types";
import { Switch } from "@makeplane/propel/components/switch";

interface IWebHookToggle {
  control: Control<IWebhook, any>;
}

export function WebhookToggle({ control }: IWebHookToggle) {
  return (
    <div className="flex gap-6">
      <div className="text-body-xs-medium">启用网络钩子</div>
      <Controller
        control={control}
        name="is_active"
        render={({ field: { onChange, value } }) => (
          <Switch size="sm" checked={value} onCheckedChange={onChange} aria-label="启用网络钩子" />
        )}
      />
    </div>
  );
}

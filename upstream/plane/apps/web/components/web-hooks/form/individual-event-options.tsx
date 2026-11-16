/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { CheckboxField } from "@makeplane/propel/components/checkbox-field";
import type { IWebhook } from "@plane/types";

export const INDIVIDUAL_WEBHOOK_OPTIONS: {
  key: keyof IWebhook;
  label: string;
  description: string;
}[] = [
  {
    key: "project",
    label: "项目",
    description: "项目创建、更新或删除",
  },
  {
    key: "cycle",
    label: "周期",
    description: "周期创建、更新或删除",
  },
  {
    key: "issue",
    label: "工作项",
    description: "工作项创建、更新、删除或加入周期、模块",
  },
  {
    key: "module",
    label: "模块",
    description: "模块创建、更新或删除",
  },
  {
    key: "issue_comment",
    label: "工作项评论",
    description: "评论已发布、更新或删除",
  },
];

type Props = {
  control: Control<IWebhook, any>;
};

export function WebhookIndividualEventOptions({ control }: Props) {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-8 px-6 lg:grid-cols-2">
      {INDIVIDUAL_WEBHOOK_OPTIONS.map((option) => (
        <Controller
          key={option.key}
          control={control}
          name={option.key}
          render={({ field: { onChange, value } }) => (
            <CheckboxField
              name={option.key}
              label={option.label}
              size="lg"
              description={option.description}
              stretch="full"
              checked={value === true}
              onCheckedChange={onChange}
            />
          )}
        />
      ))}
    </div>
  );
}

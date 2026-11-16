/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { InputField } from "@makeplane/propel/components/input-field";
import { Popover, PopoverContent, PopoverTrigger } from "@makeplane/propel/components/popover";
import { TextAreaField } from "@makeplane/propel/components/text-area-field";
import { Button } from "@makeplane/propel/components/button";
import { ColorSwatchPicker } from "@plane/blocks/common";
import { useTranslation } from "@plane/i18n";
import { StateGroupIcon } from "@plane/blocks/icons";
import { getStateGroupMeta } from "@plane/constants";
import { useProjectState } from "@/hooks/store/use-project-state";
import type { IState, TStateGroups } from "@plane/types";

type TStateForm = {
  data: Partial<IState>;
  onSubmit: (formData: Partial<IState>) => Promise<{ status: string }>;
  onCancel: () => void;
  buttonDisabled: boolean;
  buttonTitle: string;
};

function PopoverButton({ color, group }: { color?: string; group?: TStateGroups }) {
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-md border border-subtle-1">
      {group ? (
        <StateGroupIcon stateGroup={group} color={color ?? "black"} size="lg" />
      ) : (
        <span className="size-4 rounded-sm transition-colors" style={{ backgroundColor: color ?? "black" }} />
      )}
    </span>
  );
}

export const StateForm = observer(function StateForm(props: TStateForm) {
  const { data, onSubmit, onCancel, buttonDisabled, buttonTitle } = props;
  // plane hooks
  const { t } = useTranslation();
  const { projectStateGroups } = useProjectState();
  // states
  const [formData, setFromData] = useState<Partial<IState>>(() => ({ ...data }));
  const [errors, setErrors] = useState<Partial<Record<keyof IState, string>> | undefined>(undefined);

  const handleFormData = <T extends keyof IState>(key: T, value: IState[T]) => {
    setFromData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const formSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (buttonDisabled) return;

    const name = formData.name?.trim();
    if (!name) {
      setErrors({ name: "名称为必填项" });
      return;
    }

    try {
      const result = await onSubmit({ ...formData, name });
      if (result.status === "already_exists") setErrors({ name: "已存在同名状态" });
    } catch (error) {
      console.log("error", error);
    }
  };

  return (
    <form onSubmit={formSubmit} className="relative rounded-lg border border-subtle bg-layer-2">
      <fieldset disabled={buttonDisabled} className="space-y-3 p-4">
        <div className="flex items-center gap-2.5">
          {/* color */}
          <div className="shrink-0">
            <Popover>
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    className="flex items-center justify-center rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong"
                    aria-label={t("aria_labels.color_picker.open")}
                  >
                    <PopoverButton color={formData?.color} group={formData?.group} />
                  </button>
                }
              />
              <PopoverContent variant="rich" side="bottom" align="start">
                <ColorSwatchPicker value={formData?.color} onChange={(hex) => handleFormData("color", hex)} />
              </PopoverContent>
            </Popover>
          </div>
          {/* title */}
          <div className="min-w-0 flex-1">
            <InputField
              size="lg"
              orientation="vertical"
              id="name"
              type="text"
              name="name"
              aria-label={t("name")}
              placeholder="名称"
              value={formData?.name}
              onChange={(e) => handleFormData("name", e.target.value)}
              maxLength={100}
              error={errors?.name || undefined}
            />
          </div>
        </div>

        {/* description */}
        <TextAreaField
          size="lg"
          resize="none"
          autoResize
          maxRows={8}
          id="description"
          name="description"
          aria-label={t("description")}
          placeholder="为您的成员描述此状态。"
          value={formData?.description ?? ""}
          onChange={(e) => handleFormData("description", e.target.value)}
          error={errors?.description || undefined}
        />

        {/* group — 状态属于哪个分组；分组可自定义（见项目设置里的状态分组） */}
        <div>
          <label htmlFor="state-group" className="mb-1 block text-body-xs-medium text-secondary">
            分组
          </label>
          <select
            id="state-group"
            className="w-full rounded-sm border border-subtle bg-surface-1 px-3 py-2 text-body-sm-regular text-primary"
            value={formData?.group ?? data?.group ?? "backlog"}
            onChange={(e) => handleFormData("group", e.target.value as TStateGroups)}
          >
            {projectStateGroups.map((g) => (
              <option key={g.key} value={g.key}>
                {g.name}
              </option>
            ))}
            {!projectStateGroups.some((g) => g.key === (formData?.group ?? data?.group ?? "backlog")) && (
              <option value={formData?.group ?? data?.group ?? "backlog"}>
                {getStateGroupMeta(formData?.group ?? data?.group ?? "backlog").label}
              </option>
            )}
          </select>
        </div>
      </fieldset>
      <div className="flex items-center justify-end gap-3 border-t border-subtle-1 px-4 py-3">
        <Button
          type="button"
          variant="secondary"
          size="md"
          stretch="auto"
          label="取消"
          disabled={buttonDisabled}
          onClick={onCancel}
        />
        <Button
          type="submit"
          variant="primary"
          size="md"
          stretch="auto"
          label={buttonTitle}
          disabled={buttonDisabled}
        />
      </div>
    </form>
  );
});

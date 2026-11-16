/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { Button } from "@makeplane/propel/components/button";
import { InputField } from "@makeplane/propel/components/input-field";
import { Popover, PopoverContent, PopoverTrigger } from "@makeplane/propel/components/popover";
import { ColorSwatchPicker } from "@plane/blocks/common";
import { StateGroupIcon } from "@plane/blocks/icons";
import { setToast } from "@plane/blocks/toast";
import { useTranslation } from "@plane/i18n";
import type { TStateGroupDef } from "@plane/types";

export type TStateGroupDraft = {
  name: string;
  key: string;
  color: string;
  is_terminal: boolean;
};

type TStateGroupFormErrors = Partial<Record<"name" | "key" | "form", string>>;

const DEFAULT_COLOR = "#8B5CF6";

export function stateGroupDraftToPartial(draft: TStateGroupDraft): TStateGroupDraft {
  return {
    name: draft.name.trim(),
    key: draft.key.trim(),
    color: draft.color,
    is_terminal: draft.is_terminal,
  };
}

const toErrorMessage = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(toErrorMessage).filter(Boolean).join("；") || undefined;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return toErrorMessage(record.error ?? record.detail ?? record.message);
  }
  return undefined;
};

const extractStateGroupErrors = (error: unknown): TStateGroupFormErrors => {
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const name = toErrorMessage(record.name);
    const key = toErrorMessage(record.key);
    return {
      name,
      key,
      form:
        toErrorMessage(record.error ?? record.detail ?? record.message) ??
        (name || key ? undefined : "保存失败，请稍后重试"),
    };
  }
  return { form: "保存失败，请稍后重试" };
};

type TStateGroupForm = {
  initial?: Partial<TStateGroupDef>;
  onSubmit: (formData: TStateGroupDraft) => Promise<unknown>;
  onCancel: () => void;
  buttonTitle: string;
  submitDisabled?: boolean;
  /** 内置分组不允许改 key，仅展示；自定义分组可编辑。 */
  groupKey?: string;
  isKeyEditable?: boolean;
};

export function StateGroupForm(props: TStateGroupForm) {
  const { initial, onSubmit, onCancel, buttonTitle, submitDisabled, groupKey, isKeyEditable = true } = props;
  const { t } = useTranslation();
  const [draft, setDraft] = useState<TStateGroupDraft>({
    name: initial?.name ?? "",
    key: initial?.key ?? "",
    color: initial?.color ?? DEFAULT_COLOR,
    is_terminal: initial?.is_terminal ?? false,
  });
  const [errors, setErrors] = useState<TStateGroupFormErrors>({});
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || submitDisabled) return;
    if (!draft.name.trim()) {
      setErrors({ name: "名称为必填项" });
      return;
    }
    if (isKeyEditable && draft.key && !/^[a-z0-9][a-z0-9_-]{0,31}$/.test(draft.key.trim())) {
      setErrors({ key: "标识只能包含小写字母、数字、连字符和下划线" });
      return;
    }
    setBusy(true);
    try {
      await onSubmit(stateGroupDraftToPartial(draft));
      setErrors({});
    } catch (error) {
      setErrors(extractStateGroupErrors(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-subtle bg-layer-2 p-4">
      <fieldset disabled={busy || submitDisabled} className="space-y-3">
        <div className="flex items-center gap-2.5">
          <Popover>
            <PopoverTrigger
              render={
                <button
                  type="button"
                  className="flex items-center justify-center rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong"
                  aria-label={t("aria_labels.color_picker.open")}
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-md border border-subtle-1">
                    <StateGroupIcon stateGroup={draft.key || "acceptance"} color={draft.color} size="lg" />
                  </span>
                </button>
              }
            />
            <PopoverContent variant="rich" side="bottom" align="start">
              <ColorSwatchPicker
                value={draft.color}
                onChange={(hex) => setDraft((prev) => ({ ...prev, color: hex }))}
              />
            </PopoverContent>
          </Popover>
          <div className="min-w-0 flex-1">
            <InputField
              size="lg"
              orientation="vertical"
              id="state-group-name"
              type="text"
              name="name"
              aria-label={t("name")}
              placeholder="分组名称，例如「验收」"
              value={draft.name}
              onChange={(e) => {
                setDraft((prev) => ({ ...prev, name: e.target.value }));
                setErrors((prev) => ({ ...prev, name: "" }));
              }}
              maxLength={64}
              error={errors.name}
            />
          </div>
        </div>

        {isKeyEditable && (
          <InputField
            size="lg"
            orientation="vertical"
            id="state-group-key"
            type="text"
            name="key"
            aria-label="分组标识"
            placeholder="分组标识（可留空，由系统自动生成）"
            value={draft.key}
            onChange={(e) => {
              setDraft((prev) => ({ ...prev, key: e.target.value }));
              setErrors((prev) => ({ ...prev, key: "" }));
            }}
            maxLength={32}
            error={errors.key}
          />
        )}

        <label className="flex items-center gap-2 text-body-sm-regular text-secondary">
          <input
            type="checkbox"
            checked={draft.is_terminal}
            onChange={(e) => setDraft((prev) => ({ ...prev, is_terminal: e.target.checked }))}
          />
          终态（该分组下的状态视为已完成，参与进度统计）
        </label>
      </fieldset>

      {errors.form && (
        <p role="alert" className="mt-3 text-body-sm-regular text-danger-primary">
          {errors.form}
        </p>
      )}

      <div className="mt-4 flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          size="md"
          stretch="auto"
          label="取消"
          disabled={busy || submitDisabled}
          onClick={onCancel}
        />
        <Button
          type="submit"
          variant="primary"
          size="md"
          stretch="auto"
          label={busy ? "保存中…" : buttonTitle}
          loading={busy}
          disabled={busy || submitDisabled}
        />
      </div>
      {groupKey && <p className="mt-2 text-body-xs-regular text-tertiary">分组标识：{groupKey}</p>}
    </form>
  );
}

type TStateGroupCreate = {
  handleClose: () => void;
  handleCreated: (group: TStateGroupDef) => void;
  createGroupCallback: (data: Partial<TStateGroupDef>) => Promise<TStateGroupDef>;
};

export function StateGroupCreate(props: TStateGroupCreate) {
  const { handleClose, handleCreated, createGroupCallback } = props;

  return (
    <StateGroupForm
      buttonTitle="创建分组"
      onCancel={handleClose}
      onSubmit={async (formData) => {
        const created = await createGroupCallback(formData);
        setToast({ type: "success", title: "已创建", message: "状态分组已创建。" });
        handleCreated(created);
        return created;
      }}
    />
  );
}

type TStateGroupEdit = {
  group: TStateGroupDef;
  handleClose: () => void;
  updateGroupCallback: (groupId: string, data: Partial<TStateGroupDef>) => Promise<TStateGroupDef>;
};

export function StateGroupEdit(props: TStateGroupEdit) {
  const { group, handleClose, updateGroupCallback } = props;

  return (
    <StateGroupForm
      key={group.id}
      initial={group}
      groupKey={group.key}
      isKeyEditable={!group.is_builtin}
      buttonTitle="保存"
      onCancel={handleClose}
      onSubmit={async (formData) => {
        const updated = await updateGroupCallback(group.id, formData);
        setToast({ type: "success", title: "已保存", message: "状态分组已更新。" });
        handleClose();
        return updated;
      }}
    />
  );
}

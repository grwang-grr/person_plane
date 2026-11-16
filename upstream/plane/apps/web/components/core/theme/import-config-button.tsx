/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useRef } from "react";
import { observer } from "mobx-react";
import type { UseFormSetValue } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { setToast } from "@plane/blocks/toast";
import type { IUserTheme } from "@plane/types";

type Props = {
  handleUpdateTheme: (formData: IUserTheme) => Promise<void>;
  setValue: UseFormSetValue<IUserTheme>;
};

export const CustomThemeImportConfigButton = observer(function CustomThemeImportConfigButton(props: Props) {
  const { handleUpdateTheme, setValue } = props;
  // refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  // translation
  const { t } = useTranslation();

  const handleUploadConfig = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const config = JSON.parse(text) as IUserTheme;

      // Validate required fields
      if (!config.primary || !config.background) {
        throw new Error("请填写主题色和背景色");
      }

      // Validate hex color format
      const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!hexPattern.test(config.primary)) {
        throw new Error("主题色的十六进制格式无效");
      }
      if (!hexPattern.test(config.background)) {
        throw new Error("中性色的十六进制格式无效");
      }

      // Validate theme mode
      const themeMode = config.darkPalette ?? false;
      if (typeof themeMode !== "boolean") {
        throw new Error("主题模式必须为布尔值");
      }

      // Apply the configuration to form
      const formData: IUserTheme = {
        theme: "custom",
        primary: config.primary,
        background: config.background,
        darkPalette: themeMode,
      };

      // Update form values
      setValue("primary", formData.primary);
      setValue("background", formData.background);
      setValue("darkPalette", formData.darkPalette);
      setValue("theme", "custom");

      // Apply the theme
      await handleUpdateTheme(formData);

      setToast({
        type: "success",
        title: t("success"),
        message: "主题配置已导入",
      });
    } catch (error) {
      console.error("Failed to upload config:", error);
      setToast({
        type: "error",
        title: t("error"),
        message: error instanceof Error ? error.message : "导入主题配置失败",
      });
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <input ref={fileInputRef} type="file" accept=".json" onChange={handleUploadConfig} className="hidden" />
      <Button
        variant="secondary"
        size="md"
        stretch="auto"
        type="button"
        label="导入配置"
        onClick={() => fileInputRef.current?.click()}
      />
    </>
  );
});

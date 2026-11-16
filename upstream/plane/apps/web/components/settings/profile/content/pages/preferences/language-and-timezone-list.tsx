/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { SelectField } from "@makeplane/propel/components/select-field";
import { SUPPORTED_LANGUAGES, useTranslation } from "@plane/i18n";
import { setToast } from "@plane/blocks/toast";
// components
import { TimezoneSelect } from "@/components/global/timezone-select";
import { StartOfWeekPreference } from "@/components/profile/start-of-week-preference";
import { SettingsControlItem } from "@/components/settings/control-item";
// hooks
import { useUser, useUserProfile } from "@/hooks/store/user";

export const ProfileSettingsLanguageAndTimezonePreferencesList = observer(
  function ProfileSettingsLanguageAndTimezonePreferencesList() {
    // store hooks
    const {
      data: user,
      updateCurrentUser,
      userProfile: { data: profile },
    } = useUser();
    const { updateUserProfile } = useUserProfile();
    // translation
    const { t } = useTranslation();

    const handleTimezoneChange = async (value: string) => {
      try {
        await updateCurrentUser({ user_timezone: value });
        setToast({
          title: "成功！",
          message: "时区更新成功。",
          type: "success",
        });
      } catch (_error) {
        setToast({
          title: "错误！",
          message: "更新时区失败",
          type: "error",
        });
      }
    };

    const handleLanguageChange = async (value: string) => {
      try {
        await updateUserProfile({ language: value });
        setToast({
          title: "成功！",
          message: "语言已更新",
          type: "success",
        });
      } catch (_error) {
        setToast({
          title: "错误！",
          message: "更新语言失败",
          type: "error",
        });
      }
    };

    return (
      <div className="flex flex-col gap-y-1">
        <SettingsControlItem
          title={t("timezone")}
          description={t("timezone_setting")}
          control={
            <TimezoneSelect
              value={user?.user_timezone || "Asia/Kolkata"}
              onChange={handleTimezoneChange}
              label={t("timezone")}
              size="md"
              width="fit"
              className="max-w-64"
            />
          }
        />
        <SettingsControlItem
          title={t("language")}
          description={t("language_setting")}
          control={
            <SelectField<string>
              aria-label={t("language")}
              size="md"
              width="fit"
              options={SUPPORTED_LANGUAGES}
              value={profile?.language ?? null}
              onValueChange={(value) => {
                if (value !== null) void handleLanguageChange(value);
              }}
              placeholder="选择语言"
            />
          }
        />
        <StartOfWeekPreference
          option={{
            title: "每周起始日",
            description: "此设置将影响应用内的所有日历。",
          }}
        />
      </div>
    );
  }
);

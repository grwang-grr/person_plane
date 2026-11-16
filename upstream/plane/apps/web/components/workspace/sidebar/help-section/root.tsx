/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
import { observer } from "mobx-react";
import { HelpOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
import { Menu, MenuContent, MenuFooter, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { IconButton } from "@makeplane/propel/elements/icon-button";
import { PlaneVersionNumber } from "@/components/global/version-number";
import { usePowerK } from "@/hooks/store/use-power-k";

export const HelpMenuRoot = observer(function HelpMenuRoot() {
  const { t } = useTranslation();
  const { toggleShortcutsListModal } = usePowerK();
  return (
    <Menu>
      <Tooltip label={t("power_k.group_titles.help")} side="bottom">
        <MenuTrigger
          render={
            <IconButton
              variant="ghost"
              size="md"
              aria-label={t("power_k.group_titles.help")}
              render={<button type="button" className="data-popup-open:bg-layer-transparent-active" />}
            >
              <HelpOutline className="size-4.5" />
            </IconButton>
          }
        />
      </Tooltip>
      <MenuContent
        side="bottom"
        align="end"
        footer={
          <MenuFooter>
            <PlaneVersionNumber />
          </MenuFooter>
        }
      >
        <MenuItem label={t("keyboard_shortcuts")} onClick={() => toggleShortcutsListModal(true)} />
      </MenuContent>
    </Menu>
  );
});

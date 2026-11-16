/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// icons
import { AddOutline } from "@makeplane/propel/icons";
// plane imports
import { STATE_GROUPS } from "@plane/constants";
import { StateGroupIcon } from "@plane/blocks/icons";
import type { TStateGroups } from "@plane/types";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
// components
import { StateCreate } from "@/components/project-states";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";

/**
 * Trailing board column that lets a personal workspace grow its own status columns: pick the state
 * group, name the state, and it appears as a regular board column once the store refreshes.
 */
export const KanbanAddStateColumn = observer(function KanbanAddStateColumn() {
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { createState } = useProjectState();
  // states
  const [groupKey, setGroupKey] = useState<TStateGroups | null>(null);

  const handleCreate = async (data: Parameters<typeof createState>[2]) => {
    if (!workspaceSlug || !projectId) throw new Error("缺少项目上下文，无法创建状态");
    return createState(workspaceSlug.toString(), projectId.toString(), data);
  };

  return (
    <div className="flex w-[288px] flex-shrink-0 flex-col">
      <div className="rounded-lg border border-dashed border-subtle-1 bg-layer-1 p-2">
        {groupKey ? (
          <StateCreate
            groupKey={groupKey}
            createStateCallback={handleCreate}
            handleClose={() => setGroupKey(null)}
          />
        ) : (
          <Menu>
            <MenuTrigger
              render={
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-sm px-2 py-3 text-body-sm-medium text-secondary transition-colors hover:bg-layer-1-hover hover:text-primary"
                />
              }
            >
              <AddOutline className="size-3.5" />
              新建状态
            </MenuTrigger>
            <MenuContent side="bottom" align="start">
              {Object.values(STATE_GROUPS).map((group) => (
                <MenuItem
                  key={group.key}
                  label={group.label}
                  icon={<StateGroupIcon stateGroup={group.key} color={group.color} size="md" />}
                  onClick={() => setGroupKey(group.key)}
                />
              ))}
            </MenuContent>
          </Menu>
        )}
      </div>
    </div>
  );
});

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState, useRef } from "react";
import { observer } from "mobx-react";

import { Collapsible } from "@makeplane/propel/components/collapsible";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { AddOutline, ChevronDownOutline } from "@makeplane/propel/icons";
// plane imports
import { StateGroupIcon } from "@plane/blocks/icons";
import { EIconSize, getStateGroupMeta } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type {
  IState,
  TStateGroupDef,
  TStateGroupOperationsCallbacks,
  TStateGroups,
  TStateOperationsCallbacks,
} from "@plane/types";
import { cn } from "@plane/utils";
// components
import { StateList, StateCreate, StateGroupEdit, StateGroupQuickActions } from "@/components/project-states";

type TGroupItem = {
  groupKey: TStateGroups;
  /** 分组定义：自定义分组时存在，用其名称与颜色覆盖默认展示。 */
  groupDef?: TStateGroupDef;
  groupsExpanded: Partial<TStateGroups>[];
  groupedStates: Record<string, IState[]>;
  states: IState[];
  stateOperationsCallbacks: TStateOperationsCallbacks;
  stateGroupOperationsCallbacks: TStateGroupOperationsCallbacks;
  isEditable: boolean;
  groupItemClassName?: string;
  stateItemClassName?: string;
  handleGroupCollapse: (groupKey: TStateGroups) => void;
  handleExpand: (groupKey: TStateGroups) => void;
};

export const GroupItem = observer(function GroupItem(props: TGroupItem) {
  const {
    groupKey,
    groupDef,
    groupedStates,
    states,
    groupsExpanded,
    isEditable,
    stateOperationsCallbacks,
    stateGroupOperationsCallbacks,
    groupItemClassName,
    stateItemClassName,
    handleExpand,
    handleGroupCollapse,
  } = props;
  // refs
  const dropElementRef = useRef<HTMLDivElement | null>(null);
  // plane hooks
  const { t } = useTranslation();
  // state
  const [createState, setCreateState] = useState(false);
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  // derived values
  const currentStateExpanded = groupsExpanded.includes(groupKey);
  const shouldShowEmptyState = states.length === 0 && currentStateExpanded && !createState;
  const groupLabel = groupDef?.name || getStateGroupMeta(groupKey).label;

  const isCreateDisabled = !isEditable || createState;

  return (
    <div className={cn("rounded-lg border border-subtle bg-layer-1", groupItemClassName)} ref={dropElementRef}>
      <Collapsible
        open={currentStateExpanded}
        onOpenChange={(open) => (open ? handleExpand(groupKey) : handleGroupCollapse(groupKey))}
        indicator={false}
        icon={
          <Icon
            icon={
              <ChevronDownOutline
                className={cn("size-4 shrink-0 transition-transform", {
                  "rotate-0": currentStateExpanded,
                  "-rotate-90": !currentStateExpanded,
                })}
              />
            }
          />
        }
        trigger={
          <span className="flex w-full items-center gap-1">
            <StateGroupIcon stateGroup={groupKey} color={groupDef?.color} size={EIconSize.LG} className="shrink-0" />
            <span className="text-body-sm-medium text-primary">{groupLabel}</span>
            <span className="text-body-xs-regular text-tertiary">· {states.length}</span>
          </span>
        }
        trailing={
          <span className="flex items-center gap-0.5">
            {isEditable && groupDef && (
              <StateGroupQuickActions
                group={groupDef}
                totalStates={states.length}
                onEdit={() => setIsEditingGroup(true)}
                stateGroupOperationsCallbacks={stateGroupOperationsCallbacks}
              />
            )}
            <IconButton
              type="button"
              variant="ghost"
              size="sm"
              aria-label={`在「${groupLabel}」中创建状态`}
              disabled={isCreateDisabled}
              onClick={() => {
                if (!createState) {
                  handleExpand(groupKey);
                  setCreateState(true);
                }
              }}
              icon={<Icon icon={AddOutline} />}
            />
          </span>
        }
      >
        {shouldShowEmptyState && (
          <div className="flex h-full flex-col items-center justify-center py-4 text-body-xs-regular text-tertiary">
            <div>{t("project_settings.states.empty_state.title", { groupKey: groupLabel })}</div>
            {isEditable && <div>{t("project_settings.states.empty_state.description")}</div>}
          </div>
        )}

        <div id="group-droppable-container" className="space-y-1.5">
          <StateList
            groupKey={groupKey}
            groupedStates={groupedStates}
            states={states}
            disabled={!isEditable}
            stateOperationsCallbacks={stateOperationsCallbacks}
            stateItemClassName={stateItemClassName}
          />
        </div>
      </Collapsible>

      {/* Rendered outside the collapsible panel (as in legacy) so the create form, and whatever the user typed
          into it, survives collapsing the group — the panel unmounts its children when closed. */}
      {isEditable && createState && (
        <div className="px-3 pb-3">
          <StateCreate
            groupKey={groupKey}
            handleClose={() => setCreateState(false)}
            createStateCallback={stateOperationsCallbacks.createState}
          />
        </div>
      )}
      {isEditable && groupDef && isEditingGroup && (
        <div className="px-3 pb-3">
          <StateGroupEdit
            group={groupDef}
            handleClose={() => setIsEditingGroup(false)}
            updateGroupCallback={stateGroupOperationsCallbacks.updateGroup}
          />
        </div>
      )}
    </div>
  );
});

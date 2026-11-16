/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { Button } from "@makeplane/propel/components/button";
import { AddOutline } from "@makeplane/propel/icons";
import type {
  IState,
  TStateGroupDef,
  TStateGroupOperationsCallbacks,
  TStateGroups,
  TStateOperationsCallbacks,
} from "@plane/types";
import { cn } from "@plane/utils";
// components
import { GroupItem, StateGroupCreate } from "@/components/project-states";

type TGroupList = {
  groupedStates: Record<string, IState[]>;
  stateGroups: TStateGroupDef[];
  stateOperationsCallbacks: TStateOperationsCallbacks;
  stateGroupOperationsCallbacks: TStateGroupOperationsCallbacks;
  isEditable: boolean;
  groupListClassName?: string;
  groupItemClassName?: string;
  stateItemClassName?: string;
};

export const GroupList = observer(function GroupList(props: TGroupList) {
  const {
    groupedStates,
    stateGroups,
    stateOperationsCallbacks,
    stateGroupOperationsCallbacks,
    isEditable,
    groupListClassName,
    groupItemClassName,
    stateItemClassName,
  } = props;
  // states
  const [groupsExpanded, setGroupsExpanded] = useState<Partial<TStateGroups>[]>(() => [
    "backlog",
    "unstarted",
    "started",
    "acceptance",
    "completed",
    "cancelled",
  ]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const handleGroupCollapse = (groupKey: TStateGroups) => {
    setGroupsExpanded((prev) => {
      if (prev.includes(groupKey)) {
        return prev.filter((key) => key !== groupKey);
      }
      return prev;
    });
  };

  const handleExpand = (groupKey: TStateGroups) => {
    setGroupsExpanded((prev) => {
      if (prev.includes(groupKey)) {
        return prev;
      }
      return [...prev, groupKey];
    });
  };

  // 自定义分组创建后默认展开，便于立即往里建状态。
  const handleGroupCreated = (group: TStateGroupDef) => {
    handleExpand(group.key);
    setIsCreatingGroup(false);
  };

  return (
    <div className={cn("space-y-4", groupListClassName)}>
      {Object.entries(groupedStates).map(([key, value]) => {
        const groupKey = key as TStateGroups;
        const groupStates = value;
        return (
          <GroupItem
            key={groupKey}
            groupKey={groupKey}
            groupDef={stateGroups.find((group) => group.key === groupKey)}
            states={groupStates}
            groupedStates={groupedStates}
            groupsExpanded={groupsExpanded}
            stateOperationsCallbacks={stateOperationsCallbacks}
            stateGroupOperationsCallbacks={stateGroupOperationsCallbacks}
            isEditable={isEditable}
            handleGroupCollapse={handleGroupCollapse}
            handleExpand={handleExpand}
            groupItemClassName={groupItemClassName}
            stateItemClassName={stateItemClassName}
          />
        );
      })}

      {/* 自定义分组：仅管理员可见，与内置分组共用同一套状态操作。 */}
      {isEditable && (
        <div>
          {isCreatingGroup ? (
            <StateGroupCreate
              handleClose={() => setIsCreatingGroup(false)}
              handleCreated={handleGroupCreated}
              createGroupCallback={stateGroupOperationsCallbacks.createGroup}
            />
          ) : (
            <Button
              variant="secondary"
              size="md"
              stretch="auto"
              label="新建状态分组"
              icon={<AddOutline className="size-3.5" />}
              iconPosition="start"
              onClick={() => setIsCreatingGroup(true)}
            />
          )}
        </div>
      )}
    </div>
  );
});

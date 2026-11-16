/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// components
import { EUserPermissionsLevel } from "@plane/constants";
import type {
  IState,
  TStateGroupDef,
  TStateGroupOperationsCallbacks,
  TStateOperationsCallbacks,
} from "@plane/types";
import { EUserProjectRoles } from "@plane/types";
import { ProjectStateLoader, GroupList } from "@/components/project-states";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";
import { useUserPermissions } from "@/hooks/store/user";

type TProjectState = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectStateRoot = observer(function ProjectStateRoot(props: TProjectState) {
  const { workspaceSlug, projectId } = props;
  // hooks
  const {
    groupedProjectStates,
    projectStateGroups,
    fetchProjectStates,
    fetchProjectStateGroups,
    createState,
    moveStatePosition,
    updateState,
    deleteState,
    markStateAsDefault,
    createStateGroup,
    updateStateGroup,
    deleteStateGroup,
  } = useProjectState();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const isEditable = allowPermissions(
    [EUserProjectRoles.ADMIN],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );

  // Fetching all project states and their grouping buckets
  useSWR(
    workspaceSlug && projectId ? `PROJECT_STATES_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchProjectStates(workspaceSlug.toString(), projectId.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  useSWR(
    workspaceSlug && projectId ? `PROJECT_STATE_GROUPS_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchProjectStateGroups(workspaceSlug.toString(), projectId.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // State operations callbacks
  const stateOperationsCallbacks: TStateOperationsCallbacks = useMemo(
    () => ({
      createState: async (data: Partial<IState>) => createState(workspaceSlug, projectId, data),
      updateState: async (stateId: string, data: Partial<IState>) =>
        updateState(workspaceSlug, projectId, stateId, data),
      deleteState: async (stateId: string) => deleteState(workspaceSlug, projectId, stateId),
      moveStatePosition: async (stateId: string, data: Partial<IState>) =>
        moveStatePosition(workspaceSlug, projectId, stateId, data),
      markStateAsDefault: async (stateId: string) => markStateAsDefault(workspaceSlug, projectId, stateId),
    }),
    [workspaceSlug, projectId, createState, moveStatePosition, updateState, deleteState, markStateAsDefault]
  );

  // State group (custom bucket) operations callbacks
  const stateGroupOperationsCallbacks: TStateGroupOperationsCallbacks = useMemo(
    () => ({
      createGroup: async (data: Partial<TStateGroupDef>) => createStateGroup(workspaceSlug, projectId, data),
      updateGroup: async (groupId: string, data: Partial<TStateGroupDef>) =>
        updateStateGroup(workspaceSlug, projectId, groupId, data),
      deleteGroup: async (groupId: string) => deleteStateGroup(workspaceSlug, projectId, groupId),
    }),
    [workspaceSlug, projectId, createStateGroup, updateStateGroup, deleteStateGroup]
  );

  // Loader
  if (!groupedProjectStates) return <ProjectStateLoader />;

  return (
    <GroupList
      groupedStates={groupedProjectStates}
      stateGroups={projectStateGroups}
      stateOperationsCallbacks={stateOperationsCallbacks}
      stateGroupOperationsCallbacks={stateGroupOperationsCallbacks}
      isEditable={isEditable}
    />
  );
});

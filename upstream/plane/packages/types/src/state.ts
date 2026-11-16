/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TStateGroupKey = "backlog" | "unstarted" | "started" | "acceptance" | "completed" | "cancelled" | "triage";
/**
 * Grouping buckets are user-defined per project (see `StateGroupDef`), so the
 * built-in keys are only the ones that ship out of the box. `(string & {})`
 * keeps literal autocomplete while still accepting a custom key.
 */
export type TStateGroups = TStateGroupKey | (string & {});

export type TStateGroupDef = {
  id: string;
  project_id: string;
  workspace_id: string;
  key: TStateGroups;
  name: string;
  color: string;
  sequence: number;
  is_builtin: boolean;
  is_terminal: boolean;
};

export interface IState {
  readonly id: string;
  color: string;
  default: boolean;
  description: string;
  group: TStateGroups;
  name: string;
  project_id: string;
  sequence: number;
  workspace_id: string;
  order: number;
}

export interface IStateLite {
  color: string;
  group: TStateGroups;
  id: string;
  name: string;
}

export interface IStateResponse {
  [key: string]: IState[];
}

export type TStateOperationsCallbacks = {
  createState: (data: Partial<IState>) => Promise<IState>;
  updateState: (stateId: string, data: Partial<IState>) => Promise<IState | undefined>;
  deleteState: (stateId: string) => Promise<void>;
  moveStatePosition: (stateId: string, data: Partial<IState>) => Promise<void>;
  markStateAsDefault: (stateId: string) => Promise<void>;
};

// 状态分组（自定义分组）管理操作，由设置页与看板列头共用。
export type TStateGroupOperationsCallbacks = {
  createGroup: (data: Partial<TStateGroupDef>) => Promise<TStateGroupDef>;
  updateGroup: (groupId: string, data: Partial<TStateGroupDef>) => Promise<TStateGroupDef>;
  deleteGroup: (groupId: string) => Promise<void>;
};

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { getStateGroupMeta } from "@plane/constants";
import { setToast } from "@plane/blocks/toast";
import { getApiErrorMessage } from "@/lib/api-error";
import type { IState, TStateGroups, TStateOperationsCallbacks } from "@plane/types";
// components
import { StateForm } from "@/components/project-states";

type TStateCreate = {
  groupKey: TStateGroups;
  createStateCallback: TStateOperationsCallbacks["createState"];
  handleClose: () => void;
};

export const StateCreate = observer(function StateCreate(props: TStateCreate) {
  const { groupKey, createStateCallback, handleClose } = props;

  // states
  const [loader, setLoader] = useState(false);

  const onCancel = () => {
    setLoader(false);
    handleClose();
  };

  const onSubmit = async (formData: Partial<IState>) => {
    if (!groupKey || loader) return { status: "error" };
    setLoader(true);

    try {
      await createStateCallback({ ...formData, group: formData.group ?? groupKey });

      setToast({
        type: "success",
        title: "成功！",
        message: "状态已创建。",
      });
      handleClose();
      return { status: "success" };
    } catch (error) {
      setToast({ type: "error", title: "创建失败", message: getApiErrorMessage(error, "无法创建状态，请重试。") });
      return { status: "error" };
    } finally {
      setLoader(false);
    }
  };

  return (
    <StateForm
      data={{ name: "", description: "", color: getStateGroupMeta(groupKey).color, group: groupKey }}
      onSubmit={onSubmit}
      onCancel={onCancel}
      buttonDisabled={loader}
      buttonTitle={loader ? "创建中…" : "创建状态"}
    />
  );
});

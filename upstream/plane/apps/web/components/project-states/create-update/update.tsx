/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { setToast } from "@plane/blocks/toast";
import { getApiErrorMessage } from "@/lib/api-error";
import type { IState, TStateOperationsCallbacks } from "@plane/types";
// components
import { StateForm } from "@/components/project-states";

type TStateUpdate = {
  state: IState;
  updateStateCallback: TStateOperationsCallbacks["updateState"];
  handleClose: () => void;
};

export const StateUpdate = observer(function StateUpdate(props: TStateUpdate) {
  const { state, updateStateCallback, handleClose } = props;
  // states
  const [loader, setLoader] = useState(false);

  const onCancel = () => {
    setLoader(false);
    handleClose();
  };

  const onSubmit = async (formData: Partial<IState>) => {
    if (!state.id || loader) return { status: "error" };
    setLoader(true);

    try {
      await updateStateCallback(state.id, formData);
      setToast({
        type: "success",
        title: "成功！",
        message: "状态已更新。",
      });
      handleClose();
      return { status: "success" };
    } catch (error) {
      setToast({ type: "error", title: "更新失败", message: getApiErrorMessage(error, "无法更新状态，请重试。") });
      return { status: "error" };
    } finally {
      setLoader(false);
    }
  };

  return (
    <StateForm
      key={state.id}
      data={state}
      onSubmit={onSubmit}
      onCancel={onCancel}
      buttonDisabled={loader}
      buttonTitle={loader ? "保存中…" : "保存状态"}
    />
  );
});

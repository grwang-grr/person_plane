/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { STATE_GROUPS } from "@plane/constants";
import { setToast } from "@plane/blocks/toast";
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
    if (!groupKey) return { status: "error" };

    try {
      await createStateCallback({ ...formData, group: groupKey });

      setToast({
        type: "success",
        title: "成功！",
        message: "状态已创建。",
      });
      handleClose();
      return { status: "success" };
    } catch (error) {
      const errorStatus = error as { status: number; data: { error: string } };
      if (errorStatus?.status === 400) {
        setToast({
          type: "error",
          title: "错误！",
          message: "此状态名称已存在，请使用其他名称。",
        });
        return { status: "already_exists" };
      } else {
        setToast({
          type: "error",
          title: "错误！",
          message: errorStatus.data.error ?? "无法创建状态，请重试。",
        });
        return { status: "error" };
      }
    }
  };

  return (
    <StateForm
      data={{ name: "", description: "", color: STATE_GROUPS[groupKey].color, group: groupKey }}
      onSubmit={onSubmit}
      onCancel={onCancel}
      buttonDisabled={loader}
      buttonTitle={loader ? `Creating` : `Create`}
    />
  );
});

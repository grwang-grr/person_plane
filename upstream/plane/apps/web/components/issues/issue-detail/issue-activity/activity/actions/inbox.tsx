/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// hooks
import { IntakeOutline } from "@makeplane/propel/icons";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// components
import { IssueActivityBlockComponent } from "./";
// icons

type TIssueInboxActivity = { activityId: string; ends: "top" | "bottom" | undefined };

export const IssueInboxActivity = observer(function IssueInboxActivity(props: TIssueInboxActivity) {
  const { activityId, ends } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  const getInboxActivityMessage = () => {
    switch (activity?.verb) {
      case "-1":
        return "拒绝了收件箱中的此工作项。";
      case "0":
        return "暂缓了此工作项。";
      case "1":
        return "接受了收件箱中的此工作项。";
      case "2":
        return "将收件箱中的此工作项标记为重复项并拒绝。";
      default:
        return "更新了收件箱工作项状态。";
    }
  };

  if (!activity) return <></>;
  return (
    <IssueActivityBlockComponent
      icon={<IntakeOutline className="h-4 w-4 flex-shrink-0 text-secondary" />}
      activityId={activityId}
      ends={ends}
    >
      <>{getInboxActivityMessage()}</>
    </IssueActivityBlockComponent>
  );
});

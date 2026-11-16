/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Avatar } from "@makeplane/propel/components/avatar";
import { Badge } from "@makeplane/propel/components/badge";
import { AnchorButton } from "@makeplane/propel/components/anchor-button";
import { Icon } from "@makeplane/propel/components/icon";
import { DownloadOutline } from "@makeplane/propel/icons";
import type { IExportData } from "@plane/types";
import { getDate, getFileURL, renderFormattedDate } from "@plane/utils";

type RowData = IExportData;
const checkExpiry = (inputDateString: string) => {
  const currentDate = new Date();
  const expiryDate = getDate(inputDateString);
  if (!expiryDate) return false;
  expiryDate.setDate(expiryDate.getDate() + 7);
  return expiryDate > currentDate;
};
export const useExportColumns = () => {
  const columns = [
    {
      key: "Exported By",
      content: "导出人",
      tdRender: (rowData: RowData) => {
        const { avatar_url, display_name, email } = rowData.initiated_by_detail;
        return (
          <div className="flex items-center gap-x-2">
            <Avatar
              size="2xs"
              src={avatar_url && avatar_url.trim() !== "" ? getFileURL(avatar_url) : undefined}
              alt={display_name || email}
              fallback={<span className="capitalize">{(email ?? display_name ?? "?")[0]}</span>}
            />
            <div>{display_name}</div>
          </div>
        );
      },
    },
    {
      key: "Exported On",
      content: "导出时间",
      tdRender: (rowData: RowData) => <span>{renderFormattedDate(rowData.created_at)}</span>,
    },

    {
      key: "Exported projects",
      content: "导出的项目",
      tdRender: (rowData: RowData) => <div className="text-body-xs-regular">{rowData.project.length} 个项目</div>,
    },
    {
      key: "Format",
      content: "格式",
      tdRender: (rowData: RowData) => (
        <span className="text-body-xs-regular">
          {rowData.provider === "csv"
            ? "逗号分隔表格"
            : rowData.provider === "xlsx"
              ? "电子表格"
              : rowData.provider === "json"
                ? "结构化数据"
                : ""}
        </span>
      ),
    },
    {
      key: "Status",
      content: "状态",
      tdRender: (rowData: RowData) => (
        <Badge
          size="sm"
          variant={
            rowData.status === "completed"
              ? "success"
              : rowData.status === "processing"
                ? "warning"
                : rowData.status === "failed"
                  ? "danger"
                  : rowData.status === "expired"
                    ? "orange"
                    : "neutral"
          }
          render={<span className="capitalize" />}
          label={rowData.status}
        />
      ),
    },
    {
      key: "Download",
      content: "下载",
      tdRender: (rowData: RowData) =>
        checkExpiry(rowData.created_at) ? (
          <>
            {rowData.status == "completed" ? (
              <div className="flex flex-col">
                <AnchorButton
                  variant="primary"
                  size="md"
                  target="_blank"
                  href={rowData?.url}
                  rel="noopener noreferrer"
                  icon={<Icon icon={DownloadOutline} />}
                  label="下载"
                />
              </div>
            ) : (
              "-"
            )}
          </>
        ) : (
          <div className="text-caption-sm-regular text-danger-primary">已过期</div>
        ),
    },
  ];
  return columns;
};

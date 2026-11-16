/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
// ui
import { Button } from "@makeplane/propel/components/button";
import type { IExportData } from "@plane/types";
// helpers
import { getDate, renderFormattedDate } from "@plane/utils";
// types

type Props = {
  service: IExportData;
  refreshing: boolean;
};

export function SingleExport({ service, refreshing }: Props) {
  const provider = service.provider;

  const [isLoading] = useState(false);
  const downloadLabel = isLoading ? "下载中" : "下载";

  const checkExpiry = (inputDateString: string) => {
    const currentDate = new Date();
    const expiryDate = getDate(inputDateString);
    if (!expiryDate) return false;
    expiryDate.setDate(expiryDate.getDate() + 7);
    return expiryDate > currentDate;
  };

  return (
    <div className="flex items-center justify-between gap-2 px-4 py-3">
      <div>
        <h4 className="flex items-center gap-2 text-body-xs-regular">
          <span>
            导出到{" "}
            <span className="font-medium">
              {provider === "csv" ? "逗号分隔表格" : provider === "xlsx" ? "电子表格" : provider === "json" ? "结构化数据" : ""}
            </span>{" "}
          </span>
          <span
            className={`rounded-sm px-2 py-0.5 text-caption-sm-regular capitalize ${
              service.status === "completed"
                ? "bg-success-subtle text-success-primary"
                : service.status === "processing"
                  ? "bg-yellow-500/20 text-yellow-500"
                  : service.status === "failed"
                    ? "bg-danger-subtle text-danger-primary"
                    : service.status === "expired"
                      ? "bg-orange-500/20 text-orange-500"
                      : ""
            }`}
          >
            {refreshing ? "刷新中" : service.status}
          </span>
        </h4>
        <div className="mt-2 flex items-center gap-2 text-caption-sm-regular text-secondary">
          <span>{renderFormattedDate(service.created_at)}</span>|
          <span>导出人 {service?.initiated_by_detail?.display_name}</span>
        </div>
      </div>
      {checkExpiry(service.created_at) ? (
        <>
          {service.status == "completed" && (
            <div>
              <Button
                variant="primary"
                size="sm"
                stretch="full"
                label={downloadLabel}
                nativeButton={false}
                render={
                  <a target="_blank" href={service?.url} rel="noopener noreferrer">
                    {downloadLabel}
                  </a>
                }
              />
            </div>
          )}
        </>
      ) : (
        <div className="text-caption-sm-regular text-danger-primary">已过期</div>
      )}
    </div>
  );
}

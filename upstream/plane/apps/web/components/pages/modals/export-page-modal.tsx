/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import type { PageProps } from "@react-pdf/renderer";
import { pdf } from "@react-pdf/renderer";
import { Controller, useForm } from "react-hook-form";
import { useParams } from "react-router";
// plane editor
import type { EditorRefApi } from "@plane/editor";
// plane ui
import { Button } from "@makeplane/propel/components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogHeading,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
import { Select, SelectDropdownPlacementContext } from "@plane/blocks/select";
import { setToast } from "@plane/blocks/toast";
// components
import { PDFDocument } from "@/components/editor/pdf";
// hooks
import { useParseEditorContent } from "@/hooks/use-parse-editor-content";

type Props = {
  editorRef: EditorRefApi | null;
  isOpen: boolean;
  onClose: () => void;
  pageTitle: string;
};

type TExportFormats = "pdf" | "markdown";
type TPageFormats = Exclude<PageProps["size"], undefined>;
type TContentVariety = "everything" | "no-assets";

type TFormValues = {
  export_format: TExportFormats;
  page_format: TPageFormats;
  content_variety: TContentVariety;
};

const EXPORT_FORMATS: {
  key: TExportFormats;
  label: string;
}[] = [
  {
    key: "pdf",
    label: "便携文档",
  },
  {
    key: "markdown",
    label: "标记文本",
  },
];

const PAGE_FORMATS: {
  key: TPageFormats;
  label: string;
}[] = [
  {
    key: "A4",
    label: "A4",
  },
  {
    key: "A3",
    label: "A3",
  },
  {
    key: "A2",
    label: "A2",
  },
  {
    key: "LETTER",
    label: "信纸",
  },
  {
    key: "LEGAL",
    label: "法律用纸",
  },
  {
    key: "TABLOID",
    label: "小报纸",
  },
];

const CONTENT_VARIETY: {
  key: TContentVariety;
  label: string;
}[] = [
  {
    key: "everything",
    label: "全部内容",
  },
  {
    key: "no-assets",
    label: "不包含图片",
  },
];

// The dropdowns open flush with the control's right edge, as `placement="bottom-end"` did.
const DROPDOWN_PLACEMENT = { side: "bottom", align: "end" } as const;

const defaultValues: TFormValues = {
  export_format: "pdf",
  page_format: "A4",
  content_variety: "everything",
};

export function ExportPageModal(props: Props) {
  const { editorRef, isOpen, onClose, pageTitle } = props;
  // states
  const [isExporting, setIsExporting] = useState(false);
  // params
  const { workspaceSlug, projectId } = useParams();
  // form info
  const { control, reset, watch } = useForm<TFormValues>({
    defaultValues,
  });
  // parse editor content
  const { replaceCustomComponentsFromHTMLContent, replaceCustomComponentsFromMarkdownContent } = useParseEditorContent({
    projectId,
    workspaceSlug: workspaceSlug ?? "",
  });
  // derived values
  const selectedExportFormat = watch("export_format");
  const selectedPageFormat = watch("page_format");
  const selectedContentVariety = watch("content_variety");
  const isPDFSelected = selectedExportFormat === "pdf";
  const fileName = pageTitle
    ?.toLowerCase()
    ?.replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-");
  // handle modal close
  const handleClose = () => {
    onClose();
    setTimeout(() => {
      reset();
    }, 300);
  };

  const initiateDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  };

  // handle export as a PDF
  const handleExportAsPDF = async () => {
    try {
      const pageContent = `<h1 class="page-title">${pageTitle}</h1>${editorRef?.getDocument().html ?? "<p></p>"}`;
      const parsedPageContent = await replaceCustomComponentsFromHTMLContent({
        htmlContent: pageContent,
        noAssets: selectedContentVariety === "no-assets",
      });

      const blob = await pdf(<PDFDocument content={parsedPageContent} pageFormat={selectedPageFormat} />).toBlob();
      initiateDownload(blob, `${fileName}-${selectedPageFormat.toString().toLowerCase()}.pdf`);
    } catch (error) {
      throw new Error(`Error in exporting as a PDF: ${error}`, { cause: error });
    }
  };
  // handle export as markdown
  const handleExportAsMarkdown = async () => {
    try {
      const markdownContent = editorRef?.getMarkDown() ?? "";
      const parsedMarkdownContent = replaceCustomComponentsFromMarkdownContent({
        markdownContent,
        noAssets: selectedContentVariety === "no-assets",
      });

      const blob = new Blob([parsedMarkdownContent], { type: "text/markdown" });
      initiateDownload(blob, `${fileName}.md`);
    } catch (error) {
      throw new Error(`Error in exporting as markdown: ${error}`, { cause: error });
    }
  };
  // handle export
  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (selectedExportFormat === "pdf") {
        await handleExportAsPDF();
      }
      if (selectedExportFormat === "markdown") {
        await handleExportAsMarkdown();
      }
      setToast({
        type: "success",
        title: "成功！",
        message: "文档已导出。",
      });
      handleClose();
    } catch (error) {
      console.error("Error in exporting page:", error);
      setToast({
        type: "error",
        title: "错误！",
        message: "无法导出文档，请稍后重试。",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent size="xs">
        <DialogMain>
          <DialogHeader>
            <DialogHeading>
              <DialogTitle>导出文档</DialogTitle>
            </DialogHeading>
          </DialogHeader>
          <DialogBody>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="shrink-0 text-body-sm-medium text-primary">导出格式</span>
                <Controller
                  control={control}
                  name="export_format"
                  render={({ field: { onChange, value } }) => (
                    <ExportOptionSelect
                      label="导出格式"
                      options={EXPORT_FORMATS}
                      value={value}
                      onChange={(val) => onChange(val as TExportFormats)}
                    />
                  )}
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="shrink-0 text-body-sm-medium text-primary">包含内容</span>
                <Controller
                  control={control}
                  name="content_variety"
                  render={({ field: { onChange, value } }) => (
                    <ExportOptionSelect
                      label="包含内容"
                      options={CONTENT_VARIETY}
                      value={value}
                      onChange={(val) => onChange(val as TContentVariety)}
                    />
                  )}
                />
              </div>
              {isPDFSelected && (
                <div className="flex items-center justify-between gap-2">
                  <span className="shrink-0 text-body-sm-medium text-primary">文档格式</span>
                  <Controller
                    control={control}
                    name="page_format"
                    render={({ field: { onChange, value } }) => (
                      <ExportOptionSelect
                        label="文档格式"
                        options={PAGE_FORMATS}
                        value={value}
                        onChange={(val) => onChange(val as TPageFormats)}
                      />
                    )}
                  />
                </div>
              )}
            </div>
          </DialogBody>
        </DialogMain>
        <DialogActions>
          <Button variant="secondary" size="md" stretch="auto" label="取消" onClick={handleClose} />
          <Button
            variant="primary"
            size="md"
            stretch="auto"
            label={isExporting ? "导出中" : "导出"}
            loading={isExporting}
            onClick={handleExport}
          />
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}

type TExportOption<T> = { key: T; label: string };

/** Borderless single-select for one export setting (legacy `CustomSelect` with `buttonClassName="border-none"`). */
function ExportOptionSelect<T>(props: {
  label: string;
  options: TExportOption<T>[];
  value: T;
  onChange: (value: string) => void;
}) {
  const { label, options, value, onChange } = props;
  // derive the selection from the stored key, so an unknown key still renders instead of blanking
  const selected = options.find((option) => option.key === value) ?? { key: value, label: String(value) };

  return (
    <div className="flex-shrink-0">
      <SelectDropdownPlacementContext.Provider value={DROPDOWN_PLACEMENT}>
        <Select<TExportOption<T>>
          getValues={() => options}
          value={selected}
          onChange={onChange}
          getOptionValue={(option) => String(option.key)}
          getOptionLabel={(option) => option.label}
          showSearch={false}
          pinSelected={false}
          // never shown (a value is always selected); it names the trigger, e.g. "Export format, PDF"
          placeholder={label}
        >
          {/* Ghost triggers hide their chevron until hover; this row keeps it visible. */}
          <Select.Trigger variant="select-ghost-md" className="w-auto text-secondary [&_svg]:visible">
            <span className="truncate">{selected.label}</span>
          </Select.Trigger>
        </Select>
      </SelectDropdownPlacementContext.Provider>
    </div>
  );
}

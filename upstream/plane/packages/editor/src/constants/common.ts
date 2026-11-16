/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ComponentType, SVGProps } from "react";
import {
  AlignCenterOutline,
  AlignLeftOutline,
  AlignRightOutline,
  BoldOutline,
  CodeOutline,
  H1Outline,
  H2Outline,
  H3Outline,
  H4Outline,
  H5Outline,
  H6Outline,
  ImageOutline,
  ItalicOutline,
  ListOutline,
  NumberedListOutline,
  QuoteOutline,
  StrikethroughOutline,
  TableEditorOutline,
  TextOutline,
  ToDoOutline,
  UnderlineOutline,
} from "@makeplane/propel/icons";
import { MonospaceIcon, SansSerifIcon, SerifIcon } from "@plane/blocks/icons";
import type { TCommandExtraProps, TEditorCommands, TEditorFontStyle } from "@/types";

export type TEditorTypes = "lite" | "document" | "sticky";

// Utility type to enforce the necessary extra props or make extraProps optional
export type ExtraPropsForCommand<T extends TEditorCommands> = T extends keyof TCommandExtraProps
  ? TCommandExtraProps[T]
  : object; // Default to empty object for commands without extra props

export type ToolbarMenuItem<T extends TEditorCommands = TEditorCommands> = {
  itemKey: T;
  renderKey: string;
  name: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  shortcut?: string[];
  editors: TEditorTypes[];
  extraProps?: ExtraPropsForCommand<T>;
};

export const TYPOGRAPHY_ITEMS: ToolbarMenuItem<"text" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6">[] = [
  { itemKey: "text", renderKey: "text", name: "文本", icon: TextOutline, editors: ["document"] },
  { itemKey: "h1", renderKey: "h1", name: "一级标题", icon: H1Outline, editors: ["document"] },
  { itemKey: "h2", renderKey: "h2", name: "二级标题", icon: H2Outline, editors: ["document"] },
  { itemKey: "h3", renderKey: "h3", name: "三级标题", icon: H3Outline, editors: ["document"] },
  { itemKey: "h4", renderKey: "h4", name: "四级标题", icon: H4Outline, editors: ["document"] },
  { itemKey: "h5", renderKey: "h5", name: "五级标题", icon: H5Outline, editors: ["document"] },
  { itemKey: "h6", renderKey: "h6", name: "六级标题", icon: H6Outline, editors: ["document"] },
];

export const TEXT_ALIGNMENT_ITEMS: ToolbarMenuItem<"text-align">[] = [
  {
    itemKey: "text-align",
    renderKey: "text-align-left",
    name: "左对齐",
    icon: AlignLeftOutline,
    shortcut: ["Cmd", "Shift", "L"],
    editors: ["lite", "document"],
    extraProps: {
      alignment: "left",
    },
  },
  {
    itemKey: "text-align",
    renderKey: "text-align-center",
    name: "居中对齐",
    icon: AlignCenterOutline,
    shortcut: ["Cmd", "Shift", "E"],
    editors: ["lite", "document"],
    extraProps: {
      alignment: "center",
    },
  },
  {
    itemKey: "text-align",
    renderKey: "text-align-right",
    name: "右对齐",
    icon: AlignRightOutline,
    shortcut: ["Cmd", "Shift", "R"],
    editors: ["lite", "document"],
    extraProps: {
      alignment: "right",
    },
  },
];

const BASIC_MARK_ITEMS: ToolbarMenuItem<"bold" | "italic" | "underline" | "strikethrough">[] = [
  {
    itemKey: "bold",
    renderKey: "bold",
    name: "粗体",
    icon: BoldOutline,
    shortcut: ["Cmd", "B"],
    editors: ["lite", "document"],
  },
  {
    itemKey: "italic",
    renderKey: "italic",
    name: "斜体",
    icon: ItalicOutline,
    shortcut: ["Cmd", "I"],
    editors: ["lite", "document"],
  },
  {
    itemKey: "underline",
    renderKey: "underline",
    name: "下划线",
    icon: UnderlineOutline,
    shortcut: ["Cmd", "U"],
    editors: ["lite", "document"],
  },
  {
    itemKey: "strikethrough",
    renderKey: "strikethrough",
    name: "删除线",
    icon: StrikethroughOutline,
    shortcut: ["Cmd", "Shift", "S"],
    editors: ["lite", "document"],
  },
];

const LIST_ITEMS: ToolbarMenuItem<"bulleted-list" | "numbered-list" | "to-do-list">[] = [
  {
    itemKey: "bulleted-list",
    renderKey: "bulleted-list",
    name: "无序列表",
    icon: ListOutline,
    shortcut: ["Cmd", "Shift", "7"],
    editors: ["lite", "document"],
  },
  {
    itemKey: "numbered-list",
    renderKey: "numbered-list",
    name: "有序列表",
    icon: NumberedListOutline,
    shortcut: ["Cmd", "Shift", "8"],
    editors: ["lite", "document"],
  },
  {
    itemKey: "to-do-list",
    renderKey: "to-do-list",
    name: "To-do list",
    icon: ToDoOutline,
    shortcut: ["Cmd", "Shift", "9"],
    editors: ["lite", "document"],
  },
];

export const USER_ACTION_ITEMS: ToolbarMenuItem<"quote" | "code">[] = [
  { itemKey: "quote", renderKey: "quote", name: "引用", icon: QuoteOutline, editors: ["lite", "document"] },
  { itemKey: "code", renderKey: "code", name: "代码", icon: CodeOutline, editors: ["lite", "document"] },
];

export const COMPLEX_ITEMS: ToolbarMenuItem<"table" | "image">[] = [
  { itemKey: "table", renderKey: "table", name: "表格", icon: TableEditorOutline, editors: ["document"] },
  { itemKey: "image", renderKey: "image", name: "图片", icon: ImageOutline, editors: ["lite", "document"] },
];

export const IMAGE_ITEM = COMPLEX_ITEMS.find((item): item is ToolbarMenuItem<"image"> => item.itemKey === "image")!;

export const TOOLBAR_ITEMS: {
  [editorType in TEditorTypes]: {
    [key: string]: ToolbarMenuItem[];
  };
} = {
  lite: {
    basic: BASIC_MARK_ITEMS.filter((item) => item.editors.includes("lite")),
    alignment: TEXT_ALIGNMENT_ITEMS.filter((item) => item.editors.includes("lite")),
    list: LIST_ITEMS.filter((item) => item.editors.includes("lite")),
    userAction: USER_ACTION_ITEMS.filter((item) => item.editors.includes("lite")),
    complex: COMPLEX_ITEMS.filter((item) => item.editors.includes("lite")),
  },
  document: {
    basic: BASIC_MARK_ITEMS.filter((item) => item.editors.includes("document")),
    alignment: TEXT_ALIGNMENT_ITEMS.filter((item) => item.editors.includes("document")),
    list: LIST_ITEMS.filter((item) => item.editors.includes("document")),
    userAction: USER_ACTION_ITEMS.filter((item) => item.editors.includes("document")),
    complex: COMPLEX_ITEMS.filter((item) => item.editors.includes("document")),
  },
  sticky: {
    basic: BASIC_MARK_ITEMS.filter((item) => ["bold", "italic"].includes(item.itemKey)),
    list: LIST_ITEMS.filter((item) => ["to-do-list"].includes(item.itemKey)),
  },
};

export const COLORS_LIST: {
  key: string;
  label: string;
  textColor: string;
  backgroundColor: string;
}[] = [
  {
    key: "gray",
    label: "灰色",
    textColor: "var(--editor-colors-gray-text)",
    backgroundColor: "var(--editor-colors-gray-background)",
  },
  {
    key: "peach",
    label: "桃色",
    textColor: "var(--editor-colors-peach-text)",
    backgroundColor: "var(--editor-colors-peach-background)",
  },
  {
    key: "pink",
    label: "粉色",
    textColor: "var(--editor-colors-pink-text)",
    backgroundColor: "var(--editor-colors-pink-background)",
  },
  {
    key: "orange",
    label: "橙色",
    textColor: "var(--editor-colors-orange-text)",
    backgroundColor: "var(--editor-colors-orange-background)",
  },
  {
    key: "green",
    label: "绿色",
    textColor: "var(--editor-colors-green-text)",
    backgroundColor: "var(--editor-colors-green-background)",
  },
  {
    key: "light-blue",
    label: "浅蓝色",
    textColor: "var(--editor-colors-light-blue-text)",
    backgroundColor: "var(--editor-colors-light-blue-background)",
  },
  {
    key: "dark-blue",
    label: "深蓝色",
    textColor: "var(--editor-colors-dark-blue-text)",
    backgroundColor: "var(--editor-colors-dark-blue-background)",
  },
  {
    key: "purple",
    label: "紫色",
    textColor: "var(--editor-colors-purple-text)",
    backgroundColor: "var(--editor-colors-purple-background)",
  },
  // {
  //   key: "pink-blue-gradient",
  //   label: "Pink blue gradient",
  //   textColor: "var(--editor-colors-pink-blue-gradient-text)",
  //   backgroundColor: "var(--editor-colors-pink-blue-gradient-background)",
  // },
];

export const EDITOR_FONT_STYLES: {
  key: TEditorFontStyle;
  label: string;
  icon: React.FC;
}[] = [
  { key: "sans-serif", label: "无衬线字体", icon: SansSerifIcon },
  { key: "serif", label: "衬线字体", icon: SerifIcon },
  { key: "monospace", label: "等宽字体", icon: MonospaceIcon },
];

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TocItem = { level: number; text: string; index: number };

/** 项目概览等文档页共用的 Markdown 排版样式。 */
export const MARKDOWN_STYLES = [
  "text-body-sm-regular leading-7 text-secondary",
  "[&_h1]:mb-3 [&_h1]:mt-6 [&_h1]:text-h5-semibold [&_h1]:text-primary",
  "[&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-h6-semibold [&_h2]:text-primary",
  "[&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-body-md-semibold [&_h3]:text-primary",
  "[&_h4]:mb-1 [&_h4]:mt-3 [&_h4]:text-body-sm-semibold [&_h4]:text-primary",
  "[&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6",
  "[&_li]:my-1 [&_a]:text-accent-primary [&_a]:underline [&_code]:rounded-sm [&_code]:bg-layer-1 [&_code]:px-1",
  "[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-layer-1 [&_pre]:p-3",
  "[&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-subtle-1 [&_blockquote]:pl-3",
  "[&_table]:my-3 [&_table]:w-full [&_th]:border-b [&_th]:border-subtle-1 [&_th]:p-2 [&_td]:border-b [&_td]:border-subtle-1 [&_td]:p-2",
  "[&_img]:my-4 [&_img]:max-h-[32rem] [&_img]:max-w-full [&_img]:rounded-lg [&_img]:border [&_img]:border-subtle-1 [&_img]:object-contain",
].join(" ");

/** 从 Markdown（或历史 HTML）中提取 h1-h4 目录。 */
export const parseTableOfContents = (value: string): TocItem[] => {
  if (/^\s*<(p|h[1-6]|ul|ol|div|table|blockquote|pre)\b/i.test(value)) {
    return Array.from(value.matchAll(/<h([1-4])\b[^>]*>([\s\S]*?)<\/h\1>/gi)).map((match, index) => ({
      level: Number(match[1]),
      text: match[2].replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() || "未命名标题",
      index,
    }));
  }

  const items: TocItem[] = [];
  let inCodeBlock = false;
  for (const line of value.split("\n")) {
    if (/^\s*```/.test(line)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;
    const match = /^(#{1,4})\s+(.*)$/.exec(line);
    if (match?.[2]?.trim()) {
      items.push({ level: match[1].length, text: match[2].replace(/[*_`]/g, "").trim(), index: items.length });
    }
  }
  return items;
};

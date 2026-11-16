// Copyright (c) 2023-present Plane Software, Inc. and contributors
// SPDX-License-Identifier: AGPL-3.0-only

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(path.join(root, file), "utf8");

test("admin routing and navigation do not expose provider configuration", () => {
  assert.doesNotMatch(read("apps/admin/app/routes.ts"), /route\("ai"/);
  assert.doesNotMatch(read("apps/admin/hooks/use-sidebar-menu/index.ts"), /coreSidebarMenuLinks\.ai/);
});

test("task and document editors do not expose generation controls", () => {
  for (const file of [
    "apps/web/components/issues/issue-modal/components/description-editor.tsx",
    "apps/web/components/pages/editor/editor-body.tsx",
    "packages/editor/src/extensions/side-menu.ts",
  ]) {
    assert.doesNotMatch(read(file), /AIService|GptAssistantPopover|EditorAIMenu|aiHandler|AIHandlePlugin/);
  }
  assert.match(read("packages/editor/src/extensions/side-menu.ts"), /DragHandlePlugin/);
  assert.match(read("packages/editor/src/hooks/use-collaborative-editor.ts"), /Collaboration\.configure/);
});

test("backend provider SDK is absent from declared and locked dependencies", () => {
  assert.doesNotMatch(read("apps/api/pyproject.toml"), /"openai[=<>]/);
  assert.doesNotMatch(read("apps/api/uv.lock"), /name = "openai"/);
  assert.doesNotMatch(read("apps/api/plane/app/urls/external.py"), /ai-assistant|GPTIntegration/);
});

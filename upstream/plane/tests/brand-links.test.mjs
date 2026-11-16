// Copyright (c) 2023-present Plane Software, Inc. and contributors
// SPDX-License-Identifier: AGPL-3.0-only

import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { findUpstreamBrandLinks, isUpstreamBrandLink } from "./brand-links.mjs";

test("detects upstream marketing, documentation, social and support destinations", () => {
  for (const url of [
    "https://docs.plane.so/example",
    "https://PLANE.SO/pricing",
    "https://plane.sh/example",
    "https://go.plane.so/example",
    "https://github.com/makeplane/plane/issues",
    "https://x.com/planepowers",
    "https://www.linkedin.com/company/planepowers/",
    "mailto:support@plane.so?subject=help",
  ])
    assert.equal(isUpstreamBrandLink(url), true, url);
});

test("preserves business navigation, customer URLs and unrelated repositories", () => {
  for (const url of [
    "/workspace/projects/123",
    "https://os.example.com/login",
    "https://customer.example.com",
    "https://github.com/customer/plane",
    "https://plane.so.example.com",
    "mailto:admin@example.com",
  ])
    assert.equal(isUpstreamBrandLink(url), false, url);
});

test("application code and email navigation contain no upstream brand destinations", () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  assert.deepEqual(findUpstreamBrandLinks(root), []);
});

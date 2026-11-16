import assert from "node:assert/strict";
import { test } from "node:test";
import { LUCIDE_ICONS_LIST } from "./lucide-icons";

test("Chinese icon labels retain persisted identifiers", () => {
  for (const icon of LUCIDE_ICONS_LIST) {
    assert.match(icon.name, /^[A-Za-z0-9]+$/);
    assert.match(icon.label, /[\u3400-\u9fff]/);
  }
  for (const name of ["Activity", "Archive", "Calendar", "Code", "Delete", "Download", "Epic", "Image"]) {
    assert.ok(LUCIDE_ICONS_LIST.some((icon) => icon.name === name));
  }
});

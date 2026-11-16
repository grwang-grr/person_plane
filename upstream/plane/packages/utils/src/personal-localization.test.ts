import assert from "node:assert/strict";
import { test } from "node:test";
import { getPageName } from "./page";
import { getViewName } from "./project-views";
import { renderFormattedDate } from "./datetime";

test("Chinese empty-name fallbacks preserve every explicitly entered name", () => {
  for (const displayName of [getPageName, getViewName]) {
    assert.equal(displayName(undefined), "");
    assert.equal(displayName(""), "未命名");
    assert.equal(displayName("  "), "未命名");
    for (const name of ["Untitled", "Todo", "My project", "English 中文"]) {
      assert.equal(displayName(name), name);
    }
  }
});

test("formatted dates use Chinese month names", () => {
  assert.match(renderFormattedDate("2026-11-12", "MMMM") ?? "", /十一月|11月/);
});

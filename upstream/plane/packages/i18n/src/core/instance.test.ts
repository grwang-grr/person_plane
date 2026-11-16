import assert from "node:assert/strict";
import { test } from "node:test";
import { initPromise, i18nInstance } from "./instance";
import { NAMESPACES } from "../constants/namespaces";

test("personal Chinese namespaces are bundled and ready without network requests", async () => {
  await initPromise;
  for (const namespace of NAMESPACES) {
    assert.ok(i18nInstance.hasResourceBundle("zh-CN", namespace), namespace);
  }
  assert.equal(i18nInstance.t("home.title"), "首页");
  assert.equal(i18nInstance.t("drafts"), "草稿");
});

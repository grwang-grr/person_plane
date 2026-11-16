import assert from "node:assert/strict";
import { test } from "node:test";
import { getApiErrorMessage } from "./api-error.ts";

test("shows DRF field validation errors from service payloads", () => {
  assert.equal(getApiErrorMessage({ key: ["该分组标识已存在。"] }, "保存失败"), "该分组标识已存在。");
});

test("supports Axios errors and response objects used by existing state services", () => {
  const data = { name: ["此状态名称已存在。"] };
  assert.equal(getApiErrorMessage({ response: { data } }, "保存失败"), "此状态名称已存在。");
  assert.equal(getApiErrorMessage({ data, status: 400, statusText: "Bad Request" }, "保存失败"), "此状态名称已存在。");
});

test("uses a readable fallback for network failures and empty payloads", () => {
  for (const failure of [new Error("Network Error"), null, undefined, {}, { name: [] }]) {
    assert.equal(getApiErrorMessage(failure, "保存失败，请重试。"), "保存失败，请重试。");
  }
});

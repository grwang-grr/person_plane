import assert from "node:assert/strict";
import { test } from "node:test";
import { createCsrfTokenLoader } from "./personal-csrf";

test("concurrent writes share a masked CSRF token without reading HttpOnly cookies", async () => {
  let calls = 0;
  const load = createCsrfTokenLoader(async (url, options) => {
    calls++;
    assert.equal(url, "/api/personal/bootstrap/");
    assert.equal(options?.credentials, "same-origin");
    return Response.json({ csrf_token: "masked-token" });
  });
  assert.deepEqual(await Promise.all([load(), load()]), ["masked-token", "masked-token"]);
  assert.equal(calls, 1);
});

test("failed initialization retries and invalid payloads are rejected", async () => {
  let calls = 0;
  const load = createCsrfTokenLoader(async () => {
    calls++;
    return calls === 1 ? Response.json({ csrf_token: 123 }) : Response.json({ csrf_token: "valid-token" });
  });
  await assert.rejects(load(), /响应无效/);
  assert.equal(await load(), "valid-token");
  assert.equal(calls, 2);
});

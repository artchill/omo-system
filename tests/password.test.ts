import assert from "node:assert/strict";
import { test } from "node:test";
import { hashPassword, verifyPassword } from "../src/lib/password.ts";

test("hash verifies the right password and rejects others", async () => {
  const hash = await hashPassword("correct horse battery");
  assert.ok(hash.startsWith("scrypt$"));
  assert.equal(await verifyPassword("correct horse battery", hash), true);
  assert.equal(await verifyPassword("wrong", hash), false);
});

test("same password gives different hashes (random salt)", async () => {
  assert.notEqual(await hashPassword("abc"), await hashPassword("abc"));
});

test("malformed stored hash is rejected, not thrown", async () => {
  assert.equal(await verifyPassword("x", "garbage"), false);
  assert.equal(await verifyPassword("x", "scrypt$1$2"), false);
});

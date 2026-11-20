import assert from "node:assert/strict";
import { test } from "node:test";
import { checkNewUser, cleanEmail } from "../src/lib/validate.ts";

const ok = { email: "a@b.co", name: "Amy", password: "1234567890" };

test("accepts a valid new user", () => assert.equal(checkNewUser(ok), null));
test("rejects bad email", () =>
  assert.equal(checkNewUser({ ...ok, email: "nope" }), "email"));
test("rejects empty name", () =>
  assert.equal(checkNewUser({ ...ok, name: "" }), "name"));
test("rejects short and oversized passwords", () => {
  assert.equal(checkNewUser({ ...ok, password: "short" }), "passwordShort");
  assert.equal(checkNewUser({ ...ok, password: "x".repeat(201) }), "passwordShort");
});
test("cleanEmail trims and lowercases", () =>
  assert.equal(cleanEmail("  Amy@Example.COM "), "amy@example.com"));

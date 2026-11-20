import assert from "node:assert/strict";
import { test } from "node:test";
import { can, isRole, ROLES } from "../src/domain/roles.ts";

test("only admin manages users", () => {
  assert.equal(can("admin", "users.manage"), true);
  assert.equal(can("sales", "users.manage"), false);
  assert.equal(can("assistant", "users.manage"), false);
});

test("isRole is a strict allow-list", () => {
  for (const r of ROLES) assert.equal(isRole(r), true);
  for (const bad of ["Admin", "root", "", null, undefined, 1, "admin "])
    assert.equal(isRole(bad), false);
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { formatDate, formatDateTime, todayISO } from "../src/lib/format.ts";

test("formats timestamps in the team's timezone, not the host's", () => {
  // 06:30 UTC is 14:30 in Taipei on the same day
  assert.equal(formatDateTime("2026-12-01T06:30:00.000Z"), "2026-12-01 14:30");
  assert.equal(formatDate("2026-12-01T06:30:00.000Z"), "2026-12-01");
});

test("rolls to the next day for evening UTC times", () => {
  // 16:19 UTC is 00:19 the FOLLOWING day in Taipei — the case a UTC server
  // would render as the previous date
  assert.equal(formatDateTime("2026-11-26T16:19:00.000Z"), "2026-11-27 00:19");
  assert.equal(formatDate("2026-11-26T16:19:00.000Z"), "2026-11-27");
});

test("renders midnight as 00:00, never 24:00", () => {
  assert.equal(formatDateTime("2026-11-26T16:00:00.000Z"), "2026-11-27 00:00");
});

test("renders the last minute of the day", () => {
  assert.equal(formatDateTime("2026-01-01T15:59:00.000Z"), "2026-01-01 23:59");
});

test("output is independent of the host timezone", () => {
  const iso = "2026-07-04T18:45:00.000Z";
  const expected = "2026-07-05 02:45";
  const original = process.env.TZ;
  for (const tz of ["UTC", "America/New_York", "Asia/Taipei", "Pacific/Kiritimati"]) {
    process.env.TZ = tz;
    assert.equal(formatDateTime(iso), expected, `host TZ ${tz}`);
  }
  process.env.TZ = original;
});

test("missing and unparseable values fall back instead of showing Invalid Date", () => {
  for (const bad of [null, undefined, "", "garbage"]) {
    assert.equal(formatDate(bad), "—");
    assert.equal(formatDateTime(bad), "—");
  }
  assert.equal(formatDate(null, "n/a"), "n/a");
});

test("todayISO returns a bare YYYY-MM-DD date", () => {
  assert.match(todayISO(), /^\d{4}-\d{2}-\d{2}$/);
});

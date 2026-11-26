import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatDate,
  formatDateTime,
  toISODate,
  todayISO,
} from "../src/lib/format.ts";

// 16:30:45 UTC is 00:30:45 the FOLLOWING day in Taipei — the case a UTC
// server would otherwise render as the previous date.
const LATE = "2026-11-26T16:30:45.000Z";
// 06:05:09 UTC is 14:05:09 the same day in Taipei.
const AFTERNOON = "2026-12-01T06:05:09.000Z";

test("renders the agreed English format", () => {
  assert.equal(formatDateTime(LATE, "en"), "November 27, 2026 at 12:30:45 AM");
  assert.equal(formatDateTime(AFTERNOON, "en"), "December 1, 2026 at 2:05:09 PM");
});

test("renders the Traditional Chinese equivalent", () => {
  assert.equal(formatDateTime(LATE, "zh-Hant"), "2026年11月27日 上午12:30:45");
  assert.equal(formatDateTime(AFTERNOON, "zh-Hant"), "2026年12月1日 下午2:05:09");
});

test("date-only form drops the time", () => {
  assert.equal(formatDate(LATE, "en"), "November 27, 2026");
  assert.equal(formatDate(LATE, "zh-Hant"), "2026年11月27日");
});

test("formats in the team's timezone, not the host's", () => {
  const original = process.env.TZ;
  for (const tz of ["UTC", "America/New_York", "Asia/Taipei", "Pacific/Kiritimati"]) {
    process.env.TZ = tz;
    assert.equal(
      formatDateTime(LATE, "en"),
      "November 27, 2026 at 12:30:45 AM",
      `host TZ ${tz}`,
    );
    assert.equal(toISODate(LATE), "2026-11-27", `host TZ ${tz}`);
  }
  process.env.TZ = original;
});

test("midnight reads as 12 AM, noon as 12 PM", () => {
  // 16:00:00 UTC = 00:00:00 Taipei next day
  assert.equal(formatDateTime("2026-11-26T16:00:00.000Z", "en"), "November 27, 2026 at 12:00:00 AM");
  // 04:00:00 UTC = 12:00:00 Taipei
  assert.equal(formatDateTime("2026-11-27T04:00:00.000Z", "en"), "November 27, 2026 at 12:00:00 PM");
});

test("toISODate keeps the machine format for inputs and the database", () => {
  assert.equal(toISODate(AFTERNOON), "2026-12-01");
  assert.match(todayISO(), /^\d{4}-\d{2}-\d{2}$/);
});

test("missing and unparseable values fall back instead of showing Invalid Date", () => {
  for (const bad of [null, undefined, "", "garbage"]) {
    assert.equal(formatDateTime(bad, "en"), "—");
    assert.equal(formatDate(bad, "en"), "—");
    assert.equal(toISODate(bad), "");
  }
  assert.equal(formatDateTime(null, "en", "n/a"), "n/a");
});

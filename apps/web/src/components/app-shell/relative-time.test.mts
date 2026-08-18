import assert from "node:assert/strict";
import test from "node:test";
import { formatRelativeTime } from "./relative-time.ts";

const now = 2_000_000_000_000;
test("renders relative confirmed-block times", () => {
  assert.equal(formatRelativeTime((now - 5_000) / 1_000, now), "5 seconds ago");
  assert.equal(
    formatRelativeTime((now - 180_000) / 1_000, now),
    "3 minutes ago",
  );
  assert.equal(
    formatRelativeTime((now - 7_200_000) / 1_000, now),
    "2 hours ago",
  );
  assert.equal(
    formatRelativeTime((now - 1_209_600_000) / 1_000, now),
    "2 weeks ago",
  );
  assert.equal(
    formatRelativeTime((now - 2_592_000_000) / 1_000, now),
    "1 month ago",
  );
});
test("reports missing timestamps honestly", () => {
  assert.equal(formatRelativeTime(null, now), "Time unavailable");
});

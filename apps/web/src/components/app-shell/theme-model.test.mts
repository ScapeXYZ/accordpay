import assert from "node:assert/strict";
import test from "node:test";

import {
  nextTheme,
  resolveInitialTheme,
  themeInitializationScript,
  themeToggleLabel,
} from "./theme-model.ts";

test("stored theme takes precedence and persists through toggle choices", () => {
  assert.equal(resolveInitialTheme("dark", false), "dark");
  assert.equal(resolveInitialTheme("light", true), "light");
  assert.equal(nextTheme("dark"), "light");
});

test("system theme is the first-visit fallback", () => {
  assert.equal(resolveInitialTheme(null, true), "dark");
  assert.equal(resolveInitialTheme(null, false), "light");
});

test("theme toggle labels name the resulting accessible action", () => {
  assert.equal(themeToggleLabel("light"), "Switch to dark mode");
  assert.equal(themeToggleLabel("dark"), "Switch to light mode");
});

test("initialization runs before React and uses the same storage key", () => {
  assert.match(themeInitializationScript, /accordpay:theme/);
  assert.match(themeInitializationScript, /prefers-color-scheme: dark/);
  assert.match(themeInitializationScript, /documentElement\.dataset\.theme/);
});

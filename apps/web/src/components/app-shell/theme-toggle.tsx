"use client";

import { useSyncExternalStore } from "react";

import {
  nextTheme,
  resolveInitialTheme,
  themeToggleLabel,
  THEME_STORAGE_KEY,
  type Theme,
} from "./theme-model";
import styles from "./app-shell.module.css";

const THEME_EVENT = "accordpay-theme-change";

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function browserTheme(): Theme {
  const applied = document.documentElement.dataset.theme;
  if (applied === "light" || applied === "dark") return applied;
  return resolveInitialTheme(
    window.localStorage.getItem(THEME_STORAGE_KEY),
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
}

export function ThemeToggle() {
  const theme = useSyncExternalStore<Theme>(
    subscribe,
    browserTheme,
    () => "light",
  );

  function toggle() {
    const value = nextTheme(theme);
    document.documentElement.dataset.theme = value;
    document.documentElement.style.colorScheme = value;
    window.localStorage.setItem(THEME_STORAGE_KEY, value);
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  const dark = theme === "dark";
  return (
    <button
      className={styles.iconButton}
      type="button"
      onClick={toggle}
      aria-label={themeToggleLabel(theme)}
      title={themeToggleLabel(theme)}
    >
      {dark ? (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.4 15.2A8.5 8.5 0 0 1 8.8 3.6 8.5 8.5 0 1 0 20.4 15.2Z" />
        </svg>
      )}
    </button>
  );
}

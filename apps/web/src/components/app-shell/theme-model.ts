export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "accordpay:theme";

export function resolveInitialTheme(
  stored: string | null,
  prefersDark: boolean,
): Theme {
  if (stored === "light" || stored === "dark") return stored;
  return prefersDark ? "dark" : "light";
}

export function nextTheme(theme: Theme): Theme {
  return theme === "light" ? "dark" : "light";
}

export function themeToggleLabel(theme: Theme) {
  return theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
}

export const themeInitializationScript = `(function(){try{var k='${THEME_STORAGE_KEY}',s=localStorage.getItem(k),d=s==='dark'||(s!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.style.colorScheme=d?'dark':'light'}catch(e){document.documentElement.dataset.theme='light'}})();`;

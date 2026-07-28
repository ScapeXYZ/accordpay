export const colors = {
  pine: {
    950: "#092E25",
    800: "#0F493A",
    700: "#14614D",
    600: "#18745C",
    100: "#DDEFE8",
    50: "#F0F8F5",
  },
  ink: {
    950: "#101815",
    700: "#34433E",
    600: "#52615C",
    500: "#6C7975",
    300: "#A9B3AF",
    200: "#CDD5D2",
    100: "#E5EAE8",
    50: "#F4F6F5",
  },
  white: "#FFFFFF",
  info: { 700: "#175A9C", 50: "#EDF6FF" },
  warning: { 700: "#8A5600", 50: "#FFF7E6" },
  error: { 700: "#A33434", 50: "#FFF0F0" },
  success: { 700: "#197044", 50: "#ECF8F1" },
} as const;

export const spacing = {
  0: "0",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
} as const;

export const radii = {
  none: "0",
  sm: "0.375rem",
  md: "0.625rem",
  lg: "0.875rem",
  xl: "1.25rem",
  full: "999px",
} as const;

export const typography = {
  fontFamily: {
    sans: "Inter, Arial, Helvetica, sans-serif",
    mono: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
  },
  fontSize: {
    caption: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.375rem",
    "2xl": "1.75rem",
    "3xl": "2.25rem",
    "4xl": "3rem",
  },
  lineHeight: {
    caption: "1rem",
    sm: "1.25rem",
    base: "1.5rem",
    lg: "1.75rem",
    xl: "1.875rem",
    "2xl": "2.25rem",
    "3xl": "2.75rem",
    "4xl": "3.5rem",
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  letterSpacing: {
    tight: "-0.025em",
    normal: "0",
    wide: "0.04em",
  },
  measure: {
    copy: "70ch",
  },
} as const;

export const shadows = {
  none: "none",
  1: "0 1px 2px rgb(16 24 21 / 6%), 0 4px 12px rgb(16 24 21 / 5%)",
  2: "0 8px 24px rgb(16 24 21 / 10%), 0 2px 6px rgb(16 24 21 / 6%)",
  3: "0 20px 48px rgb(16 24 21 / 16%), 0 6px 16px rgb(16 24 21 / 8%)",
} as const;

export const motion = {
  duration: {
    instant: "0ms",
    fast: "120ms",
    standard: "180ms",
    slow: "240ms",
  },
  easing: {
    standard: "cubic-bezier(0.2, 0, 0, 1)",
    out: "cubic-bezier(0, 0, 0, 1)",
  },
} as const;

export const containers = {
  reading: "45rem",
  content: "75rem",
  wide: "90rem",
  gutter: {
    mobile: "1rem",
    tablet: "1.5rem",
    desktop: "2rem",
  },
} as const;

export const grid = {
  columns: {
    mobile: 4,
    tablet: 8,
    desktop: 12,
  },
  gap: {
    mobile: "1rem",
    tablet: "1.25rem",
    desktop: "1.5rem",
  },
} as const;

export const breakpoints = {
  sm: "30rem",
  md: "48rem",
  lg: "64rem",
  xl: "80rem",
  "2xl": "96rem",
} as const;

export const designTokens = {
  colors,
  spacing,
  radii,
  typography,
  shadows,
  motion,
  containers,
  grid,
  breakpoints,
} as const;

export type DesignTokens = typeof designTokens;

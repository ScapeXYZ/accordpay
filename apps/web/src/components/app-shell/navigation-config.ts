export const applicationNavigation = [
  { label: "Dashboard", href: "/app", shortLabel: "Home" },
  { label: "Agreements", href: "/app/agreements", shortLabel: "Agreements" },
  { label: "Create Escrow", href: "/app/create", shortLabel: "Create" },
  {
    label: "Transactions",
    href: "/app/transactions",
    shortLabel: "Transactions",
  },
  { label: "Activity", href: "/app/activity", shortLabel: "Activity" },
  { label: "Settings", href: "/app/settings", shortLabel: "Settings" },
] as const;

export const mobilePrimaryHrefs = [
  "/app",
  "/app/agreements",
  "/app/create",
  "/app/activity",
] as const;

export const applicationNavigation = [
  { label: "Services", href: "/app", shortLabel: "Services" },
  { label: "Overview", href: "/app/overview", shortLabel: "Overview" },
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
  "/app/overview",
  "/app/agreements",
  "/app/activity",
] as const;

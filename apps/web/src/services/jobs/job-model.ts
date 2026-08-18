export const jobCategories = [
  "Web Development",
  "Design",
  "Writing",
  "Marketing",
  "Blockchain",
  "Video Editing",
  "Data Entry",
  "Mobile Development",
] as const;

export type JobBudgetType = "fixed" | "hourly";
export type JobStatus =
  "draft" | "open" | "in_discussion" | "assigned" | "closed" | "cancelled";

export type MarketplaceJob = {
  id: string;
  clientWallet: `0x${string}`;
  clientDisplayName: string | null;
  clientIdentity: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  category: string;
  skills: string[];
  budgetAmount: string;
  budgetType: JobBudgetType;
  currency: "Test ETH";
  deadline: string;
  status: JobStatus;
  proposalCount: number;
  isDemo: boolean;
  createdAt: string;
};

const protectedJobIdentityNames = new Set([
  "accordpay support",
  "support",
  "designated testnet resolver",
  "accordpay resolver",
  "administrator",
  "admin",
]);

export function resolveJobClientIdentity(
  walletAddress: string,
  displayName?: string | null,
) {
  const normalizedName = displayName?.trim();
  if (
    normalizedName &&
    !protectedJobIdentityNames.has(normalizedName.toLowerCase())
  ) {
    return normalizedName;
  }
  return `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`;
}

export function parsePositiveBudget(value: string) {
  const normalized = value.trim();
  if (!/^\d+(?:\.\d{1,8})?$/.test(normalized) || Number(normalized) <= 0) {
    return { valid: false as const, error: "Enter a positive budget amount." };
  }
  return { valid: true as const, value: normalized };
}

export function parseSkills(value: unknown) {
  const skills = Array.isArray(value)
    ? value.map(String)
    : typeof value === "string"
      ? value.split(",")
      : [];
  const normalized = [
    ...new Set(skills.map((skill) => skill.trim()).filter(Boolean)),
  ];
  if (normalized.length < 1 || normalized.length > 20) {
    return {
      valid: false as const,
      error: "Provide between 1 and 20 required skills.",
    };
  }
  if (normalized.some((skill) => skill.length > 48)) {
    return {
      valid: false as const,
      error: "Each skill must be 48 characters or fewer.",
    };
  }
  return { valid: true as const, value: normalized };
}

export function validateJobDraft(input: Record<string, unknown>) {
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const description =
    typeof input.description === "string" ? input.description.trim() : "";
  const category =
    typeof input.category === "string" ? input.category.trim() : "";
  const budgetType = input.budgetType;
  const deadlineText =
    typeof input.deadline === "string" ? input.deadline.trim() : "";
  const visibility = input.visibility === "private" ? "private" : "public";
  const budget = parsePositiveBudget(String(input.budgetAmount ?? ""));
  const skills = parseSkills(input.skills);
  if (title.length < 5 || title.length > 120) {
    return { valid: false as const, error: "Use a 5–120 character job title." };
  }
  if (description.length < 50 || description.length > 8000) {
    return {
      valid: false as const,
      error: "Use a 50–8,000 character job description.",
    };
  }
  if (!jobCategories.includes(category as (typeof jobCategories)[number])) {
    return { valid: false as const, error: "Choose a supported category." };
  }
  if (!budget.valid) return budget;
  if (budgetType !== "fixed" && budgetType !== "hourly") {
    return { valid: false as const, error: "Choose Fixed or Hourly." };
  }
  if (!skills.valid) return skills;
  const deadline = new Date(deadlineText);
  if (
    !deadlineText ||
    Number.isNaN(deadline.getTime()) ||
    deadline <= new Date()
  ) {
    return { valid: false as const, error: "Choose a future deadline." };
  }
  if (input.confirmed !== true) {
    return {
      valid: false as const,
      error: "Confirm the job information before publishing.",
    };
  }
  return {
    valid: true as const,
    value: {
      title,
      description,
      shortDescription:
        description.length > 237
          ? `${description.slice(0, 237)}…`
          : description,
      category,
      skills: skills.value,
      budgetAmount: budget.value,
      budgetType,
      deadline,
      visibility,
    },
  };
}

export function jobMatchesFilters(
  job: MarketplaceJob,
  input: {
    search: string;
    category: string;
    budgetType: string;
    minimumBudget: number;
    openOnly: boolean;
  },
) {
  const search = input.search.trim().toLowerCase();
  return (
    (!search ||
      [job.title, job.shortDescription, job.category, ...job.skills]
        .join(" ")
        .toLowerCase()
        .includes(search)) &&
    (!input.category || job.category === input.category) &&
    (!input.budgetType || job.budgetType === input.budgetType) &&
    Number(job.budgetAmount) >= input.minimumBudget &&
    (!input.openOnly || job.status === "open")
  );
}

export function jobSlug(title: string) {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return base || "accordpay-job";
}

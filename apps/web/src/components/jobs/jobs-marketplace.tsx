"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Badge,
  Button,
  Card,
  Input,
  Select,
  Skeleton,
} from "@/components/ui";
import { AccordIdentity } from "@/components/deal-room/accord-identity";
import {
  jobCategories,
  jobMatchesFilters,
  type MarketplaceJob,
} from "@/services/jobs/job-model";

import styles from "./jobs.module.css";

export function JobsMarketplace() {
  const [jobs, setJobs] = useState<MarketplaceJob[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [budgetType, setBudgetType] = useState("");
  const [minimumBudget, setMinimumBudget] = useState("0");
  const [sort, setSort] = useState("newest");
  const [openOnly, setOpenOnly] = useState(true);

  async function load() {
    setState("loading");
    try {
      const response = await fetch("/api/jobs", { cache: "no-store" });
      const body = (await response.json()) as { jobs?: MarketplaceJob[] };
      if (!response.ok) throw new Error();
      setJobs(body.jobs ?? []);
      setState("ready");
    } catch {
      setState("error");
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const visible = useMemo(() => {
    const filtered = jobs.filter((job) =>
      jobMatchesFilters(job, {
        search,
        category,
        budgetType,
        minimumBudget: Number(minimumBudget || 0),
        openOnly,
      }),
    );
    return filtered.sort((a, b) =>
      sort === "budget"
        ? Number(b.budgetAmount) - Number(a.budgetAmount)
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [budgetType, category, jobs, minimumBudget, openOnly, search, sort]);

  if (state === "error") {
    return (
      <Alert
        variant="error"
        title="Jobs unavailable"
        description="The marketplace could not be loaded."
        action={<Button onClick={() => void load()}>Retry</Button>}
      />
    );
  }

  return (
    <>
      <section className={styles.filters} aria-label="Job filters">
        <Input
          type="search"
          label="Search jobs"
          placeholder="Title, skill, or category"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select
          label="Category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          placeholder="All categories"
          options={jobCategories.map((item) => ({ label: item, value: item }))}
        />
        <Select
          label="Budget type"
          value={budgetType}
          onChange={(event) => setBudgetType(event.target.value)}
          placeholder="Fixed or hourly"
          options={[
            { label: "Fixed", value: "fixed" },
            { label: "Hourly", value: "hourly" },
          ]}
        />
        <Input
          type="number"
          min="0"
          step="0.01"
          label="Minimum budget"
          suffix="Test ETH"
          value={minimumBudget}
          onChange={(event) => setMinimumBudget(event.target.value)}
        />
        <Select
          label="Sort"
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          options={[
            { label: "Newest first", value: "newest" },
            { label: "Highest budget", value: "budget" },
          ]}
        />
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={openOnly}
            onChange={(event) => setOpenOnly(event.target.checked)}
          />
          Open jobs only
        </label>
      </section>
      {state === "loading" ? (
        <div className={styles.grid} aria-label="Loading jobs">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} variant="card" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card variant="tinted">
          <h2>No jobs match these filters</h2>
          <p>Clear one or more filters to see available work.</p>
        </Card>
      ) : (
        <div className={styles.grid}>
          {visible.map((job) => (
            <Card key={job.id} variant="interactive" className={styles.jobCard}>
              <div className={styles.cardTop}>
                <Badge status="funded">Open</Badge>
                {job.isDemo ? <Badge status="testnet">Demo job</Badge> : null}
              </div>
              <h2>{job.title}</h2>
              <span>{job.category}</span>
              <p>{job.shortDescription}</p>
              <AccordIdentity
                address={job.clientWallet}
                displayName={job.clientDisplayName}
                role="Buyer"
              />
              <div className={styles.skills}>
                {job.skills.slice(0, 4).map((skill) => (
                  <span key={skill} className={styles.skill}>
                    {skill}
                  </span>
                ))}
              </div>
              <div className={styles.meta}>
                <strong>
                  {job.budgetAmount} Test ETH ·{" "}
                  {job.budgetType === "fixed" ? "Fixed" : "Hourly"}
                </strong>
                <span>{job.proposalCount} conversations</span>
              </div>
              <span>
                Deadline {new Date(job.deadline).toLocaleDateString()} · Posted{" "}
                {new Date(job.createdAt).toLocaleDateString()}
              </span>
              <Button href={`/app/jobs/${job.id}`}>View job</Button>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

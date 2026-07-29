"use client";

import { useState } from "react";
import { isAddress } from "viem";

import { Container, Grid, PageHeader, Stack } from "@/components/layout";
import { Web3Identity } from "@/components/shared/web3-identity";
import { Alert, Button, Card, Input } from "@/components/ui";
import { useUpbitName } from "@/hooks/use-upbit-name";
import { isUpbitName } from "@/services/names";

import styles from "./upbit-name-review.module.css";

const statuses = [
  ["Resolving", "A lookup is in progress."],
  ["Name confirmed", "Forward and reverse records agree."],
  ["No name found", "No record was returned; ownership is not judged invalid."],
  [
    "Resolution unavailable",
    "The resolver or configured RPC could not respond.",
  ],
  ["Name/address mismatch", "Forward and reverse records do not agree."],
] as const;

export default function UpbitNameReviewPage() {
  const [query, setQuery] = useState("");
  const resolution = useUpbitName(query);
  const isValidQuery = isAddress(query.trim()) || isUpbitName(query);

  return (
    <main id="main-content">
      <Container size="wide">
        <Stack gap={8}>
          <PageHeader
            eyebrow="Private identity review"
            title="Upbit Web3 Names"
            description="Internal review — live resolver output only. State examples below are labels, not fabricated identities."
          />
          <Alert
            variant="warning"
            title="Canonical identity remains the wallet address"
            description="AccordPay displays a UP ID only after matching forward and reverse resolution. Dojang verification is evaluated independently."
          />
          <Card variant="elevated">
            <Stack gap={4}>
              <Input
                label="Live wallet address or username.up.id"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                helperText="Uses the configured server-side Ethereum ENS resolver. No wallet request is made."
              />
              {isAddress(query.trim()) ? (
                <Web3Identity address={query.trim()} label="Live identity" />
              ) : (
                <p aria-live="polite">
                  {!query
                    ? "Enter a real address or UP ID."
                    : resolution.state === "resolving"
                      ? "Resolving"
                      : resolution.result.status === "confirmed"
                        ? `${resolution.result.name} resolves to ${resolution.result.address}.`
                        : resolution.result.status === "not-found"
                          ? "No name found"
                          : resolution.result.status === "mismatch"
                            ? "Name/address mismatch"
                            : resolution.result.message}
                </p>
              )}
              <Button
                type="button"
                variant="secondary"
                disabled={!isValidQuery}
                onClick={() => void resolution.refetch()}
              >
                Refresh name
              </Button>
            </Stack>
          </Card>
          <section aria-labelledby="state-examples">
            <h2 id="state-examples">Resolution state examples</h2>
            <Grid columns={2}>
              {statuses.map(([title, description]) => (
                <Card key={title}>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </Card>
              ))}
            </Grid>
          </section>
          <section className={styles.responsive}>
            <Card>
              <h2>Desktop presentation</h2>
              <p>
                Name, shortened canonical address, independent Dojang badge,
                copy, and refresh controls align horizontally where space
                permits.
              </p>
            </Card>
            <Card>
              <h2>Mobile presentation</h2>
              <p>
                The same identity wraps without truncating the copyable full
                address or merging name and verification state.
              </p>
            </Card>
          </section>
          <Card variant="tinted">
            <Stack gap={3}>
              <h2>Official issuance</h2>
              <p>
                Complete or issue Dojang, claim VerifiedToken, issue an UP ID,
                and sign every required transaction through the official GIWA
                surface. AccordPay does not issue or sell names.
              </p>
              <Button
                href="https://sepolia-playground.giwa.io/"
                target="_blank"
              >
                Get an Upbit Web3 Name
              </Button>
            </Stack>
          </Card>
        </Stack>
      </Container>
    </main>
  );
}

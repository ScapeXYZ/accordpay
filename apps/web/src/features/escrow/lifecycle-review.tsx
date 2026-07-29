"use client";

import { useReadContract } from "wagmi";

import { Grid, Stack } from "@/components/layout";
import { WatermarkSurface } from "@/components/shared";
import { TransactionStatus } from "@/components/web3";
import { Alert, Badge, Card } from "@/components/ui";
import { accordPayEscrowContract } from "@/config/contracts";
import { giwaSepolia } from "@/config/web3";

import { EscrowReader } from "./escrow-reader";
import styles from "./escrow.module.css";

const roleMatrix = [
  ["Create and fund", "Buyer", "New escrow"],
  ["Mark delivered", "Seller", "Funded"],
  ["Release funds", "Buyer", "Delivered"],
  ["Approve refund", "Seller", "Funded or Delivered"],
  ["Reclaim after deadline", "Buyer", "Funded and deadline passed"],
  ["Raise dispute", "Buyer or Seller", "Funded or Delivered"],
  ["Resolve dispute", "Resolver", "Disputed"],
] as const;

const lifecycleChecklist = [
  "Connect the buyer wallet and confirm GIWA Sepolia chain ID 91342.",
  "Create and fund an escrow with the seller wallet and future deadline.",
  "Record the EscrowCreated ID and creation transaction link.",
  "Open the escrow directly and verify buyer, seller, amount and metadata.",
  "Connect the seller wallet and mark delivery with a public evidence URI.",
  "Reconnect the buyer wallet and release funds after delivery.",
  "Repeat with a separate escrow to validate seller-approved refund.",
  "Repeat with a separate escrow to raise and resolve a dispute.",
  "Validate deadline reclaim using a Funded escrow after its deadline.",
] as const;

export function LifecycleReview() {
  const totalQuery = useReadContract({
    ...accordPayEscrowContract,
    functionName: "totalEscrows",
    chainId: giwaSepolia.id,
    query: { retry: 1 },
  });
  const resolverQuery = useReadContract({
    ...accordPayEscrowContract,
    functionName: "resolver",
    chainId: giwaSepolia.id,
    query: { retry: 1 },
  });

  return (
    <Stack gap={8}>
      <WatermarkSurface variant="lockup" position="bottom-right" opacity={0.02}>
        <div className={styles.reviewWatermarkPanel}>
          <Badge status="testnet">Private lifecycle review</Badge>
          <p>Live contract validation workspace</p>
        </div>
      </WatermarkSurface>

      <Card variant="tinted">
        <Stack gap={4}>
          <h2 className={styles.reviewHeading}>Current configuration</h2>
          <dl className={styles.reviewConfiguration}>
            <div>
              <dt>Network</dt>
              <dd>{accordPayEscrowContract.networkName}</dd>
            </div>
            <div>
              <dt>Chain ID</dt>
              <dd>{accordPayEscrowContract.chainId}</dd>
            </div>
            <div>
              <dt>Contract</dt>
              <dd>{accordPayEscrowContract.address}</dd>
            </div>
            <div>
              <dt>Live totalEscrows</dt>
              <dd>
                {totalQuery.isPending
                  ? "Loading…"
                  : totalQuery.error
                    ? "RPC unavailable"
                    : (totalQuery.data as bigint).toString()}
              </dd>
            </div>
            <div>
              <dt>Resolver</dt>
              <dd>
                {resolverQuery.isPending
                  ? "Loading…"
                  : resolverQuery.error
                    ? "RPC unavailable"
                    : String(resolverQuery.data)}
              </dd>
            </div>
          </dl>
        </Stack>
      </Card>

      <section aria-labelledby="review-lookup">
        <Stack gap={4}>
          <h2 id="review-lookup" className={styles.reviewHeading}>
            Read-only escrow lookup
          </h2>
          <EscrowReader readOnly />
        </Stack>
      </section>

      <section aria-labelledby="role-matrix">
        <Stack gap={4}>
          <h2 id="role-matrix" className={styles.reviewHeading}>
            Role and action matrix
          </h2>
          <div className={styles.roleMatrix}>
            <table>
              <thead>
                <tr>
                  <th scope="col">Action</th>
                  <th scope="col">Role</th>
                  <th scope="col">Required state</th>
                </tr>
              </thead>
              <tbody>
                {roleMatrix.map(([action, role, state]) => (
                  <tr key={action}>
                    <th scope="row">{action}</th>
                    <td>{role}</td>
                    <td>{state}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Stack>
      </section>

      <section aria-labelledby="transaction-examples">
        <Stack gap={4}>
          <div>
            <h2 id="transaction-examples" className={styles.reviewHeading}>
              Transaction-state examples
            </h2>
            <p className={styles.reviewCopy}>
              Interface examples only—no hashes or transactions are fabricated.
            </p>
          </div>
          <Grid columns={2}>
            <TransactionStatus
              transaction={{
                phase: "awaitingSignature",
                confirmations: 0,
              }}
            />
            <TransactionStatus
              transaction={{ phase: "submitted", confirmations: 0 }}
            />
            <TransactionStatus
              transaction={{ phase: "confirmed", confirmations: 1 }}
            />
            <TransactionStatus
              transaction={{
                phase: "error",
                confirmations: 0,
                errorKind: "walletRejected",
                error:
                  "The wallet request was rejected. No transaction was submitted.",
              }}
            />
          </Grid>
        </Stack>
      </section>

      <section aria-labelledby="manual-checklist">
        <Card>
          <Stack gap={4}>
            <h2 id="manual-checklist" className={styles.reviewHeading}>
              Manual lifecycle checklist
            </h2>
            <ol className={styles.lifecycleChecklist}>
              {lifecycleChecklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </Stack>
        </Card>
      </section>

      <Alert
        variant="warning"
        title="Testnet validation only"
        description="The deployed contract is verified but not independently audited. Production use and real funds are prohibited."
      />
    </Stack>
  );
}

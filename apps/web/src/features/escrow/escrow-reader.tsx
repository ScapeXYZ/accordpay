"use client";

import { useState } from "react";
import { formatEther } from "viem";
import { useConnection, useReadContract } from "wagmi";

import { Stack } from "@/components/layout";
import { TransactionStatus, WalletControl } from "@/components/web3";
import { Alert, Badge, Button, Card, Input } from "@/components/ui";
import { accordPayEscrowContract } from "@/config/contracts";
import { giwaSepolia } from "@/config/web3";

import { useEscrowTransaction } from "./use-escrow-transaction";
import styles from "./escrow.module.css";

type EscrowRecord = {
  id: bigint;
  buyer: `0x${string}`;
  seller: `0x${string}`;
  amount: bigint;
  deadline: bigint;
  status: number;
  metadataURI: string;
  deliveryURI: string;
  createdAt: bigint;
  deliveredAt: bigint;
  completedAt: bigint;
};

const statuses = [
  "funded",
  "delivered",
  "completed",
  "refunded",
  "disputed",
] as const;

function shortAddress(address: string) {
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
}

export function EscrowReader({ initialId }: { initialId?: string }) {
  const validInitialId =
    initialId && /^[1-9]\d*$/.test(initialId) ? initialId : undefined;
  const [inputId, setInputId] = useState(validInitialId ?? "1");
  const [escrowId, setEscrowId] = useState<bigint | undefined>(
    validInitialId ? BigInt(validInitialId) : undefined,
  );
  const [deliveryURI, setDeliveryURI] = useState("");
  const [buyerShare, setBuyerShare] = useState("5000");
  const connection = useConnection();

  const escrowQuery = useReadContract({
    ...accordPayEscrowContract,
    functionName: "getEscrow",
    args: escrowId ? [escrowId] : undefined,
    chainId: giwaSepolia.id,
    query: { enabled: escrowId !== undefined },
  });
  const resolverQuery = useReadContract({
    ...accordPayEscrowContract,
    functionName: "resolver",
    chainId: giwaSepolia.id,
  });
  const totalQuery = useReadContract({
    ...accordPayEscrowContract,
    functionName: "totalEscrows",
    chainId: giwaSepolia.id,
  });
  const action = useEscrowTransaction(async () => {
    await escrowQuery.refetch();
  });

  const escrow = escrowQuery.data as EscrowRecord | undefined;
  const resolver = resolverQuery.data as `0x${string}` | undefined;
  const address = connection.address?.toLowerCase();
  const isBuyer = escrow?.buyer.toLowerCase() === address;
  const isSeller = escrow?.seller.toLowerCase() === address;
  const isResolver = resolver?.toLowerCase() === address;
  const status = escrow ? statuses[escrow.status] : undefined;

  return (
    <Stack gap={6}>
      <Card>
        <p className={styles.contractSummary}>
          Total escrows created:{" "}
          {totalQuery.data === undefined
            ? "Loading from GIWA…"
            : (totalQuery.data as bigint).toString()}
        </p>
        <form
          className={styles.lookup}
          onSubmit={(event) => {
            event.preventDefault();
            if (/^[1-9]\d*$/.test(inputId)) setEscrowId(BigInt(inputId));
          }}
        >
          <Input
            label="Escrow ID"
            type="number"
            min="1"
            step="1"
            value={inputId}
            onChange={(event) => setInputId(event.target.value)}
            helperText="Enter the numeric on-chain ID, for example 1."
            required
          />
          <Button type="submit" loading={escrowQuery.isFetching}>
            Read from GIWA
          </Button>
        </form>
      </Card>

      {escrowQuery.error && (
        <Alert
          variant="error"
          title="Escrow could not be loaded"
          description="The ID may not exist, or the GIWA RPC may be unavailable."
        />
      )}

      {escrow && status && (
        <Card variant="elevated">
          <Stack gap={5}>
            <div className={styles.heading}>
              <div>
                <span className={styles.eyebrow}>
                  ACP-{escrow.id.toString().padStart(6, "0")}
                </span>
                <h2>On-chain escrow</h2>
              </div>
              <Badge status={status} />
            </div>
            <dl className={styles.details}>
              <div>
                <dt>Buyer</dt>
                <dd title={escrow.buyer}>{shortAddress(escrow.buyer)}</dd>
              </div>
              <div>
                <dt>Seller</dt>
                <dd title={escrow.seller}>{shortAddress(escrow.seller)}</dd>
              </div>
              <div>
                <dt>Amount</dt>
                <dd>{formatEther(escrow.amount)} Test ETH</dd>
              </div>
              <div>
                <dt>Deadline</dt>
                <dd>
                  {new Date(Number(escrow.deadline) * 1000).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt>Agreement reference</dt>
                <dd className={styles.uri}>{escrow.metadataURI}</dd>
              </div>
              <div>
                <dt>Delivery reference</dt>
                <dd className={styles.uri}>
                  {escrow.deliveryURI || "Not marked"}
                </dd>
              </div>
            </dl>

            {connection.status !== "connected" ? (
              <div className={styles.actionPanel}>
                <p>
                  Connect the participating wallet to access permitted actions.
                </p>
                <WalletControl />
              </div>
            ) : (
              <div className={styles.actions}>
                {isSeller && status === "funded" && (
                  <>
                    <Input
                      label="Delivery evidence URI"
                      value={deliveryURI}
                      onChange={(event) => setDeliveryURI(event.target.value)}
                      placeholder="ipfs://…"
                      required
                    />
                    <Button
                      disabled={!deliveryURI}
                      loading={action.isPending}
                      onClick={() =>
                        action.execute({
                          functionName: "markDelivered",
                          args: [escrow.id, deliveryURI],
                        })
                      }
                    >
                      Mark delivered
                    </Button>
                  </>
                )}
                {isBuyer && status === "delivered" && (
                  <Button
                    loading={action.isPending}
                    onClick={() =>
                      action.execute({
                        functionName: "releaseFunds",
                        args: [escrow.id],
                      })
                    }
                  >
                    Release funds
                  </Button>
                )}
                {isSeller &&
                  (status === "funded" || status === "delivered") && (
                    <Button
                      variant="secondary"
                      loading={action.isPending}
                      onClick={() =>
                        action.execute({
                          functionName: "approveRefund",
                          args: [escrow.id],
                        })
                      }
                    >
                      Approve refund
                    </Button>
                  )}
                {(isBuyer || isSeller) &&
                  (status === "funded" || status === "delivered") && (
                    <Button
                      variant="destructive"
                      loading={action.isPending}
                      onClick={() =>
                        action.execute({
                          functionName: "raiseDispute",
                          args: [escrow.id],
                        })
                      }
                    >
                      Raise dispute
                    </Button>
                  )}
                {isResolver && status === "disputed" && (
                  <>
                    <Input
                      label="Buyer share"
                      type="number"
                      min="0"
                      max="10000"
                      suffix="bps"
                      value={buyerShare}
                      onChange={(event) => setBuyerShare(event.target.value)}
                    />
                    <Button
                      loading={action.isPending}
                      onClick={() =>
                        action.execute({
                          functionName: "resolveDispute",
                          args: [escrow.id, Number(buyerShare)],
                        })
                      }
                    >
                      Resolve dispute
                    </Button>
                  </>
                )}
                {!isBuyer && !isSeller && !isResolver && (
                  <p>This wallet has no action permission for this escrow.</p>
                )}
              </div>
            )}
            <TransactionStatus transaction={action.transaction} />
          </Stack>
        </Card>
      )}
    </Stack>
  );
}

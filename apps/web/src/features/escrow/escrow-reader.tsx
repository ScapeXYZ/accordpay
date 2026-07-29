"use client";

import { useEffect, useState } from "react";
import { formatEther } from "viem";
import { useConnection, useReadContract } from "wagmi";

import { Stack } from "@/components/layout";
import { Web3Identity } from "@/components/shared/web3-identity";
import { TransactionStatus, WalletControl } from "@/components/web3";
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmationDialog,
  Input,
} from "@/components/ui";
import { accordPayEscrowContract } from "@/config/contracts";
import { giwaSepolia } from "@/config/web3";

import { useEscrowTransaction } from "./use-escrow-transaction";
import {
  buildApproveRefundRequest,
  buildMarkDeliveredRequest,
  decodeEscrowStatus,
  escrowActionFunctions,
} from "./escrow-lifecycle";
import styles from "./escrow.module.css";

export type EscrowRecord = {
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

function formatTimestamp(value: bigint) {
  if (value === BigInt(0)) return "Not recorded";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(Number(value) * 1000));
}

function explorerAddress(address: string) {
  return `${giwaSepolia.blockExplorers.default.url}/address/${address}`;
}

export function EscrowReader({
  initialId,
  readOnly = false,
  showTotal = true,
}: {
  initialId?: string;
  readOnly?: boolean;
  showTotal?: boolean;
}) {
  const validInitialId =
    initialId && /^[1-9]\d*$/.test(initialId) ? initialId : undefined;
  const [inputId, setInputId] = useState(validInitialId ?? "1");
  const [escrowId, setEscrowId] = useState<bigint | undefined>(
    validInitialId ? BigInt(validInitialId) : undefined,
  );
  const [deliveryURI, setDeliveryURI] = useState("");
  const [buyerShare, setBuyerShare] = useState("5000");
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const connection = useConnection();

  useEffect(() => {
    const timer = window.setInterval(
      () => setNow(Math.floor(Date.now() / 1000)),
      30_000,
    );
    return () => window.clearInterval(timer);
  }, []);

  const escrowQuery = useReadContract({
    ...accordPayEscrowContract,
    functionName: "getEscrow",
    args: escrowId ? [escrowId] : undefined,
    chainId: giwaSepolia.id,
    query: { enabled: escrowId !== undefined, retry: 1 },
  });
  const resolverQuery = useReadContract({
    ...accordPayEscrowContract,
    functionName: "resolver",
    chainId: giwaSepolia.id,
    query: { retry: 1 },
  });
  const totalQuery = useReadContract({
    ...accordPayEscrowContract,
    functionName: "totalEscrows",
    chainId: giwaSepolia.id,
    query: { enabled: showTotal, retry: 1 },
  });
  const action = useEscrowTransaction(async () => {
    await Promise.all([escrowQuery.refetch(), resolverQuery.refetch()]);
  });

  const escrow = escrowQuery.data as EscrowRecord | undefined;
  const resolver = resolverQuery.data as `0x${string}` | undefined;
  const address = connection.address?.toLowerCase();
  const isBuyer = escrow?.buyer.toLowerCase() === address;
  const isSeller = escrow?.seller.toLowerCase() === address;
  const isResolver = resolver?.toLowerCase() === address;
  const status = escrow ? decodeEscrowStatus(escrow.status) : undefined;
  const connectedToGiwa =
    connection.status === "connected" && connection.chainId === giwaSepolia.id;
  const afterDeadline = escrow ? now > Number(escrow.deadline) : false;
  const canReclaim = isBuyer && status === "funded" && afterDeadline;
  const canAct =
    (isSeller && (status === "funded" || status === "delivered")) ||
    (isBuyer && (status === "delivered" || status === "funded")) ||
    (isResolver && status === "disputed");

  function submitLookup(event: React.FormEvent) {
    event.preventDefault();
    if (!/^[1-9]\d*$/.test(inputId)) return;
    setEscrowId(BigInt(inputId));
  }

  return (
    <Stack gap={6}>
      <Card>
        {showTotal && (
          <p className={styles.contractSummary}>
            Live total escrows:{" "}
            {totalQuery.isPending
              ? "Loading from GIWA…"
              : totalQuery.error
                ? "Unavailable"
                : (totalQuery.data as bigint).toString()}
          </p>
        )}
        <form className={styles.lookup} onSubmit={submitLookup}>
          <Input
            label="Escrow ID"
            type="number"
            min="1"
            step="1"
            value={inputId}
            onChange={(event) => setInputId(event.target.value)}
            helperText="Enter the numeric on-chain escrow ID."
            required
          />
          <Button type="submit" loading={escrowQuery.isFetching}>
            Read from GIWA
          </Button>
        </form>
      </Card>

      {escrowQuery.isPending && escrowId !== undefined && (
        <Alert
          variant="info"
          title="Loading escrow"
          description={`Reading escrow ${escrowId.toString()} from GIWA Sepolia.`}
        />
      )}

      {escrowQuery.error && (
        <Alert
          variant="error"
          title="Escrow data unavailable"
          description="The escrow ID may not exist, the deployed contract may have rejected the read, or the GIWA Sepolia RPC may be unavailable. Check the ID and try again."
          action={
            <Button variant="ghost" onClick={() => escrowQuery.refetch()}>
              Retry read
            </Button>
          }
        />
      )}

      {escrow && status && (
        <Card variant="elevated">
          <Stack gap={5}>
            <div className={styles.heading}>
              <div>
                <span className={styles.eyebrow}>Live GIWA Sepolia escrow</span>
                <h2>ACP-{escrow.id.toString().padStart(6, "0")}</h2>
                <p className={styles.numericId}>
                  Numeric escrow ID: {escrow.id.toString()}
                </p>
              </div>
              <Badge status={status} />
            </div>

            <dl className={styles.details}>
              <div>
                <dt>Buyer</dt>
                <dd>
                  <Web3Identity address={escrow.buyer} />
                  <a
                    href={explorerAddress(escrow.buyer)}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    View buyer on GIWA Explorer
                  </a>
                </dd>
              </div>
              <div>
                <dt>Seller</dt>
                <dd>
                  <Web3Identity address={escrow.seller} />
                  <a
                    href={explorerAddress(escrow.seller)}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    View seller on GIWA Explorer
                  </a>
                </dd>
              </div>
              <div>
                <dt>Amount</dt>
                <dd>{formatEther(escrow.amount)} Test ETH</dd>
              </div>
              <div>
                <dt>Current state</dt>
                <dd>{status[0].toUpperCase() + status.slice(1)}</dd>
              </div>
              <div>
                <dt>Deadline</dt>
                <dd>{formatTimestamp(escrow.deadline)}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{formatTimestamp(escrow.createdAt)}</dd>
              </div>
              <div>
                <dt>Delivered</dt>
                <dd>{formatTimestamp(escrow.deliveredAt)}</dd>
              </div>
              <div>
                <dt>Finalized</dt>
                <dd>{formatTimestamp(escrow.completedAt)}</dd>
              </div>
              <div className={styles.fullDetail}>
                <dt>Metadata URI</dt>
                <dd className={styles.uri}>{escrow.metadataURI}</dd>
              </div>
              <div className={styles.fullDetail}>
                <dt>Delivery evidence URI</dt>
                <dd className={styles.uri}>
                  {escrow.deliveryURI || "Not submitted"}
                </dd>
              </div>
              <div className={styles.fullDetail}>
                <dt>Contract</dt>
                <dd>
                  <a
                    href={explorerAddress(accordPayEscrowContract.address)}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {accordPayEscrowContract.address}
                  </a>
                </dd>
              </div>
            </dl>

            {!readOnly && (
              <>
                {!connectedToGiwa ? (
                  <div className={styles.actionPanel}>
                    <div>
                      <strong>Wallet action unavailable</strong>
                      <p>
                        Connect the buyer, seller, or resolver wallet on GIWA
                        Sepolia to see its permitted actions.
                      </p>
                    </div>
                    <WalletControl />
                  </div>
                ) : (
                  <div className={styles.actionPanel}>
                    <div className={styles.actionIntro}>
                      <strong>Available actions</strong>
                      <p>
                        {canAct
                          ? "Only actions allowed for this wallet and current contract state are enabled."
                          : status === "completed" || status === "refunded"
                            ? "This escrow is final and cannot transition again."
                            : "The connected wallet has no permitted action in this escrow state."}
                      </p>
                    </div>
                    <div className={styles.actions}>
                      {isSeller && status === "funded" && (
                        <>
                          <Input
                            label="Delivery evidence URI"
                            value={deliveryURI}
                            onChange={(event) =>
                              setDeliveryURI(event.target.value)
                            }
                            placeholder="ipfs://…"
                            helperText="Public reference only. Do not publish confidential evidence."
                            required
                          />
                          <Button
                            disabled={!deliveryURI || action.isPending}
                            loading={action.isPending}
                            onClick={() =>
                              action.execute(
                                buildMarkDeliveredRequest(
                                  escrow.id,
                                  deliveryURI,
                                ),
                              )
                            }
                          >
                            Mark delivered
                          </Button>
                        </>
                      )}
                      {isBuyer && status === "delivered" && (
                        <Button
                          disabled={action.isPending}
                          loading={action.isPending}
                          onClick={() =>
                            action.execute({
                              functionName: escrowActionFunctions.releaseFunds,
                              args: [escrow.id],
                            })
                          }
                        >
                          Release funds
                        </Button>
                      )}
                      {isSeller &&
                        (status === "funded" || status === "delivered") && (
                          <>
                            {action.isPending ? (
                              <Button
                                variant="secondary"
                                disabled
                                loading
                                loadingText="Transaction pending"
                              >
                                Approve refund
                              </Button>
                            ) : (
                              <ConfirmationDialog
                                triggerLabel="Approve refund"
                                title="Refund this escrow?"
                                description={`This is a separate, irreversible transaction. It will move escrow ${escrow.id.toString()} to Refunded and return the full deposit to the buyer.`}
                                confirmLabel="Approve full refund"
                                destructive
                                onConfirm={() =>
                                  action.execute(
                                    buildApproveRefundRequest(escrow.id),
                                  )
                                }
                              />
                            )}
                          </>
                        )}
                      {(isBuyer || isSeller) &&
                        (status === "funded" || status === "delivered") && (
                          <Button
                            variant="destructive"
                            disabled={action.isPending}
                            loading={action.isPending}
                            onClick={() =>
                              action.execute({
                                functionName:
                                  escrowActionFunctions.raiseDispute,
                                args: [escrow.id],
                              })
                            }
                          >
                            Raise dispute
                          </Button>
                        )}
                      {isBuyer && status === "funded" && (
                        <Button
                          variant="secondary"
                          disabled={!canReclaim || action.isPending}
                          loading={action.isPending}
                          onClick={() =>
                            action.execute({
                              functionName:
                                escrowActionFunctions.reclaimAfterDeadline,
                              args: [escrow.id],
                            })
                          }
                        >
                          Reclaim after deadline
                        </Button>
                      )}
                      {isBuyer && status === "funded" && !afterDeadline && (
                        <p className={styles.actionReason}>
                          Deadline reclaim becomes available only after{" "}
                          {formatTimestamp(escrow.deadline)}.
                        </p>
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
                            onChange={(event) =>
                              setBuyerShare(event.target.value)
                            }
                            helperText="0 sends all funds to the seller; 10,000 sends all funds to the buyer."
                          />
                          <Button
                            disabled={
                              action.isPending ||
                              !/^\d+$/.test(buyerShare) ||
                              Number(buyerShare) > 10_000
                            }
                            loading={action.isPending}
                            onClick={() =>
                              action.execute({
                                functionName:
                                  escrowActionFunctions.resolveDispute,
                                args: [escrow.id, Number(buyerShare)],
                              })
                            }
                          >
                            Resolve dispute
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}
                <TransactionStatus transaction={action.transaction} />
              </>
            )}

            {readOnly && (
              <Alert
                variant="info"
                title="Read-only review"
                description="Lifecycle actions are intentionally disabled on this private review surface."
              />
            )}

            <Alert
              variant="warning"
              title="Unaudited testnet contract"
              description="GIWA Sepolia Test ETH has no monetary value. AccordPay is independently built on GIWA, and this contract has not been independently audited."
            />
          </Stack>
        </Card>
      )}
    </Stack>
  );
}

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
  Textarea,
} from "@/components/ui";
import { accordPayEscrowContract } from "@/config/contracts";
import { giwaSepolia } from "@/config/web3";

import { useEscrowTransaction } from "./use-escrow-transaction";
import {
  buildApproveRefundRequest,
  buildMarkDeliveredRequest,
  decodeEscrowStatus,
  escrowActionFunctions,
  validateEscrowIdInput,
} from "./escrow-lifecycle";
import styles from "./escrow.module.css";
import { validateEscrowUri } from "./uri-validation";
import { DeliveryProofBuilder } from "./delivery-proof-builder";

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
  const [inputId, setInputId] = useState(validInitialId ?? "");
  const [escrowId, setEscrowId] = useState<bigint | undefined>(
    validInitialId ? BigInt(validInitialId) : undefined,
  );
  const [deliveryURI, setDeliveryURI] = useState("");
  const [buyerShare, setBuyerShare] = useState("5000");
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeEvidence, setDisputeEvidence] = useState("");
  const [disputeError, setDisputeError] = useState("");
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
  const inputIdValid = validateEscrowIdInput(inputId);
  const inputIdError =
    inputId.length > 0 && !inputIdValid
      ? "Enter a positive whole-number escrow ID."
      : undefined;
  const deliveryValidation = deliveryURI
    ? validateEscrowUri(deliveryURI)
    : undefined;
  const storedMetadata = escrow
    ? validateEscrowUri(escrow.metadataURI)
    : undefined;
  const storedEvidence = escrow
    ? validateEscrowUri(escrow.deliveryURI)
    : undefined;
  const disputeEvidenceValidation = disputeEvidence
    ? validateEscrowUri(disputeEvidence)
    : undefined;

  async function createCaseAndRaiseDispute() {
    if (!escrow || disputeReason.trim().length < 10) return;
    setDisputeError("");
    const response = await fetch("/api/disputes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        escrowId: escrow.id.toString(),
        reason: disputeReason.trim(),
        evidenceUri: disputeEvidenceValidation?.valid
          ? disputeEvidenceValidation.value
          : "",
      }),
    });
    const created = (await response.json()) as {
      disputeCaseId?: string;
      error?: { message: string };
    };
    if (!response.ok || !created.disputeCaseId) {
      setDisputeError(
        created.error?.message ??
          "Authenticate the connected wallet before creating a dispute case.",
      );
      return;
    }
    const receipt = await action.execute({
      functionName: escrowActionFunctions.raiseDispute,
      args: [escrow.id],
    });
    if (receipt?.status === "success") {
      await fetch(`/api/disputes/${created.disputeCaseId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          transactionHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber.toString(),
        }),
      });
    }
  }

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
            label="Agreement ID"
            type="number"
            min="1"
            step="1"
            value={inputId}
            onChange={(event) => setInputId(event.target.value.trim())}
            placeholder="Enter escrow ID"
            helperText="Enter the numeric on-chain escrow ID."
            error={inputIdError}
            required
          />
          <Button
            type="submit"
            disabled={!inputIdValid}
            loading={escrowQuery.isFetching}
          >
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
                <dt>Agreement document</dt>
                <dd className={styles.uri}>
                  {storedMetadata?.valid ? (
                    <a
                      href={storedMetadata.value}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {storedMetadata.value}
                    </a>
                  ) : (
                    <>
                      {escrow.metadataURI}
                      <span className={styles.uriWarning}>
                        Invalid or unsupported metadata URI
                      </span>
                    </>
                  )}
                </dd>
              </div>
              <div className={styles.fullDetail}>
                <dt>Delivery proof</dt>
                <dd className={styles.uri}>
                  {!escrow.deliveryURI ? (
                    "Not submitted"
                  ) : storedEvidence?.valid ? (
                    <a
                      href={storedEvidence.value}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {storedEvidence.value}
                    </a>
                  ) : (
                    <>
                      {escrow.deliveryURI}
                      <span className={styles.uriWarning}>
                        Invalid or unsupported evidence URI
                      </span>
                    </>
                  )}
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
            <details className={styles.advancedDetails}>
              <summary>Advanced blockchain details</summary>
              <dl>
                <div>
                  <dt>Numeric on-chain escrow ID</dt>
                  <dd>{escrow.id.toString()}</dd>
                </div>
                <div>
                  <dt>Raw agreement URI</dt>
                  <dd>{escrow.metadataURI}</dd>
                </div>
                <div>
                  <dt>Raw delivery URI</dt>
                  <dd>{escrow.deliveryURI || "Not submitted"}</dd>
                </div>
                <div>
                  <dt>Contract address</dt>
                  <dd>{accordPayEscrowContract.address}</dd>
                </div>
              </dl>
            </details>

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
                          <DeliveryProofBuilder
                            escrowId={escrow.id}
                            onReady={setDeliveryURI}
                          />
                          <Input
                            label="Delivery proof URI"
                            value={deliveryURI}
                            onChange={(event) =>
                              setDeliveryURI(event.target.value)
                            }
                            placeholder="ipfs://bafy.../delivery-proof.pdf"
                            helperText="Generated automatically after upload. Advanced users may paste a public IPFS, Arweave, or HTTPS link."
                            error={
                              deliveryValidation && !deliveryValidation.valid
                                ? deliveryValidation.error
                                : undefined
                            }
                            required
                          />
                          <p className={styles.actionMeta}>
                            Delivery evidence can be a completed file,
                            deployment, source-code release, receipt, report,
                            image, or other publicly accessible proof of
                            delivery.
                          </p>
                          {deliveryValidation?.valid ? (
                            <ConfirmationDialog
                              triggerLabel="Mark delivered"
                              title="Mark this escrow delivered?"
                              description={`State: Funded. Role: Seller. This records ${deliveryValidation.value} and moves the escrow to Delivered. No funds move. The action cannot be reversed, but the seller may still refund and either party may dispute.`}
                              confirmLabel="Mark delivered on GIWA"
                              disabled={action.isPending}
                              onConfirm={() =>
                                action.execute(
                                  buildMarkDeliveredRequest(
                                    escrow.id,
                                    deliveryValidation.value,
                                  ),
                                )
                              }
                            />
                          ) : (
                            <Button disabled>Mark delivered</Button>
                          )}
                        </>
                      )}
                      {isBuyer && status === "delivered" && (
                        <div className={styles.actionGroup}>
                          <ConfirmationDialog
                            triggerLabel="Release funds"
                            title="Release the full escrow payment?"
                            description={`State: Delivered. Role: Buyer. This immediately transfers ${formatEther(escrow.amount)} Test ETH to the seller and permanently completes the escrow. It cannot be reversed.${storedEvidence?.valid ? ` Delivery evidence: ${storedEvidence.value}` : ""}`}
                            confirmLabel="Release funds"
                            disabled={action.isPending}
                            onConfirm={() =>
                              action.execute({
                                functionName:
                                  escrowActionFunctions.releaseFunds,
                                args: [escrow.id],
                              })
                            }
                          />
                          <p>
                            Immediately pays the seller and permanently
                            completes this escrow.
                          </p>
                        </div>
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
                                triggerLabel="Refund buyer now"
                                title="Immediately refund the buyer?"
                                description={`Agreement ACP-${escrow.id.toString().padStart(6, "0")}. Buyer: ${escrow.buyer}. Seller: ${escrow.seller}. Amount: ${formatEther(escrow.amount)} Test ETH. Current state: ${status}. Connected role: Seller. The full amount moves immediately to the buyer, the escrow becomes Refunded, and this cannot be reversed.`}
                                confirmLabel="Refund buyer now"
                                destructive
                                disabled={action.isPending}
                                onConfirm={() =>
                                  action.execute(
                                    buildApproveRefundRequest(escrow.id),
                                  )
                                }
                              />
                            )}
                            <p className={styles.actionMeta}>
                              Immediately returns the full escrow amount to the
                              buyer. This action is irreversible.
                            </p>
                          </>
                        )}
                      {(isBuyer || isSeller) &&
                        (status === "funded" || status === "delivered") && (
                          <div className={styles.actionGroup}>
                            <Textarea
                              label="Dispute reason"
                              helperText="Stored off-chain in the private dispute case; the contract records only the Disputed state."
                              value={disputeReason}
                              onChange={(event) =>
                                setDisputeReason(event.target.value)
                              }
                              maxLength={4000}
                              required
                            />
                            <Input
                              label="Supporting evidence"
                              helperText="Optional public HTTPS, IPFS, or Arweave URI."
                              value={disputeEvidence}
                              onChange={(event) =>
                                setDisputeEvidence(event.target.value)
                              }
                              error={
                                disputeEvidenceValidation &&
                                !disputeEvidenceValidation.valid
                                  ? disputeEvidenceValidation.error
                                  : undefined
                              }
                            />
                            <ConfirmationDialog
                              triggerLabel="Raise dispute"
                              title="Freeze this escrow in dispute?"
                              description={`Agreement ACP-${escrow.id.toString().padStart(6, "0")}. Buyer: ${escrow.buyer}. Seller: ${escrow.seller}. Amount: ${formatEther(escrow.amount)} Test ETH. Current state: ${status}. Connected role: ${isBuyer ? "Buyer" : "Seller"}. Funds do not move immediately. The escrow becomes Disputed; normal release, refund, and deadline reclaim stop. Only the configured designated testnet resolver can finalize the payout. Buyer and seller cannot withdraw the dispute. This is designated resolver resolution, not decentralized arbitration.${storedEvidence?.valid ? ` Delivery proof: ${storedEvidence.value}` : ""}`}
                              confirmLabel="Raise dispute"
                              destructive
                              disabled={
                                action.isPending ||
                                disputeReason.trim().length < 10 ||
                                (Boolean(disputeEvidence) &&
                                  disputeEvidenceValidation?.valid !== true)
                              }
                              onConfirm={() => void createCaseAndRaiseDispute()}
                            />
                            {disputeError ? (
                              <p role="alert">{disputeError}</p>
                            ) : null}
                            <p>
                              Freezes the escrow without moving funds. Only the
                              designated AccordPay testnet resolver can later
                              distribute the funds.
                            </p>
                          </div>
                        )}
                      {isBuyer && status === "funded" && (
                        <div className={styles.actionGroup}>
                          <ConfirmationDialog
                            triggerLabel="Reclaim after deadline"
                            title="Reclaim the escrow deposit?"
                            description={`State: Funded. Role: Buyer. The deadline has passed without delivery. This immediately returns ${formatEther(escrow.amount)} Test ETH to the buyer and permanently moves the escrow to Refunded.`}
                            confirmLabel="Reclaim deposit"
                            disabled={!canReclaim || action.isPending}
                            onConfirm={() =>
                              action.execute({
                                functionName:
                                  escrowActionFunctions.reclaimAfterDeadline,
                                args: [escrow.id],
                              })
                            }
                          />
                          <p>
                            Available only after the deadline while delivery has
                            not been marked.
                          </p>
                        </div>
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
                          {/^\d+$/.test(buyerShare) &&
                          Number(buyerShare) <= 10_000 ? (
                            <p className={styles.actionReason}>
                              Buyer:{" "}
                              {formatEther(
                                (escrow.amount * BigInt(buyerShare)) / 10_000n,
                              )}{" "}
                              Test ETH · Seller:{" "}
                              {formatEther(
                                escrow.amount -
                                  (escrow.amount * BigInt(buyerShare)) /
                                    10_000n,
                              )}{" "}
                              Test ETH
                            </p>
                          ) : null}
                          <ConfirmationDialog
                            triggerLabel="Resolve dispute"
                            title="Finalize the dispute payout?"
                            description={`State: Disputed. Role: Resolver. This immediately pays ${Number(buyerShare) / 100}% to the buyer and the remainder to the seller, then permanently completes the escrow.`}
                            confirmLabel="Resolve and distribute funds"
                            disabled={
                              action.isPending ||
                              !/^\d+$/.test(buyerShare) ||
                              Number(buyerShare) > 10_000
                            }
                            onConfirm={() =>
                              action.execute({
                                functionName:
                                  escrowActionFunctions.resolveDispute,
                                args: [escrow.id, Number(buyerShare)],
                              })
                            }
                          />
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

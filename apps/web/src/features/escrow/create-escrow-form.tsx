"use client";

import { useCallback, useState } from "react";
import {
  decodeEventLog,
  getAddress,
  isAddress,
  parseEther,
  type Abi,
  type TransactionReceipt,
} from "viem";
import { useConnection, usePublicClient, useReadContract } from "wagmi";

import { Stack } from "@/components/layout";
import { Web3Identity } from "@/components/shared/web3-identity";
import { TransactionStatus, WalletControl } from "@/components/web3";
import { Alert, Button, Card, Input, Select } from "@/components/ui";
import { accordPayEscrowContract } from "@/config/contracts";
import { giwaSepolia } from "@/config/web3";
import { useUpbitName } from "@/hooks/use-upbit-name";
import { isUpbitName } from "@/services/names";

import { useEscrowTransaction } from "./use-escrow-transaction";
import { prepareSellerAddress } from "./seller-resolution";
import { validateEscrowUri } from "./uri-validation";
import styles from "./escrow.module.css";

export function CreateEscrowForm({
  initialSeller = "",
  initialMetadataUri = "",
  metadataLocked = false,
  dealRoomId,
}: {
  initialSeller?: string;
  initialMetadataUri?: string;
  metadataLocked?: boolean;
  dealRoomId?: string;
} = {}) {
  const connection = useConnection();
  const publicClient = usePublicClient({ chainId: giwaSepolia.id });
  const [seller, setSeller] = useState(initialSeller);
  const [metadataURI, setMetadataURI] = useState(initialMetadataUri);
  const [deadline, setDeadline] = useState("");
  const [amount, setAmount] = useState("");
  const [formError, setFormError] = useState("");
  const [createdEscrowId, setCreatedEscrowId] = useState<bigint>();
  const sellerName = useUpbitName(seller);
  const resolvedSeller = isAddress(seller.trim())
    ? getAddress(seller.trim())
    : sellerName.result.status === "confirmed"
      ? sellerName.result.address
      : undefined;
  const [confirmedSeller, setConfirmedSeller] = useState("");
  const metadataValidation = metadataURI
    ? validateEscrowUri(metadataURI)
    : undefined;

  const retrieveEscrowId = useCallback(
    async (receipt: TransactionReceipt) => {
      let escrowId: bigint | undefined;

      for (const log of receipt.logs) {
        if (
          log.address.toLowerCase() !==
          accordPayEscrowContract.address.toLowerCase()
        ) {
          continue;
        }
        try {
          const decoded = decodeEventLog({
            abi: accordPayEscrowContract.abi as Abi,
            eventName: "EscrowCreated",
            data: log.data,
            topics: log.topics,
          });
          const args = decoded.args as { escrowId?: bigint };
          if (typeof args.escrowId === "bigint") {
            escrowId = args.escrowId;
            break;
          }
        } catch {
          // Ignore unrelated logs and use the documented fallback below.
        }
      }

      if (escrowId === undefined && publicClient) {
        escrowId = (await publicClient.readContract({
          ...accordPayEscrowContract,
          abi: accordPayEscrowContract.abi as Abi,
          functionName: "totalEscrows",
        })) as bigint;
      }

      if (escrowId === undefined) {
        setFormError(
          "Transaction confirmed, but the new escrow ID could not be retrieved.",
        );
        return;
      }

      setCreatedEscrowId(escrowId);
      if (dealRoomId) {
        await fetch(`/api/deal-rooms/${dealRoomId}/escrow-link`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            escrowId: escrowId.toString(),
            transactionHash: receipt.transactionHash,
          }),
        });
      }
    },
    [dealRoomId, publicClient],
  );
  const transaction = useEscrowTransaction(retrieveEscrowId);
  const createdEscrowQuery = useReadContract({
    ...accordPayEscrowContract,
    functionName: "getEscrow",
    args: createdEscrowId ? [createdEscrowId] : undefined,
    chainId: giwaSepolia.id,
    query: { enabled: createdEscrowId !== undefined },
  });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setFormError("");
    setCreatedEscrowId(undefined);
    let preparedSeller: `0x${string}`;
    try {
      preparedSeller = prepareSellerAddress(
        seller,
        sellerName.result,
        confirmedSeller,
      );
    } catch {
      setFormError(
        isUpbitName(seller)
          ? "The Upbit Web3 Name must resolve with matching forward and reverse records."
          : "Enter a valid non-zero seller address or username.up.id.",
      );
      return;
    }
    if (
      isUpbitName(seller) &&
      confirmedSeller !==
        `${sellerName.result.status === "confirmed" ? sellerName.result.name : ""}:${resolvedSeller}`
    ) {
      setFormError("Confirm the resolved seller address before continuing.");
      return;
    }
    if (preparedSeller.toLowerCase() === connection.address?.toLowerCase()) {
      setFormError("Buyer and seller must be different addresses.");
      return;
    }
    const deadlineSeconds = Math.floor(new Date(deadline).getTime() / 1000);
    if (!deadlineSeconds || deadlineSeconds <= Math.floor(Date.now() / 1000)) {
      setFormError("Delivery deadline must be in the future.");
      return;
    }
    const validatedMetadata = validateEscrowUri(metadataURI);
    if (!validatedMetadata.valid) {
      setFormError(validatedMetadata.error);
      return;
    }
    try {
      let sellerForContract = preparedSeller;
      if (isUpbitName(seller)) {
        const fresh = await sellerName.refresh();
        if (
          fresh.status !== "confirmed" ||
          fresh.address.toLowerCase() !== preparedSeller.toLowerCase()
        ) {
          setConfirmedSeller("");
          setFormError(
            "The resolved seller address changed or could not be reconfirmed. Review it before signing.",
          );
          return;
        }
        sellerForContract = fresh.address;
      }
      const value = parseEther(amount);
      if (value <= BigInt(0)) throw new Error();
      await transaction.execute({
        functionName: "createEscrow",
        args: [sellerForContract, deadlineSeconds, validatedMetadata.value],
        value,
      });
    } catch (error) {
      setFormError(
        error instanceof Error && error.message
          ? error.message
          : "The escrow transaction could not be prepared.",
      );
    }
  }

  const connectedToGiwa =
    connection.status === "connected" && connection.chainId === giwaSepolia.id;

  return (
    <form onSubmit={submit} className={styles.formPanel}>
      <Stack gap={6}>
        {!connectedToGiwa && (
          <Alert
            variant="warning"
            title="Wallet and GIWA Sepolia required"
            description="Connect a wallet and switch to GIWA Sepolia before creating an escrow."
            action={<WalletControl />}
          />
        )}
        {formError && (
          <Alert
            variant="error"
            title="Review the form"
            description={formError}
          />
        )}
        <div className={styles.formGrid}>
          <div className={styles.verificationField}>
            <Input
              label="Seller wallet address or Upbit Web3 Name"
              value={seller}
              onChange={(event) => {
                setSeller(event.target.value);
                setConfirmedSeller("");
              }}
              placeholder="0x… or username.up.id"
              readOnly={Boolean(initialSeller)}
              required
            />
            {resolvedSeller ? (
              <div className={styles.verificationResult} aria-live="polite">
                <Web3Identity
                  address={resolvedSeller}
                  label="Resolved seller identity"
                />
              </div>
            ) : null}
            {isUpbitName(seller) && (
              <div className={styles.nameResolution} aria-live="polite">
                <strong>
                  {sellerName.state === "resolving"
                    ? "Resolving"
                    : sellerName.result.status === "confirmed"
                      ? "Name confirmed"
                      : sellerName.result.status === "not-found"
                        ? "No name found"
                        : sellerName.result.status === "mismatch"
                          ? "Name/address mismatch"
                          : "Resolution unavailable"}
                </strong>
                {sellerName.result.status === "confirmed" && (
                  <>
                    <code>{sellerName.result.address}</code>
                    <label className={styles.confirmIdentity}>
                      <input
                        type="checkbox"
                        checked={
                          confirmedSeller ===
                          `${sellerName.result.name}:${sellerName.result.address}`
                        }
                        onChange={(event) =>
                          setConfirmedSeller(
                            event.target.checked
                              ? `${sellerName.result.name}:${sellerName.result.address}`
                              : "",
                          )
                        }
                      />
                      I confirm this is the intended seller address.
                    </label>
                  </>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void sellerName.refetch()}
                >
                  Refresh name
                </Button>
              </div>
            )}
          </div>
          <Input
            className={styles.fullSpan}
            label="Agreement document"
            value={metadataURI}
            onChange={(event) => setMetadataURI(event.target.value)}
            placeholder="ipfs://bafy.../agreement.json"
            helperText="A public IPFS, Arweave, or HTTPS link containing the agreement description, requirements, and terms."
            error={
              metadataValidation && !metadataValidation.valid
                ? metadataValidation.error
                : undefined
            }
            readOnly={metadataLocked}
            required
          />
          <details className={`${styles.fullSpan} ${styles.uriHelp}`}>
            <summary>What is agreement metadata?</summary>
            <p>
              Metadata describes the agreement and should point to a public
              agreement document or JSON file. The on-chain escrow permanently
              references this URI; it does not verify the linked contents. Do
              not enter random text or confidential information.
            </p>
          </details>
          <Input
            label="Delivery deadline"
            type="datetime-local"
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
            required
          />
          <Input
            label="Amount"
            type="number"
            min="0"
            step="any"
            suffix="Test ETH"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
          />
          <Select
            label="Asset"
            disabled
            defaultValue="eth"
            options={[{ label: "GIWA Sepolia Test ETH", value: "eth" }]}
          />
        </div>
        <Card variant="tinted">
          <Stack gap={2}>
            <strong>I do not have an Upbit Web3 Name</strong>
            <p>
              Use the official GIWA process: complete or issue Dojang, claim
              VerifiedToken, issue an UP ID, and sign each required transaction.
              Then return here and refresh identity.
            </p>
            <Button
              href="https://sepolia-playground.giwa.io/"
              target="_blank"
              variant="secondary"
            >
              Get an Upbit Web3 Name
            </Button>
          </Stack>
        </Card>
        <dl className={styles.paymentSummary}>
          <div>
            <dt>Escrow amount</dt>
            <dd>{amount || "0"} ETH</dd>
          </div>
          <div>
            <dt>Protocol fee</dt>
            <dd>0 ETH</dd>
          </div>
          <div>
            <dt>Total deposit</dt>
            <dd>{amount || "0"} ETH</dd>
          </div>
        </dl>
        <Button
          type="submit"
          disabled={!connectedToGiwa || metadataValidation?.valid !== true}
          loading={transaction.isPending}
          loadingText={
            transaction.transaction.phase === "submitted"
              ? "Confirming on GIWA"
              : "Awaiting signature"
          }
        >
          Create and fund escrow
        </Button>
        <TransactionStatus transaction={transaction.transaction} />
        {createdEscrowId !== undefined && transaction.transaction.hash && (
          <Card variant="tinted">
            <Stack gap={3}>
              <span className={styles.successLabel}>Created escrow</span>
              <strong className={styles.createdId}>
                ACP-{createdEscrowId.toString().padStart(6, "0")}
              </strong>
              <p className={styles.successCopy}>
                Escrow ID {createdEscrowId.toString()} was extracted from the
                confirmed transaction
                {createdEscrowQuery.data
                  ? " and its agreement data has been refreshed from GIWA."
                  : "."}
              </p>
              <div className={styles.successActions}>
                <Button
                  href={`/app/agreements?id=${createdEscrowId.toString()}`}
                >
                  View escrow
                </Button>
                <Button
                  variant="ghost"
                  href={`${giwaSepolia.blockExplorers.default.url}/tx/${transaction.transaction.hash}`}
                  target="_blank"
                >
                  Transaction {transaction.transaction.hash.slice(0, 10)}…
                </Button>
              </div>
            </Stack>
          </Card>
        )}
      </Stack>
    </form>
  );
}

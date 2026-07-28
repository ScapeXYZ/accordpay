"use client";

import { useCallback, useState } from "react";
import {
  decodeEventLog,
  isAddress,
  parseEther,
  type Abi,
  type TransactionReceipt,
} from "viem";
import { useConnection, usePublicClient, useReadContract } from "wagmi";

import { Stack } from "@/components/layout";
import { TransactionStatus, WalletControl } from "@/components/web3";
import { Alert, Button, Card, Input, Select } from "@/components/ui";
import { accordPayEscrowContract } from "@/config/contracts";
import { giwaSepolia } from "@/config/web3";

import { useEscrowTransaction } from "./use-escrow-transaction";
import styles from "./escrow.module.css";

export function CreateEscrowForm() {
  const connection = useConnection();
  const publicClient = usePublicClient({ chainId: giwaSepolia.id });
  const [seller, setSeller] = useState("");
  const [metadataURI, setMetadataURI] = useState("");
  const [deadline, setDeadline] = useState("");
  const [amount, setAmount] = useState("");
  const [formError, setFormError] = useState("");
  const [createdEscrowId, setCreatedEscrowId] = useState<bigint>();

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
    },
    [publicClient],
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
    if (!isAddress(seller)) {
      setFormError("Enter a valid non-zero seller address.");
      return;
    }
    if (seller.toLowerCase() === connection.address?.toLowerCase()) {
      setFormError("Buyer and seller must be different addresses.");
      return;
    }
    const deadlineSeconds = Math.floor(new Date(deadline).getTime() / 1000);
    if (!deadlineSeconds || deadlineSeconds <= Math.floor(Date.now() / 1000)) {
      setFormError("Delivery deadline must be in the future.");
      return;
    }
    if (!metadataURI || metadataURI.length > 2_048) {
      setFormError("Metadata URI must contain 1–2,048 characters.");
      return;
    }
    try {
      const value = parseEther(amount);
      if (value <= BigInt(0)) throw new Error();
      await transaction.execute({
        functionName: "createEscrow",
        args: [seller, deadlineSeconds, metadataURI],
        value,
      });
    } catch {
      setFormError("Enter a Test ETH amount greater than zero.");
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
          <Input
            label="Seller wallet address"
            value={seller}
            onChange={(event) => setSeller(event.target.value)}
            placeholder="0x…"
            required
          />
          <Input
            className={styles.fullSpan}
            label="Metadata URI"
            value={metadataURI}
            onChange={(event) => setMetadataURI(event.target.value)}
            placeholder="ipfs://…"
            helperText="Public content-addressed agreement reference. Never include private data."
            required
          />
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
          disabled={!connectedToGiwa}
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

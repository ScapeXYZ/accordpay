import { Alert, Button } from "@/components/ui";
import { giwaSepolia } from "@/config/web3";

import type { TransactionState } from "@/features/escrow/use-escrow-transaction";

export function TransactionStatus({
  transaction,
}: {
  transaction: TransactionState;
}) {
  if (transaction.phase === "idle") return null;

  if (transaction.phase === "error") {
    return (
      <Alert
        variant="error"
        title="Transaction failed"
        description={
          transaction.error ?? "The transaction could not be completed."
        }
      />
    );
  }

  const title = {
    awaitingSignature: "Awaiting wallet signature",
    submitted: "Transaction submitted",
    confirmed: "Transaction confirmed",
  }[transaction.phase];
  const description =
    transaction.phase === "confirmed"
      ? `${transaction.confirmations} GIWA confirmation received. Contract state has been refreshed.`
      : transaction.phase === "submitted"
        ? "The transaction is waiting for one GIWA block confirmation."
        : "Review the exact contract action and network in your wallet.";

  return (
    <Alert
      variant={transaction.phase === "confirmed" ? "success" : "info"}
      title={title}
      description={description}
      action={
        transaction.hash ? (
          <Button
            variant="ghost"
            href={`${giwaSepolia.blockExplorers.default.url}/tx/${transaction.hash}`}
            target="_blank"
          >
            View {`${transaction.hash.slice(0, 10)}…`}
          </Button>
        ) : undefined
      }
    />
  );
}

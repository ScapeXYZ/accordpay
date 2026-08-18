export const escrowStatuses = [
  "funded",
  "delivered",
  "completed",
  "refunded",
  "disputed",
] as const;

export type EscrowStatus = (typeof escrowStatuses)[number];

export function validateEscrowIdInput(value: string) {
  return /^[1-9]\d*$/.test(value);
}

export function decodeEscrowStatus(value: number): EscrowStatus | undefined {
  return escrowStatuses[value];
}

export const escrowActionFunctions = {
  markDelivered: "markDelivered",
  releaseFunds: "releaseFunds",
  approveRefund: "approveRefund",
  raiseDispute: "raiseDispute",
  reclaimAfterDeadline: "reclaimAfterDeadline",
  resolveDispute: "resolveDispute",
} as const;

export function buildMarkDeliveredRequest(
  escrowId: bigint,
  deliveryURI: string,
) {
  return {
    functionName: escrowActionFunctions.markDelivered,
    args: [escrowId, deliveryURI] as const,
  };
}

export function buildApproveRefundRequest(escrowId: bigint) {
  return {
    functionName: escrowActionFunctions.approveRefund,
    args: [escrowId] as const,
  };
}

export const activityEventNames = [
  "EscrowCreated",
  "DeliveryMarked",
  "FundsReleased",
  "EscrowRefunded",
  "DisputeRaised",
  "DisputeResolved",
] as const;

export const activityStatuses = [
  "funded",
  "delivered",
  "completed",
  "refunded",
  "disputed",
] as const;

export type ActivityEventName = (typeof activityEventNames)[number];
export type ActivityStatus = (typeof activityStatuses)[number];

export type ActivityApiEscrow = {
  id: string;
  buyer: string;
  seller: string;
  amount: string;
  deadline: string;
  status: ActivityStatus;
};

export type ActivityApiEvent = {
  key: string;
  eventName: ActivityEventName;
  escrowId: string;
  transactionHash: string;
  blockNumber: string;
  logIndex: number;
  timestamp: number | null;
};

export type ActivityApiPage = {
  chainId: 91342;
  wallet: string;
  resolver: string;
  events: ActivityApiEvent[];
  escrows: ActivityApiEscrow[];
  nextCursor: string | null;
  progress: {
    completedRanges: number;
    totalRanges: number;
    latestBlock: string;
    chunkSize: number;
  };
  sync?: {
    running: boolean;
    complete: boolean;
    lastSyncedBlock: string | null;
    targetBlock: string | null;
  };
  partial: boolean;
  warnings: string[];
};

export type ActivityApiError = {
  error: {
    code: string;
    method: string;
    retryable: boolean;
    message: string;
  };
};

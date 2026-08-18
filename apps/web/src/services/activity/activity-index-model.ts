import type { IndexedActivityEvent } from "./activity-index";

export function chooseSyncStart({
  deploymentBlock,
  lastSyncedBlock,
  previousTargetBlock,
  overlap,
}: {
  deploymentBlock: bigint;
  lastSyncedBlock: bigint | null;
  previousTargetBlock: bigint | null;
  overlap: bigint;
}) {
  if (lastSyncedBlock == null) return deploymentBlock;
  const caughtUp =
    previousTargetBlock != null && lastSyncedBlock >= previousTargetBlock;
  if (!caughtUp) return lastSyncedBlock + 1n;
  const overlapStart = lastSyncedBlock - overlap + 1n;
  return overlapStart > deploymentBlock ? overlapStart : deploymentBlock;
}

export function upsertIndexedEvents(
  existing: IndexedActivityEvent[],
  incoming: IndexedActivityEvent[],
) {
  const records = new Map(
    existing.map((event) => [
      `${event.chainId}:${event.transactionHash}:${event.logIndex}`,
      event,
    ]),
  );
  for (const event of incoming) {
    for (const [key, record] of records) {
      if (
        record.chainId === event.chainId &&
        record.escrowId === event.escrowId
      ) {
        records.set(key, { ...record, currentState: event.currentState });
      }
    }
    records.set(
      `${event.chainId}:${event.transactionHash}:${event.logIndex}`,
      event,
    );
  }
  return [...records.values()];
}

export class SingleFlight<T> {
  private active?: Promise<T>;

  run(operation: () => Promise<T>) {
    this.active ??= operation().finally(() => {
      this.active = undefined;
    });
    return this.active;
  }

  get running() {
    return Boolean(this.active);
  }
}

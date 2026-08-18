import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { Pool } from "pg";

import type { ActivityEventName, ActivityStatus } from "./activity-types";
import { upsertIndexedEvents } from "./activity-index-model";

export type IndexedActivityEvent = {
  chainId: number;
  contractAddress: string;
  transactionHash: string;
  logIndex: number;
  blockNumber: bigint;
  blockTimestamp: number | null;
  eventName: ActivityEventName;
  escrowId: bigint;
  buyer: string;
  seller: string;
  amount: bigint;
  currentState: ActivityStatus;
  rawEventData: Record<string, unknown>;
};

export type IndexCheckpoint = {
  lastSyncedBlock: bigint | null;
  targetBlock: bigint | null;
  updatedAt: string | null;
};

export type IndexedActivityQuery = {
  wallet: string;
  escrowId?: bigint;
  event?: ActivityEventName;
  status?: ActivityStatus;
  cursor?: string;
  limit: number;
};

export interface ActivityIndex {
  initialize(): Promise<void>;
  acquireSyncLock(key: string): Promise<(() => Promise<void>) | null>;
  getCheckpoint(
    chainId: number,
    contractAddress: string,
  ): Promise<IndexCheckpoint>;
  persistChunk(
    events: IndexedActivityEvent[],
    checkpoint: {
      chainId: number;
      contractAddress: string;
      lastSyncedBlock: bigint;
      targetBlock: bigint;
    },
  ): Promise<void>;
  query(query: IndexedActivityQuery): Promise<{
    events: IndexedActivityEvent[];
    nextCursor: string | null;
  }>;
}

const schema = `
CREATE TABLE IF NOT EXISTS indexed_blocks (
  chain_id BIGINT NOT NULL,
  contract_address TEXT NOT NULL,
  last_synced_block BIGINT NOT NULL,
  target_block BIGINT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (chain_id, contract_address)
);
CREATE TABLE IF NOT EXISTS accordpay_events (
  chain_id BIGINT NOT NULL,
  contract_address TEXT NOT NULL,
  transaction_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number BIGINT NOT NULL,
  block_timestamp BIGINT,
  event_name TEXT NOT NULL,
  escrow_id BIGINT NOT NULL,
  buyer TEXT NOT NULL,
  seller TEXT NOT NULL,
  amount NUMERIC(78, 0) NOT NULL,
  current_state TEXT NOT NULL,
  raw_event_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (chain_id, transaction_hash, log_index)
);
CREATE INDEX IF NOT EXISTS accordpay_events_wallet_buyer_idx
  ON accordpay_events (chain_id, buyer, block_number DESC);
CREATE INDEX IF NOT EXISTS accordpay_events_wallet_seller_idx
  ON accordpay_events (chain_id, seller, block_number DESC);
CREATE INDEX IF NOT EXISTS accordpay_events_escrow_idx
  ON accordpay_events (chain_id, escrow_id);
`;

function serializeRaw(value: unknown) {
  return JSON.stringify(value, (_, item) =>
    typeof item === "bigint" ? item.toString() : item,
  );
}

class PostgresActivityIndex implements ActivityIndex {
  private readonly pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : undefined,
      max: 4,
    });
  }

  async initialize() {
    await this.pool.query(schema);
  }

  async acquireSyncLock(key: string) {
    const client = await this.pool.connect();
    const result = await client.query<{ acquired: boolean }>(
      "SELECT pg_try_advisory_lock(hashtext($1)) AS acquired",
      [key],
    );
    if (!result.rows[0]?.acquired) {
      client.release();
      return null;
    }
    return async () => {
      await client.query("SELECT pg_advisory_unlock(hashtext($1))", [key]);
      client.release();
    };
  }

  async getCheckpoint(chainId: number, contractAddress: string) {
    const result = await this.pool.query<{
      last_synced_block: string;
      target_block: string | null;
      updated_at: Date;
    }>(
      `SELECT last_synced_block, target_block, updated_at
       FROM indexed_blocks WHERE chain_id = $1 AND contract_address = $2`,
      [chainId, contractAddress.toLowerCase()],
    );
    const row = result.rows[0];
    return {
      lastSyncedBlock: row ? BigInt(row.last_synced_block) : null,
      targetBlock: row?.target_block ? BigInt(row.target_block) : null,
      updatedAt: row?.updated_at.toISOString() ?? null,
    };
  }

  async persistChunk(
    events: IndexedActivityEvent[],
    checkpoint: {
      chainId: number;
      contractAddress: string;
      lastSyncedBlock: bigint;
      targetBlock: bigint;
    },
  ) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      for (const event of events) {
        await client.query(
          `INSERT INTO accordpay_events (
             chain_id, contract_address, transaction_hash, log_index,
             block_number, block_timestamp, event_name, escrow_id, buyer,
             seller, amount, current_state, raw_event_data
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb)
           ON CONFLICT (chain_id, transaction_hash, log_index) DO UPDATE SET
             block_number = EXCLUDED.block_number,
             block_timestamp = EXCLUDED.block_timestamp,
             event_name = EXCLUDED.event_name,
             escrow_id = EXCLUDED.escrow_id,
             buyer = EXCLUDED.buyer,
             seller = EXCLUDED.seller,
             amount = EXCLUDED.amount,
             current_state = EXCLUDED.current_state,
             raw_event_data = EXCLUDED.raw_event_data,
             updated_at = NOW()`,
          [
            event.chainId,
            event.contractAddress.toLowerCase(),
            event.transactionHash,
            event.logIndex,
            event.blockNumber.toString(),
            event.blockTimestamp,
            event.eventName,
            event.escrowId.toString(),
            event.buyer.toLowerCase(),
            event.seller.toLowerCase(),
            event.amount.toString(),
            event.currentState,
            serializeRaw(event.rawEventData),
          ],
        );
        await client.query(
          `UPDATE accordpay_events SET current_state = $1, updated_at = NOW()
           WHERE chain_id = $2 AND contract_address = $3 AND escrow_id = $4`,
          [
            event.currentState,
            event.chainId,
            event.contractAddress.toLowerCase(),
            event.escrowId.toString(),
          ],
        );
      }
      await client.query(
        `INSERT INTO indexed_blocks (
           chain_id, contract_address, last_synced_block, target_block
         ) VALUES ($1,$2,$3,$4)
         ON CONFLICT (chain_id, contract_address) DO UPDATE SET
           last_synced_block = EXCLUDED.last_synced_block,
           target_block = EXCLUDED.target_block,
           updated_at = NOW()`,
        [
          checkpoint.chainId,
          checkpoint.contractAddress.toLowerCase(),
          checkpoint.lastSyncedBlock.toString(),
          checkpoint.targetBlock.toString(),
        ],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async query(query: IndexedActivityQuery) {
    const values: unknown[] = [query.wallet.toLowerCase()];
    const conditions = ["(buyer = $1 OR seller = $1)"];
    if (query.escrowId != null) {
      values.push(query.escrowId.toString());
      conditions.push(`escrow_id = $${values.length}`);
    }
    if (query.event) {
      values.push(query.event);
      conditions.push(`event_name = $${values.length}`);
    }
    if (query.status) {
      values.push(query.status);
      conditions.push(`current_state = $${values.length}`);
    }
    if (query.cursor) {
      const [block, log] = query.cursor.split(":");
      values.push(block, log);
      conditions.push(
        `(block_number, log_index) < ($${values.length - 1}, $${values.length})`,
      );
    }
    values.push(query.limit + 1);
    const result = await this.pool.query<{
      chain_id: string;
      contract_address: string;
      transaction_hash: string;
      log_index: number;
      block_number: string;
      block_timestamp: string | null;
      event_name: ActivityEventName;
      escrow_id: string;
      buyer: string;
      seller: string;
      amount: string;
      current_state: ActivityStatus;
      raw_event_data: Record<string, unknown>;
    }>(
      `SELECT * FROM accordpay_events WHERE ${conditions.join(" AND ")}
       ORDER BY block_number DESC, log_index DESC LIMIT $${values.length}`,
      values,
    );
    const hasMore = result.rows.length > query.limit;
    const rows = result.rows.slice(0, query.limit);
    const events = rows.map((row) => ({
      chainId: Number(row.chain_id),
      contractAddress: row.contract_address,
      transactionHash: row.transaction_hash,
      logIndex: row.log_index,
      blockNumber: BigInt(row.block_number),
      blockTimestamp:
        row.block_timestamp == null ? null : Number(row.block_timestamp),
      eventName: row.event_name,
      escrowId: BigInt(row.escrow_id),
      buyer: row.buyer,
      seller: row.seller,
      amount: BigInt(row.amount),
      currentState: row.current_state,
      rawEventData: row.raw_event_data,
    }));
    const last = events[events.length - 1];
    return {
      events,
      nextCursor:
        hasMore && last ? `${last.blockNumber}:${last.logIndex}` : null,
    };
  }
}

type LocalIndexData = {
  checkpoint: {
    lastSyncedBlock: string;
    targetBlock: string;
    updatedAt: string;
  } | null;
  events: Array<
    Omit<IndexedActivityEvent, "blockNumber" | "escrowId" | "amount"> & {
      blockNumber: string;
      escrowId: string;
      amount: string;
    }
  >;
};

class LocalFileActivityIndex implements ActivityIndex {
  private readonly filePath = join(
    process.cwd(),
    ".accordpay",
    "activity-index.json",
  );
  private writeQueue = Promise.resolve();

  async initialize() {
    await mkdir(dirname(this.filePath), { recursive: true });
    try {
      await readFile(this.filePath, "utf8");
    } catch {
      await writeFile(
        this.filePath,
        JSON.stringify({ checkpoint: null, events: [] }),
        "utf8",
      );
    }
  }

  async acquireSyncLock() {
    return async () => undefined;
  }

  private async read(): Promise<LocalIndexData> {
    return JSON.parse(await readFile(this.filePath, "utf8")) as LocalIndexData;
  }

  private async write(data: LocalIndexData) {
    const temporary = `${this.filePath}.tmp`;
    await writeFile(temporary, JSON.stringify(data), "utf8");
    await rename(temporary, this.filePath);
  }

  async getCheckpoint() {
    const data = await this.read();
    return {
      lastSyncedBlock: data.checkpoint
        ? BigInt(data.checkpoint.lastSyncedBlock)
        : null,
      targetBlock: data.checkpoint ? BigInt(data.checkpoint.targetBlock) : null,
      updatedAt: data.checkpoint?.updatedAt ?? null,
    };
  }

  async persistChunk(
    events: IndexedActivityEvent[],
    checkpoint: {
      lastSyncedBlock: bigint;
      targetBlock: bigint;
    },
  ) {
    this.writeQueue = this.writeQueue.then(async () => {
      const data = await this.read();
      const existing = data.events.map((event) => ({
        ...event,
        blockNumber: BigInt(event.blockNumber),
        escrowId: BigInt(event.escrowId),
        amount: BigInt(event.amount),
      }));
      const merged = upsertIndexedEvents(existing, events).map((event) => ({
        ...event,
        blockNumber: event.blockNumber.toString(),
        escrowId: event.escrowId.toString(),
        amount: event.amount.toString(),
      }));
      await this.write({
        checkpoint: {
          lastSyncedBlock: checkpoint.lastSyncedBlock.toString(),
          targetBlock: checkpoint.targetBlock.toString(),
          updatedAt: new Date().toISOString(),
        },
        events: merged,
      });
    });
    await this.writeQueue;
  }

  async query(query: IndexedActivityQuery) {
    const data = await this.read();
    const account = query.wallet.toLowerCase();
    const cursorParts = query.cursor?.split(":");
    const cursorBlock = cursorParts ? BigInt(cursorParts[0]) : undefined;
    const cursorLog = cursorParts ? Number(cursorParts[1]) : undefined;
    const matching = data.events
      .filter(
        (event) =>
          (event.buyer.toLowerCase() === account ||
            event.seller.toLowerCase() === account) &&
          (query.escrowId == null ||
            event.escrowId === query.escrowId.toString()) &&
          (!query.event || event.eventName === query.event) &&
          (!query.status || event.currentState === query.status) &&
          (cursorBlock == null ||
            BigInt(event.blockNumber) < cursorBlock ||
            (BigInt(event.blockNumber) === cursorBlock &&
              event.logIndex < cursorLog!)),
      )
      .sort((left, right) =>
        left.blockNumber === right.blockNumber
          ? right.logIndex - left.logIndex
          : BigInt(left.blockNumber) > BigInt(right.blockNumber)
            ? -1
            : 1,
      );
    const page = matching.slice(0, query.limit + 1);
    const hasMore = page.length > query.limit;
    const rows = page.slice(0, query.limit);
    const events = rows.map((event) => ({
      ...event,
      blockNumber: BigInt(event.blockNumber),
      escrowId: BigInt(event.escrowId),
      amount: BigInt(event.amount),
    }));
    const last = events[events.length - 1];
    return {
      events,
      nextCursor:
        hasMore && last ? `${last.blockNumber}:${last.logIndex}` : null,
    };
  }
}

let activityIndexPromise: Promise<ActivityIndex> | undefined;

export function getActivityIndex() {
  activityIndexPromise ??= (async () => {
    const connectionString = process.env.DATABASE_URL?.trim();
    const adapter: ActivityIndex = connectionString
      ? new PostgresActivityIndex(connectionString)
      : new LocalFileActivityIndex();
    await adapter.initialize();
    return adapter;
  })();
  return activityIndexPromise;
}

export { schema as activityIndexSchema };

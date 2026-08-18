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

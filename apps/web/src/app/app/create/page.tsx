import { Container, PageHeader, Stack } from "@/components/layout";
import { Alert } from "@/components/ui";
import { CreateEscrowForm } from "@/features/escrow";
import {
  queryDealRoom,
  requireRoomParticipant,
} from "@/services/deal-room/database";
import { requireWalletSession } from "@/services/deal-room/session";

import styles from "../app-pages.module.css";

async function roomPrefill(roomId?: string) {
  if (!roomId) return undefined;
  try {
    const session = await requireWalletSession();
    const participant = await requireRoomParticipant(roomId, session.address);
    if (participant.role !== "buyer") return undefined;
    const result = await queryDealRoom<{
      seller_address: string;
      document_uri: string;
    }>(
      `select r.seller_address, a.document_uri
       from public.deal_rooms r
       join public.agreement_artifacts a on a.room_id = r.id
       where r.id = $1 and a.immutable = true`,
      [roomId],
    );
    return result.rows[0];
  } catch {
    return undefined;
  }
}

export default async function CreateEscrowPage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string }>;
}) {
  const { room } = await searchParams;
  const prefill = await roomPrefill(room);
  return (
    <Container>
      <Stack gap={8}>
        <PageHeader
          eyebrow="Agreement workspace"
          title="Create Escrow"
          description="Create and fund a native Test ETH escrow atomically on GIWA Sepolia."
          showTestnetBadge
        />
        <Alert
          variant="warning"
          title="GIWA Sepolia testnet"
          description="Test ETH has no monetary value. The deployed AccordPay contract is verified but has not been independently audited."
        />
        <ol className={styles.steps}>
          {["1. Agreement", "2. Payment", "3. Wallet", "4. Confirmation"].map(
            (step) => (
              <li key={step}>{step}</li>
            ),
          )}
        </ol>
        {room && !prefill ? (
          <Alert
            variant="warning"
            title="Accord Chat agreement unavailable"
            description="Authenticate the buyer wallet and finalize an agreement document before creating its escrow."
          />
        ) : null}
        <CreateEscrowForm
          initialSeller={prefill?.seller_address}
          initialMetadataUri={prefill?.document_uri}
          metadataLocked={Boolean(prefill)}
          dealRoomId={prefill ? room : undefined}
        />
      </Stack>
    </Container>
  );
}

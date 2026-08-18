import { PageHeader } from "@/components/layout";
import { ResolverQueue } from "@/components/deal-room";
import { Alert } from "@/components/ui";

export default function ResolverPage() {
  return (
    <>
      <PageHeader
        eyebrow="Designated testnet resolution"
        title="Resolver cases"
        description="Restricted to the current on-chain resolver. This is not decentralized arbitration."
        showTestnetBadge
      />
      <Alert
        variant="warning"
        title="Irreversible payout"
        description="Resolution immediately distributes the full escrow balance according to the selected buyer-share BPS and completes the escrow."
      />
      <ResolverQueue />
    </>
  );
}

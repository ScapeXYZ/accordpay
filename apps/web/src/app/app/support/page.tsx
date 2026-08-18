import { PageHeader } from "@/components/layout";
import { SupportChat } from "@/components/deal-room";

export default function SupportPage() {
  return (
    <>
      <PageHeader
        eyebrow="Private help channel"
        title="AccordPay Support"
        description="Support cannot approve agreements, replace participants, move escrow funds, or resolve disputes."
      />
      <SupportChat />
    </>
  );
}

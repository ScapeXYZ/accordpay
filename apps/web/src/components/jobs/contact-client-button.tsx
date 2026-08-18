"use client";

import { Button } from "@/components/ui";
import { openAccordChat } from "@/components/deal-room/accord-chat-events";

export function ContactClientButton({ jobId }: { jobId: string }) {
  return (
    <Button
      type="button"
      onClick={() => openAccordChat({ view: "job-contact", jobId })}
    >
      Contact client
    </Button>
  );
}

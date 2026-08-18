import type { Metadata } from "next";

import { AccordPayEntrance } from "./accordpay-entrance";

export const metadata: Metadata = {
  title: "AccordPay | Secure Agreements on GIWA",
  description:
    "Secure agreements, verified identities and escrow settlement built for the GIWA ecosystem.",
};

export default function Home() {
  return <AccordPayEntrance />;
}

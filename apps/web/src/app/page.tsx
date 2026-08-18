import type { Metadata } from "next";

import { AccordPayEntrance } from "./accordpay-entrance";

export const metadata: Metadata = {
  title: "AccordPay | Secure Agreements on GIWA",
  description:
    "AccordPay is a GIWA-native escrow platform for secure, funded peer-to-peer agreements with transparent settlement and verified identity context.",
};

export default function Home() {
  return <AccordPayEntrance />;
}

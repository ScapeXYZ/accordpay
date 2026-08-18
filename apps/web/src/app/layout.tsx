import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Providers } from "@/components/providers";
import { themeInitializationScript } from "@/components/app-shell/theme-model";

import "./globals.css";

export const metadata: Metadata = {
  title: "AccordPay",
  description:
    "Verified escrow and programmable commerce infrastructure built on GIWA Chain.",
  icons: {
    icon: "/brand/favicon.svg",
  },
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeInitializationScript }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

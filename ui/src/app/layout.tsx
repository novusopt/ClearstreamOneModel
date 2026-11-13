import "@fontsource-variable/bricolage-grotesque";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/components/app/providers";
import { Shell } from "@/components/app/shell";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Data Product Studio", template: "%s · Data Product Studio" },
  description: "Author data products and their data contracts on open standards.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="text-primary">
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}

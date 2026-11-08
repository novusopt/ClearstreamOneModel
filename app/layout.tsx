import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import { AudioPlayerBar } from "@/components/quran/audio-player-bar";
import { Providers } from "@/components/providers/providers";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import "./globals.css";

const inter = localFont({
  src: "./fonts/inter-latin.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});

const amiriQuran = localFont({
  src: [
    { path: "./fonts/amiri-quran-arabic.woff2", weight: "400" },
    { path: "./fonts/amiri-quran-latin.woff2", weight: "400" },
  ],
  variable: "--font-amiri-quran",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: { default: "Noor — Read, listen & understand the Qurʾān", template: "%s · Noor" },
  description:
    "A modern Qurʾān app with Uthmani text, translations in 10 languages, word-by-word meanings, synced recitation and colour-coded tajweed.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0e12" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${amiriQuran.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col bg-primary text-primary">
        <Providers>
          <a
            href="#main"
            className="sr-only z-50 rounded-lg bg-brand-solid px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
          >
            Skip to content
          </a>
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
          <AudioPlayerBar />
          <Toaster position="bottom-center" offset={104} richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}

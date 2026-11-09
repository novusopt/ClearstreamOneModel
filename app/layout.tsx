import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import { AudioPlayerBar } from "@/components/quran/audio-player-bar";
import { Providers } from "@/components/providers/providers";
import { ServiceWorker } from "@/components/providers/service-worker";
import { CommandPalette } from "@/components/site/command-palette";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { BRAND } from "@/lib/brand";
import { SITE_URL } from "@/lib/site";
import { getChapters } from "@/lib/quran";
import "./globals.css";

const inter = localFont({
  src: "./fonts/inter-latin.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});

// Display face, split by unicode-range: Latin plus Latin-Extended (ā, ḥ, ʾ in transliterations).
// Both are preloaded: headings use them above the fold, and a late swap shifts the layout.
// No synthetic fallback on the first face, so the second one is reached in the font stack.
const fraunces = localFont({
  src: "./fonts/fraunces-latin.woff2",
  weight: "100 900",
  variable: "--font-display-face",
  display: "swap",
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" }],
});

const frauncesExt = localFont({
  src: "./fonts/fraunces-latin-ext.woff2",
  weight: "100 900",
  variable: "--font-display-ext",
  display: "swap",
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02AF, U+02BB-02BC, U+02BE-02BF, U+0304, U+0308, U+0329, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
});

// Qurʾān face: Arabic plus its Latin set (the spaces inside Arabic text come from it), both preloaded
// so the large Arabic text does not re-flow when the font arrives.
const amiriQuran = localFont({
  src: "./fonts/amiri-quran-arabic.woff2",
  weight: "400",
  variable: "--font-amiri-quran",
  display: "swap",
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0600-06FF, U+0750-077F, U+0870-088E, U+0890-0891, U+0898-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC" }],
});

const amiriQuranLatin = localFont({
  src: "./fonts/amiri-quran-latin.woff2",
  weight: "400",
  variable: "--font-amiri-latin",
  display: "swap",
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${BRAND.name}: Read the Qurʾān with Translation, Tafsir & Audio`, template: `%s · ${BRAND.name}` },
  description: BRAND.description,
  // Canonical and og:url are set per page (layout values would be inherited by every page).
  openGraph: { type: "website", siteName: BRAND.name, locale: "en_GB" },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false, address: false, email: false },
  applicationName: BRAND.name,
  appleWebApp: { capable: true, title: BRAND.name, statusBarStyle: "default" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf9f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0d1a" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${fraunces.variable} ${frauncesExt.variable} ${amiriQuran.variable} ${amiriQuranLatin.variable} antialiased`}>
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
          <CommandPalette chapters={getChapters()} />
          <ServiceWorker />
          <Toaster position="bottom-center" offset={112} toastOptions={{ unstyled: true }} />
        </Providers>
      </body>
    </html>
  );
}

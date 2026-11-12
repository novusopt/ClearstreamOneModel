import type { NextConfig } from "next";

/**
 * Security headers. The Content Security Policy allows only what the site loads:
 * - scripts/styles from this origin ('unsafe-inline' is required by Next's inline RSC payload and
 *   JSON-LD on statically rendered pages, and by motion's inline styles);
 * - recitation and word audio from the four audio hosts (lib/audio.ts);
 * - Vercel Analytics / Speed Insights, served same-origin from /_vercel/*;
 * - the Vercel preview toolbar on preview deployments only.
 */
const AUDIO_HOSTS = ["https://cdn.islamic.network", "https://everyayah.com", "https://mirrors.quranicaudio.com", "https://audio.qurancdn.com"];
const isDev = process.env.NODE_ENV !== "production";
const isPreview = process.env.VERCEL_ENV === "preview";
const toolbar = isPreview ? ["https://vercel.live", "https://*.pusher.com", "wss://*.pusher.com"] : [];

const csp = [
  "default-src 'self'",
  ["script-src 'self' 'unsafe-inline'", isDev && "'unsafe-eval' https://va.vercel-scripts.com", ...toolbar].filter(Boolean).join(" "),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:" + (isPreview ? " https://vercel.live https://vercel.com" : ""),
  "font-src 'self' data:" + (isPreview ? " https://vercel.live" : ""),
  `media-src 'self' blob: ${AUDIO_HOSTS.join(" ")}`,
  ["connect-src 'self'", isDev && "ws: https://va.vercel-scripts.com", ...toolbar].filter(Boolean).join(" "),
  "worker-src 'self'",
  "manifest-src 'self'",
  `frame-src ${isPreview ? "https://vercel.live" : "'none'"}`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // React Compiler: measured off. It added 22-31 KB (gzip) of memo-cache code to every page with no
  // gain in main-thread time, because the hot paths already subscribe to narrow store selectors. The code
  // still follows its rules (eslint-plugin-react-hooks), so it can be switched on with babel-plugin-react-compiler.

  // Ayah pages and share images not prebuilt at build time render on first request, so the
  // files they read from disk must ship with those server functions.
  outputFileTracingIncludes: {
    "/surah/[id]/[ayah]": ["./data/quran/**", "./public/data/tafsir/en/**"],
    "/surah/[id]/[ayah]/opengraph-image": ["./data/quran/**", "./lib/og/fonts/**"],
    "/surah/[id]/opengraph-image": ["./data/quran/**", "./lib/og/fonts/**"],
    "/opengraph-image": ["./lib/og/fonts/**"],
    "/page/[n]": ["./data/quran/**"],
    "/[lang]/surah/[id]": ["./data/quran/**", "./public/data/translations/**"],
    "/[lang]/surah/[id]/[ayah]": ["./data/quran/**", "./public/data/translations/**", "./public/data/tafsir/**"],
  },
  experimental: {
    // Import only the icons/helpers actually used from these barrel packages.
    optimizePackageImports: ["@untitledui/icons", "motion"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Generated Qurʾān data (translations, tafsir, search index): unchanged between
        // deploys, so cache for a day and revalidate in the background for a week.
        source: "/data/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
      {
        source: "/icons/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=2592000" }],
      },
    ];
  },
};

export default nextConfig;

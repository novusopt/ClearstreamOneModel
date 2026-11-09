import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Ayah pages and share images not prebuilt at build time render on first request, so the
  // files they read from disk must ship with those server functions.
  outputFileTracingIncludes: {
    "/surah/[id]/[ayah]": ["./data/quran/**", "./public/data/tafsir/en/**", "./public/data/similar/**"],
    "/surah/[id]/[ayah]/opengraph-image": ["./data/quran/**", "./lib/og/fonts/**"],
    "/surah/[id]/opengraph-image": ["./data/quran/**", "./lib/og/fonts/**"],
    "/opengraph-image": ["./lib/og/fonts/**"],
    "/page/[n]": ["./data/quran/**"],
    "/[lang]/surah/[id]": ["./data/quran/**", "./public/data/translations/**"],
    "/[lang]/surah/[id]/[ayah]": ["./data/quran/**", "./public/data/translations/**", "./public/data/tafsir/**", "./public/data/similar/**"],
  },
  experimental: {
    // Import only the icons/helpers actually used from these barrel packages.
    optimizePackageImports: ["@untitledui/icons", "motion"],
  },
  async headers() {
    return [
      {
        // Generated Qurʾān data (translations, tafsir, similar ayat, search index): unchanged between
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

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
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

/**
 * Public origin used for canonical URLs, the sitemap, Open Graph and JSON-LD.
 * Set NEXT_PUBLIC_SITE_URL once a custom domain is connected; on Vercel the production domain
 * is picked up automatically.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://mishkah-livid.vercel.app")
).replace(/\/+$/, "");

export const absoluteUrl = (path = "/") => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

export const surahPath = (surah: number) => `/surah/${surah}`;
export const ayahPath = (surah: number, ayah: number) => `/surah/${surah}/${ayah}`;

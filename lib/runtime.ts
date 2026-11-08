/**
 * Build-time switches. The Next.js app uses the defaults; the single-page claude.ai build
 * (scripts/build-artifact.mjs) sets NEXT_PUBLIC_ARTIFACT=1, where data files are fetched
 * relative to the page and external audio hosts are blocked by the page's security policy.
 */
export const IS_ARTIFACT = process.env.NEXT_PUBLIC_ARTIFACT === "1";
export const DATA_BASE = IS_ARTIFACT ? "data" : "/data";

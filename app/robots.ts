import type { MetadataRoute } from "next";
import { LOCALES } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // Personal pages (library, review, bookmarks) are also marked noindex; the API is data only.
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/library", "/review", "/bookmarks"] }],
    sitemap: ["en", ...LOCALES].map((id) => absoluteUrl(`/sitemap/${id}.xml`)),
  };
}

import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // Personal pages (library, review, bookmarks) are also marked noindex; the API is data only.
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/library", "/review", "/bookmarks"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}

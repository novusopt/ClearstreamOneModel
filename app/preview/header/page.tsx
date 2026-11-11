import type { Metadata } from "next";
import { HeaderPreview } from "@/components/site/header-preview";

export const metadata: Metadata = {
  title: "Top bar designs",
  description: "Compare top bar designs for Mishkah.",
  robots: { index: false, follow: false },
};

export default function HeaderPreviewPage() {
  return <HeaderPreview />;
}

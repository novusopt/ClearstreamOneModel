import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomePage, homeMetadata } from "@/components/home/home-page";
import { isLocale, LOCALES } from "@/lib/i18n";

/** Localized home pages: /fr, /es, /id, /tr, /ur, /bn, /ru, /zh, /sv. */

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

type Params = Promise<{ lang: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang } = await params;
  return isLocale(lang) ? homeMetadata(lang) : {};
}

export default async function LocalizedHome({ params }: { params: Params }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <HomePage lang={lang} />;
}

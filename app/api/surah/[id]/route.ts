import { getChapters, getSurah, isValidSurahId } from "@/lib/quran";

/** Pre-rendered per-surah JSON for client features (review sessions, look-alike ayat). */
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return getChapters().map((c) => ({ id: String(c.id) }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!isValidSurahId(id)) return new Response("Not found", { status: 404 });
  return Response.json(await getSurah(id));
}

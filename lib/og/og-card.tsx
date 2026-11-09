import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/**
 * Open Graph / Twitter card renderer (1200×630) in Mishkah's look: warm paper, a midnight-indigo
 * niche with the lantern, Fraunces headings. Satori cannot shape Arabic script (Amiri's OpenType
 * tables are unsupported), so cards carry Latin text only; the Arabic lives on the page itself.
 *
 * Colours mirror the brand tokens in styles/theme.css and app/globals.css (Satori has no CSS variables).
 */
const C = {
  paper: "rgb(251 249 244)",
  ink: "rgb(24 25 33)",
  muted: "rgb(92 94 110)",
  brand950: "rgb(18 23 52)",
  brand800: "rgb(37 47 104)",
  brand500: "rgb(86 103 186)",
  gold300: "rgb(247 214 153)",
  gold400: "rgb(240 188 92)",
  gold500: "rgb(222 158 52)",
  gold600: "rgb(178 118 28)",
};

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

let fontsPromise: Promise<NonNullable<ConstructorParameters<typeof ImageResponse>[1]>["fonts"]> | null = null;
function loadFonts() {
  const dir = join(process.cwd(), "lib/og/fonts");
  const f = (name: string) => readFile(join(dir, name));
  return (fontsPromise ??= Promise.all([
    f("fraunces-latin-500-normal.woff"),
    f("fraunces-latin-ext-500-normal.woff"),
    f("inter-latin-400-normal.woff"),
    f("inter-latin-600-normal.woff"),
    f("inter-latin-ext-500-normal.woff"),
  ]).then(([fr, frx, i4, i6, ix]) => [
    { name: "Fraunces", data: fr, weight: 500 as const, style: "normal" as const },
    { name: "Fraunces", data: frx, weight: 500 as const, style: "normal" as const },
    { name: "Inter", data: i4, weight: 400 as const, style: "normal" as const },
    { name: "Inter", data: i6, weight: 600 as const, style: "normal" as const },
    { name: "Inter", data: ix, weight: 500 as const, style: "normal" as const },
  ]));
}

/** The lamp-in-a-niche mark, drawn large on the right of the card. */
function Niche() {
  return (
    <svg width="360" height="470" viewBox="0 0 40 52">
      <defs>
        <linearGradient id="n" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.brand500} />
          <stop offset="100%" stopColor={C.brand950} />
        </linearGradient>
        <radialGradient id="l" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={C.gold300} />
          <stop offset="55%" stopColor={C.gold500} stopOpacity="0.85" />
          <stop offset="100%" stopColor={C.gold600} stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d="M2 52 V20 C2 10 10 3.5 20 0.5 C30 3.5 38 10 38 20 V52 Z" fill="url(#n)" />
      <path d="M6 52 V21 C6 13.5 12 8 20 5 C28 8 34 13.5 34 21 V52" fill="none" stroke={C.gold300} strokeOpacity="0.4" strokeWidth="0.5" strokeDasharray="1 1.2" />
      <circle cx="20" cy="29" r="12" fill="url(#l)" />
      <path d="M16 25 C16 22 17.8 20 20 20 C22.2 20 24 22 24 25 C24 29 22.2 33 20 34.2 C17.8 33 16 29 16 25 Z" fill={C.gold300} fillOpacity="0.95" />
      <path d="M16.5 37.5 H23.5 M18.2 34.6 H21.8" stroke={C.gold400} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M20 14.5 V20" stroke={C.gold400} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

interface OgCardProps {
  /** Small line above the title, e.g. "Surah 2 · 286 ayat · Medinan". */
  eyebrow: string;
  title: string;
  subtitle?: string;
  /** Optional quoted text (an ayah's translation). */
  quote?: string;
  footer?: string;
}

export async function ogCard({ eyebrow, title, subtitle, quote, footer = "Arabic · Translation · Word by word · Tafsir · Audio" }: OgCardProps) {
  const titleSize = title.length > 22 ? 64 : title.length > 14 ? 80 : 96;
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: C.paper, fontFamily: "Inter", color: C.ink, position: "relative" }}>
        {/* warm glow */}
        <div style={{ position: "absolute", right: 40, top: 60, width: 520, height: 520, borderRadius: 9999, background: C.gold300, opacity: 0.35, filter: "blur(60px)" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 0 56px 72px", width: 760 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", width: 14, height: 14, transform: "rotate(45deg)", background: C.gold500 }} />
            <div style={{ fontFamily: "Fraunces", fontSize: 32, color: C.brand800 }}>Mishkah</div>
            <div style={{ fontSize: 22, color: C.muted, marginLeft: 6 }}>A lantern for the Qurʾān</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.gold600 }}>{eyebrow}</div>
            <div style={{ fontFamily: "Fraunces", fontSize: titleSize, lineHeight: 1.05, marginTop: 14, color: C.ink }}>{title}</div>
            {subtitle && <div style={{ fontSize: 34, marginTop: 14, color: C.muted }}>{subtitle}</div>}
            {quote && (
              <div style={{ display: "flex", marginTop: 26, paddingLeft: 22, borderLeft: `4px solid ${C.gold400}`, fontSize: 28, lineHeight: 1.4, color: C.ink }}>
                {quote}
              </div>
            )}
          </div>
          <div style={{ fontSize: 22, color: C.muted }}>{footer}</div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", flex: 1, paddingBottom: 0 }}>
          <Niche />
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await loadFonts() },
  );
}

import "server-only";
import type { Lang } from "@/lib/i18n";
import { bn } from "@/lib/ui-messages/bn";
import { en, type Messages } from "@/lib/ui-messages/en";
import { es } from "@/lib/ui-messages/es";
import { fr } from "@/lib/ui-messages/fr";
import { id } from "@/lib/ui-messages/id";
import { ru } from "@/lib/ui-messages/ru";
import { sv } from "@/lib/ui-messages/sv";
import { tr } from "@/lib/ui-messages/tr";
import { ur } from "@/lib/ui-messages/ur";
import { zh } from "@/lib/ui-messages/zh";

/**
 * Server-side catalogue lookup. Catalogues are plain strings with {placeholders} (see lib/ui-format.ts), so
 * a page passes only its own language to the client; the client bundle never contains the catalogues.
 */
const MESSAGES: Record<Lang, Messages> = { en, fr, es, id, tr, ur, bn, ru, zh, sv };
export const getMessages = (lang: Lang): Messages => MESSAGES[lang];

/** Header + footer strings for every language (small; the shared layout picks one from the URL on the client). */
export type ChromeMessages = Pick<Messages, "header" | "footer">;
export const getChromeMessages = (): Record<Lang, ChromeMessages> =>
  Object.fromEntries(Object.entries(MESSAGES).map(([l, m]) => [l, { header: m.header, footer: m.footer }])) as Record<Lang, ChromeMessages>;

/**
 * Hash router for the single-page build. claude.ai pages only carry plain `#name` hashes,
 * so app paths are mapped to names: /surah/2#v-255 → #surah-2-v-255.
 */
export type Route =
  | { view: "home"; section: string | null }
  | { view: "surah"; id: number; verse: number | null }
  | { view: "bookmarks" };

export function pathToHash(href: string): string {
  if (href.startsWith("#")) return href;
  const url = new URL(href, "https://app.local/");
  const path = url.pathname.replace(/\/+$/, "");
  const frag = url.hash.slice(1);
  const surah = path.match(/^\/surah\/(\d+)$/);
  if (surah) {
    const v = frag.match(/^v-(\d+)$/);
    return `#surah-${surah[1]}${v ? `-v-${v[1]}` : ""}`;
  }
  if (path === "/bookmarks") return "#bookmarks";
  return frag ? `#${frag}` : "#home";
}

export function parseHash(hash: string): Route {
  const name = hash.replace(/^#/, "");
  const surah = name.match(/^surah-(\d+)(?:-v-(\d+))?$/);
  if (surah) {
    const id = Number(surah[1]);
    if (id >= 1 && id <= 114) return { view: "surah", id, verse: surah[2] ? Number(surah[2]) : null };
  }
  if (name === "bookmarks") return { view: "bookmarks" };
  return { view: "home", section: name && name !== "home" ? name : null };
}

const listeners = new Set<() => void>();
export const onRouteRequest = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export function navigate(href: string) {
  const hash = pathToHash(href);
  if (window.location.hash === hash || (hash === "#home" && !window.location.hash)) {
    // Same route: re-run its scroll behaviour.
    listeners.forEach((fn) => fn());
  } else {
    window.location.hash = hash;
  }
}

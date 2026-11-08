/**
 * Single-page entry for the claude.ai-hosted build of Mishkah. It renders the same components
 * as the Next.js app, with a hash router and data fetched from files published beside the page.
 */
import { MotionConfig } from "motion/react";
import { ThemeProvider } from "next-themes";
import { type ReactNode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-aria-components";
import { Toaster } from "sonner";
import { BentoFeatures } from "@/components/home/bento-features";
import { ContinueReading } from "@/components/home/continue-reading";
import { FatihahStory } from "@/components/home/fatihah-story";
import { Hero } from "@/components/home/hero";
import { Stats } from "@/components/home/stats";
import { JuzIndex, SurahIndex } from "@/components/home/surah-index";
import { scrollToElement, SmoothScroll, useLenis } from "@/components/providers/smooth-scroll";
import { AudioPlayerBar } from "@/components/quran/audio-player-bar";
import { BookmarkList } from "@/components/quran/bookmark-list";
import { SurahHero } from "@/components/quran/surah-hero";
import { SurahReader } from "@/components/quran/surah-reader";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { ScrollProgress } from "@/components/site/scroll-progress";
import chaptersJson from "@/data/quran/chapters.json";
import type { Chapter, SurahData, Verse } from "@/lib/types";
import { navigate, onRouteRequest, parseHash, pathToHash, type Route } from "./router";

const chapters = chaptersJson as Chapter[];

const cache = new Map<string, Promise<unknown>>();
function load<T>(file: string): Promise<T> {
  if (!cache.has(file)) cache.set(file, fetch(`data/${file}`).then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.statusText)))));
  return cache.get(file) as Promise<T>;
}

function useData<T>(file: string): T | null {
  const [state, setState] = useState<{ file: string; data: T } | null>(null);
  useEffect(() => {
    let live = true;
    load<T>(file).then((data) => live && setState({ file, data }));
    return () => {
      live = false;
    };
  }, [file]);
  return state?.file === file ? state.data : null;
}

function Loading({ label }: { label: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 pt-28 text-tertiary">
      <span className="size-10 animate-spin rounded-full border-2 border-secondary border-t-brand-600" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

function HomeView() {
  const home = useData<{ fatihah: Verse[]; sample: Verse }>("home.json");
  return (
    <>
      <Hero />
      <Stats />
      {home ? <BentoFeatures sample={home.sample} /> : <Loading label="Preparing features" />}
      {home && <FatihahStory verses={home.fatihah} />}
      <div className="mx-auto max-w-7xl px-4 pt-16 md:px-8">
        <ContinueReading chapters={chapters} />
      </div>
      <SurahIndex chapters={chapters} />
      <JuzIndex chapters={chapters} />
    </>
  );
}

function SurahView({ id, verse }: { id: number; verse: number | null }) {
  const data = useData<SurahData>(`surah-${id}.json`);
  const lenis = useLenis();
  const chapter = chapters[id - 1];

  useEffect(() => {
    if (!data || verse == null) return;
    const t = window.setTimeout(() => {
      const el = document.getElementById(`v-${verse}`);
      if (el) scrollToElement(lenis, el, -150);
    }, 350);
    return () => window.clearTimeout(t);
  }, [data, verse, lenis]);

  return (
    <>
      <ScrollProgress />
      <SurahHero chapter={chapter} />
      {data ? (
        <SurahReader key={id} chapter={chapter} verses={data.verses} prev={chapters[id - 2] ?? null} next={chapters[id] ?? null} />
      ) : (
        <Loading label={`Opening ${chapter.nameSimple}`} />
      )}
    </>
  );
}

function BookmarksView() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-32 pb-24">
      <p className="text-sm font-semibold text-brand-secondary">Saved on this device</p>
      <h1 className="mt-2 font-display text-display-sm font-medium tracking-tight text-primary">Bookmarks</h1>
      <BookmarkList chapters={chapters} />
    </div>
  );
}

function useRoute(): [Route, number] {
  const [state, setState] = useState(() => ({ route: parseHash(window.location.hash), n: 0 }));
  useEffect(() => {
    const update = () => setState((s) => ({ route: parseHash(window.location.hash), n: s.n + 1 }));
    window.addEventListener("hashchange", update);
    const off = onRouteRequest(update);
    return () => {
      window.removeEventListener("hashchange", update);
      off();
    };
  }, []);
  return [state.route, state.n];
}

function App() {
  const [route, n] = useRoute();
  const lenis = useLenis();
  const routeKey = route.view === "surah" ? `surah-${route.id}` : route.view;

  // Scroll on navigation: to a home section, or to the top of a new view.
  useEffect(() => {
    if (route.view === "home" && route.section) {
      const t = window.setTimeout(() => {
        const el = document.getElementById(route.section!);
        if (el) scrollToElement(lenis, el, -90);
      }, 60);
      return () => window.clearTimeout(t);
    }
    if (route.view !== "surah" || route.verse == null) {
      if (lenis) lenis.scrollTo(0, { immediate: true });
      else window.scrollTo(0, 0);
    }
  }, [routeKey, n, lenis]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div key={routeKey}>
      {route.view === "home" && <HomeView />}
      {route.view === "surah" && <SurahView id={route.id} verse={route.verse} />}
      {route.view === "bookmarks" && <BookmarksView />}
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" value={{ light: "light-mode", dark: "dark-mode" }} defaultTheme="system" enableSystem disableTransitionOnChange>
      <RouterProvider navigate={navigate} useHref={pathToHash}>
        <MotionConfig reducedMotion="user">
          <SmoothScroll>{children}</SmoothScroll>
        </MotionConfig>
      </RouterProvider>
    </ThemeProvider>
  );
}

createRoot(document.getElementById("mishkah-root")!).render(
  <Shell>
    <div className="flex min-h-dvh flex-col bg-primary text-primary">
      <Header />
      <main id="main" className="flex-1">
        <App />
      </main>
      <Footer />
      <AudioPlayerBar />
      <Toaster position="bottom-center" offset={104} richColors closeButton />
    </div>
  </Shell>,
);

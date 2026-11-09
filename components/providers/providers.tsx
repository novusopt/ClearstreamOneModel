"use client";

import { LazyMotion, MotionConfig } from "motion/react";
import { ThemeProvider } from "next-themes";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { RouterProvider } from "react-aria-components";
import { SmoothScroll } from "@/components/providers/smooth-scroll";

declare module "react-aria-components" {
  interface RouterConfig {
    routerOptions: NonNullable<Parameters<ReturnType<typeof useRouter>["push"]>[1]>;
  }
}

/** Motion features (layout animations included) load in a separate chunk; components use `m.*`. */
export const loadMotionFeatures = () => import("@/lib/motion-features").then((mod) => mod.default);

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();
  return (
    <ThemeProvider attribute="class" value={{ light: "light-mode", dark: "dark-mode" }} defaultTheme="system" enableSystem disableTransitionOnChange>
      <RouterProvider navigate={router.push}>
        <LazyMotion features={loadMotionFeatures} strict>
          <MotionConfig reducedMotion="user">
            <SmoothScroll>{children}</SmoothScroll>
          </MotionConfig>
        </LazyMotion>
      </RouterProvider>
    </ThemeProvider>
  );
}

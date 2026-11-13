"use client";

import { Dataflow03, Package, Plus, RefreshCw01 } from "@untitledui/icons";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { FC, ReactNode } from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { cx } from "@/utils/cx";

const NAV: { href: string; label: string; icon: FC<{ className?: string }>; match: (path: string) => boolean }[] = [
  { href: "/products", label: "Products", icon: Package, match: (path) => path.startsWith("/products") && path !== "/products/new" },
  { href: "/map", label: "Product map", icon: Dataflow03, match: (path) => path.startsWith("/map") },
];

function Mark() {
  return (
    <span aria-hidden className="relative block size-8">
      <span className="absolute top-0 left-0 size-5 rounded-md bg-brand-400" />
      <span className="absolute right-0 bottom-0 size-5 rounded-md border border-ink-900 bg-accent-amber mix-blend-screen" />
    </span>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [resetting, startReset] = useTransition();

  const reset = () =>
    startReset(async () => {
      await api.reset();
      router.push("/products");
      router.refresh();
      toast.success("Sample data restored");
    });

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col bg-ink-900 text-ink-100 lg:flex">
        <Link href="/products" className="flex items-center gap-3 px-5 pt-6 pb-7 outline-brand-300 focus-visible:outline-2">
          <Mark />
          <span className="font-display text-[17px] leading-5 font-semibold tracking-tight text-white">
            Data Product
            <br />
            Studio
          </span>
        </Link>

        <nav aria-label="Main" className="flex flex-col gap-1 px-3">
          {NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium outline-brand-300 transition-colors focus-visible:outline-2",
                  active ? "bg-ink-700 text-white" : "text-ink-300 hover:bg-ink-800 hover:text-white",
                )}
              >
                <item.icon className={cx("size-5", active ? "text-brand-300" : "text-ink-400")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pt-5">
          <Link
            href="/products/new"
            className="flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-3 py-2.5 text-sm font-semibold text-white shadow-xs outline-offset-2 outline-brand-300 transition-colors hover:bg-brand-400 focus-visible:outline-2"
          >
            <Plus className="size-4" />
            New data product
          </Link>
        </div>

        <div className="mt-auto border-t border-ink-700 p-4">
          <p className="flex items-center gap-2 text-xs font-medium text-ink-100">
            <span className="size-1.5 rounded-full bg-accent-amber" />
            Mock backend
          </p>
          <p className="mt-1 text-xs leading-4.5 text-ink-400">Data lives in memory. Pipelines and test results are simulated.</p>
          <button
            type="button"
            onClick={reset}
            disabled={resetting}
            className="mt-3 flex cursor-pointer items-center gap-1.5 rounded text-xs font-medium text-ink-300 outline-brand-300 hover:text-white focus-visible:outline-2 disabled:opacity-50"
          >
            <RefreshCw01 className={cx("size-3.5", resetting && "animate-spin")} />
            Restore sample data
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 bg-ink-900 px-4 py-3 lg:hidden">
          <Link href="/products" className="flex items-center gap-2.5 font-display text-base font-semibold text-white">
            <Mark />
            Data Product Studio
          </Link>
          <nav aria-label="Main" className="flex items-center gap-1">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} aria-label={item.label} className={cx("rounded-lg p-2", item.match(pathname) ? "bg-ink-700 text-white" : "text-ink-300")}>
                <item.icon className="size-5" />
              </Link>
            ))}
            <Link href="/products/new" aria-label="New data product" className="rounded-lg bg-brand-500 p-2 text-white">
              <Plus className="size-5" />
            </Link>
          </nav>
        </header>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

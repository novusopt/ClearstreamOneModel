"use client";

import { AlertCircle, AlertTriangle, ArrowNarrowRight, CheckCircle, Lightbulb02, SearchLg } from "@untitledui/icons";
import Link from "next/link";
import { useState } from "react";
import { ToggleButton, ToggleButtonGroup } from "react-aria-components";
import { Input } from "@/components/base/input/input";
import { Eyebrow, LifecycleBadge, Mono } from "@/components/app/bits";
import { Pick } from "@/components/app/fields";
import { LIFECYCLE_META } from "@/lib/lifecycle";
import type { ProductSummary } from "@/lib/summary";
import type { DataProduct, LifecycleStatus } from "@/lib/types";
import { LIFECYCLE } from "@/lib/types";
import { cx } from "@/utils/cx";

function Health({ product, summary }: { product: DataProduct; summary: ProductSummary }) {
  if (product.status === "proposed") {
    return (
      <span className="flex items-center gap-1.5 text-tertiary">
        <Lightbulb02 className="size-4" />
        Idea, not built yet
      </span>
    );
  }
  if (product.status === "retired") return <span className="text-tertiary">Switched off</span>;
  const policy = summary.policyBlocking + summary.policyWarnings;
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {summary.failingErrors > 0 ? (
        <span className="flex items-center gap-1.5 text-error-primary">
          <AlertCircle className="size-4" />
          Contract failing
        </span>
      ) : summary.failingWarnings > 0 ? (
        <span className="flex items-center gap-1.5 text-warning-primary">
          <AlertTriangle className="size-4" />
          {summary.failingWarnings} quality {summary.failingWarnings === 1 ? "warning" : "warnings"}
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-success-primary">
          <CheckCircle className="size-4" />
          {summary.rules ? "Contract passing" : "No rules yet"}
        </span>
      )}
      {policy > 0 && (
        <span className={cx("flex items-center gap-1.5", summary.policyBlocking ? "text-error-primary" : "text-warning-primary")}>
          {policy} policy {policy === 1 ? "finding" : "findings"}
        </span>
      )}
    </span>
  );
}

export function ProductBrowser({ products, summaries, domains }: { products: DataProduct[]; summaries: Record<string, ProductSummary>; domains: { id: string; name: string }[] }) {
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState<string>();
  const [status, setStatus] = useState<LifecycleStatus | "all">("all");

  const needle = query.trim().toLowerCase();
  const shown = products.filter(
    (product) =>
      (!domain || product.domain === domain) &&
      (status === "all" || product.status === status) &&
      (!needle || [product.title, product.name, product.purpose, product.team, ...product.outputPorts.map((port) => port.name)].some((text) => text.toLowerCase().includes(needle))),
  );
  const statuses = LIFECYCLE.filter((candidate) => products.some((product) => product.status === candidate));

  return (
    <div className="px-5 py-6 sm:px-8">
      <div className="flex flex-wrap items-end gap-3">
        <Input aria-label="Search products" size="sm" icon={SearchLg} placeholder="Search by name, purpose or output" value={query} onChange={setQuery} className="w-full sm:w-80" />
        <Pick ariaLabel="Domain" className="w-48" clearable clearLabel="All domains" value={domain} options={domains.map((item) => ({ id: item.id, label: item.name }))} onChange={setDomain} />
        <ToggleButtonGroup
          aria-label="Lifecycle state"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[status]}
          onSelectionChange={(keys) => setStatus(([...keys][0] as LifecycleStatus | "all") ?? "all")}
          className="flex flex-wrap gap-1 rounded-lg border border-secondary bg-primary p-1"
        >
          {(["all", ...statuses] as const).map((key) => (
            <ToggleButton
              key={key}
              id={key}
              className="cursor-pointer rounded-md px-2.5 py-1 text-sm font-medium text-tertiary outline-brand transition-colors hover:text-secondary focus-visible:outline-2 selected:bg-ink-900 selected:text-white"
            >
              {key === "all" ? "All" : LIFECYCLE_META[key].label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <p aria-live="polite" className="ml-auto text-sm text-tertiary">
          {shown.length} of {products.length}
        </p>
      </div>

      {shown.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-primary bg-dots px-6 py-16 text-center">
          <p className="font-display text-lg font-semibold text-primary">No product matches</p>
          <p className="mt-1 text-sm text-tertiary">Change the search or the filters.</p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {shown.map((product, index) => (
            <li key={product.id} className="animate-rise" style={{ animationDelay: `${index * 45}ms` }}>
              <Link
                href={`/products/${product.domain}/${product.name}`}
                className={cx(
                  "group flex h-full flex-col rounded-xl border bg-primary p-5 shadow-xs outline-offset-2 outline-brand transition-[box-shadow,border-color] hover:border-brand hover:shadow-md focus-visible:outline-2",
                  product.status === "proposed" ? "border-dashed border-primary" : "border-secondary",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <Eyebrow>{product.domain}</Eyebrow>
                  <LifecycleBadge status={product.status} />
                </div>
                <h2 className="mt-2 font-display text-xl font-semibold tracking-tight text-primary group-hover:text-brand-secondary">{product.title}</h2>
                <p className="mt-1.5 line-clamp-2 text-sm text-tertiary">{product.purpose}</p>

                <div className="mt-4 flex flex-wrap items-center gap-1.5 font-mono text-xs">
                  {product.inputPorts.length === 0 && product.outputPorts.length > 0 && <span className="rounded-md bg-secondary px-1.5 py-0.5 text-tertiary">raw source</span>}
                  {product.inputPorts.map((port) => (
                    <span key={port.name} className="rounded-md bg-secondary px-1.5 py-0.5 text-secondary">
                      {port.name}
                    </span>
                  ))}
                  {product.outputPorts.length > 0 && <ArrowNarrowRight className="size-4 text-quaternary" aria-label="produces" />}
                  {product.outputPorts.map((port) => (
                    <span key={port.name} className="rounded-md bg-brand-primary px-1.5 py-0.5 font-medium text-brand-secondary ring-1 ring-brand-200 ring-inset">
                      {port.name}
                    </span>
                  ))}
                </div>

                <div className="mt-auto pt-5">
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-secondary pt-4 text-sm">
                    <Health product={product} summary={summaries[product.id]} />
                    <span className="text-tertiary">
                      {product.team} · <Mono>v{product.version}</Mono>
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

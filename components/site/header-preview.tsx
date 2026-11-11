"use client";

import { ArrowRight, RefreshCcw01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { Button } from "@/components/base/buttons/button";
import { HEADER_VARIANTS, type HeaderVariantId, headerVariantStore, useHeaderVariant } from "@/components/site/header-variants";

/** /preview/header: switch the real, working top bar between designs and try each on any page. */
export function HeaderPreview() {
  const current = useHeaderVariant();
  return (
    <div className="mx-auto max-w-5xl px-4 pt-40 pb-32 sm:px-6">
      <Badge type="pill-color" color="brand" size="md">
        Design preview
      </Badge>
      <h1 className="mt-4 font-display text-display-sm font-medium tracking-tight text-primary">Choose a top bar</h1>
      <p className="mt-2 max-w-2xl text-lg text-tertiary">
        The bar at the top of this page is the real header. Switch between the designs below, then open any page: your choice stays in this
        browser until you reset it. Everyone else still sees the current design.
      </p>

      <div className="mt-8 overflow-x-auto pb-1">
        <ButtonGroup
          size="md"
          selectedKeys={[current.id]}
          disallowEmptySelection
          onSelectionChange={(keys) => headerVariantStore.set({ id: [...keys][0] as HeaderVariantId })}
          aria-label="Top bar design"
        >
          {HEADER_VARIANTS.map((v, i) => (
            <ButtonGroupItem key={v.id} id={v.id}>
              {i + 1} · {v.name}
            </ButtonGroupItem>
          ))}
        </ButtonGroup>
      </div>

      <div className="mt-6 rounded-2xl border border-secondary bg-primary p-6 shadow-xs">
        <p className="text-sm font-semibold text-brand-secondary">Now showing</p>
        <p className="mt-1 font-display text-xl font-medium text-primary">{current.name}</p>
        <p className="mt-1 text-md text-tertiary">{current.description}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button size="sm" color="secondary" href="/" iconTrailing={<ArrowRight data-icon aria-hidden="true" />}>
            Try on the home page
          </Button>
          <Button size="sm" color="secondary" href="/surah/18" iconTrailing={<ArrowRight data-icon aria-hidden="true" />}>
            Try in the reader
          </Button>
          <Button size="sm" color="secondary" href="/library" iconTrailing={<ArrowRight data-icon aria-hidden="true" />}>
            Try in Library
          </Button>
          <Button size="sm" color="tertiary" iconLeading={RefreshCcw01} onPress={() => headerVariantStore.set({ id: "tray" })}>
            Reset to current
          </Button>
        </div>
      </div>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {HEADER_VARIANTS.map((v, i) => (
          <li key={v.id} className="rounded-2xl border border-secondary bg-primary p-5 shadow-xs">
            <p className="flex items-center gap-2 text-md font-semibold text-primary">
              {i + 1} · {v.name}
              {v.id === current.id && (
                <Badge type="pill-color" color="success" size="sm">
                  Showing
                </Badge>
              )}
            </p>
            <p className="mt-1 text-sm text-tertiary">{v.description}</p>
          </li>
        ))}
      </ul>
      <p className="mt-10 text-sm text-quaternary">Scroll down and back up to see the bar hide and return; resize the window for the phone layout.</p>
      <div aria-hidden="true" className="h-[60vh]" />
    </div>
  );
}

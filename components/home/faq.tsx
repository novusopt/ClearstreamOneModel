"use client";

import { ArrowRight } from "@untitledui/icons";
import { Accordion } from "@/components/application/accordion/accordion";
import { Button } from "@/components/base/buttons/button";
import { useUi } from "@/components/providers/ui-messages";

export function Faq() {
  const t = useUi().m.faq;
  return (
    <section id="faq" className="scroll-mt-24 border-t border-secondary py-20 md:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 md:px-8 lg:grid-cols-[1fr_2fr]">
        <div>
          <p className="text-sm font-semibold text-brand-secondary">{t.eyebrow}</p>
          <h2 className="mt-3 font-display text-display-sm font-medium tracking-tight text-primary">{t.title}</h2>
          <p className="mt-4 text-lg text-tertiary">{t.intro}</p>
          <Button className="mt-6" color="link-color" href="/library" iconTrailing={ArrowRight}>
            {t.openLibrary}
          </Button>
        </div>
        <Accordion defaultExpandedKeys={["free"]}>
          {t.items.map((f) => (
            <Accordion.Item key={f.id} id={f.id} title={f.q}>
              {f.a}
            </Accordion.Item>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

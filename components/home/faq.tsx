"use client";

import { ArrowRight } from "@untitledui/icons";
import { Accordion } from "@/components/application/accordion/accordion";
import { Button } from "@/components/base/buttons/button";
import { FAQS } from "@/lib/faq";

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 border-t border-secondary py-20 md:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 md:px-8 lg:grid-cols-[1fr_2fr]">
        <div>
          <p className="text-sm font-semibold text-brand-secondary">Questions</p>
          <h2 className="mt-3 font-display text-display-sm font-medium tracking-tight text-primary">Frequently asked</h2>
          <p className="mt-4 text-lg text-tertiary">About the text, the sources, and how Mishkah keeps your reading private.</p>
          <Button className="mt-6" color="link-color" href="/library" iconTrailing={ArrowRight}>
            Open your library
          </Button>
        </div>
        <Accordion defaultExpandedKeys={["free"]}>
          {FAQS.map((f) => (
            <Accordion.Item key={f.id} id={f.id} title={f.q}>
              {f.a}
            </Accordion.Item>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

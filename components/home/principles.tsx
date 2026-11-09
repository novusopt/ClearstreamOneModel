"use client";

import { Code02, Globe02, Lock01, WifiOff } from "@untitledui/icons";
import { m } from "motion/react";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { useUi } from "@/components/providers/ui-messages";

const ICONS = [Lock01, WifiOff, Globe02, Code02];

export function Principles() {
  const t = useUi().m.principles;
  const PRINCIPLES = t.items.map((item, i) => ({ ...item, icon: ICONS[i] }));
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-brand-secondary">{t.eyebrow}</p>
          <h2 className="mt-3 font-display text-display-sm font-medium tracking-tight text-primary md:text-display-md">
            {t.title}
          </h2>
          <p className="mt-4 text-lg text-tertiary">{t.intro}</p>
        </div>
        <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {PRINCIPLES.map((p, i) => (
            <m.li
              key={p.title}
              initial={{ y: 24 }}
              whileInView={{ y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="border-t border-secondary pt-6"
            >
              <FeaturedIcon icon={p.icon} color="gray" theme="modern" size="lg" />
              <h3 className="mt-5 text-lg font-semibold text-primary">{p.title}</h3>
              <p className="mt-2 text-md text-tertiary">{p.text}</p>
            </m.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

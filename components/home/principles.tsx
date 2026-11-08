"use client";

import { Code02, Globe02, Lock01, WifiOff } from "@untitledui/icons";
import { motion } from "motion/react";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";

const PRINCIPLES = [
  { icon: Lock01, title: "Private by design", text: "No account, no tracking. Bookmarks, notes and your memorisation stay in this browser." },
  { icon: WifiOff, title: "Ready without a connection", text: "Install Mishkah and save every surah, with your translation and tafsir, for the plane or the masjid." },
  { icon: Globe02, title: "Made for every reader", text: "Ten translations, right-to-left where it belongs, keyboard shortcuts, and motion that respects your settings." },
  { icon: Code02, title: "Sources you can check", text: "Every text, translation, timing and explanation is openly licensed and credited, down to the dataset." },
];

export function Principles() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-brand-secondary">Made with care</p>
          <h2 className="mt-3 font-display text-display-sm font-medium tracking-tight text-primary md:text-display-md">
            A quiet place for the Book of Allah
          </h2>
          <p className="mt-4 text-lg text-tertiary">No ads, no feeds, no streaks that shame you. Just the text, its meaning, and the tools to keep it.</p>
        </div>
        <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {PRINCIPLES.map((p, i) => (
            <motion.li
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
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

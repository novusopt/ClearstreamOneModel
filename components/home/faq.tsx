"use client";

import { ArrowRight } from "@untitledui/icons";
import { Accordion } from "@/components/application/accordion/accordion";
import { Button } from "@/components/base/buttons/button";
import { RECITERS, TAFSIR_SOURCE } from "@/lib/constants";

const FAQS = [
  {
    id: "free",
    q: "Is Mishkah free?",
    a: "Yes. There is no account, subscription or advertising. Everything you save (bookmarks, notes, reading plan and memorisation) stays in your browser.",
  },
  {
    id: "text",
    q: "Which text and translations do you use?",
    a: "The Uthmani script of the Madani mushaf (Ḥafṣ ʿan ʿĀṣim), with Saheeh International in English and nine more languages from Tanzil and QuranEnc. Word meanings and tajweed markup come from the Quran.com dataset.",
  },
  {
    id: "audio",
    q: "Who are the reciters?",
    a: `${RECITERS.map((r) => r.name).join(", ")}. With ${RECITERS.find((r) => r.wordSync)?.name}, each word lights up as it is recited.`,
  },
  {
    id: "tafsir",
    q: "Where does the explanation come from?",
    a: `${TAFSIR_SOURCE.name} by the ${TAFSIR_SOURCE.author}: a short, mainstream tafsir written to be read ayah by ayah. It helps you understand; it is not a substitute for learning with qualified teachers.`,
  },
  {
    id: "memorise",
    q: "How does memorisation review work?",
    a: "Mark an ayah as memorised and it comes back for review the next day. Each time you grade yourself, the gap grows (3 days, then a week, then longer) or shrinks if you struggled, so your time goes to the ayat that need it.",
  },
  {
    id: "offline",
    q: "Can I read without a connection?",
    a: "Install Mishkah from your browser’s menu, then choose “Read offline” in your Library to save all 114 surahs with your translation and tafsir. Recitation audio still needs a connection.",
  },
];

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

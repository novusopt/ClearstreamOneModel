"use client";

import { Settings04 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Select } from "@/components/base/select/select";
import { Slider } from "@/components/base/slider/slider";
import { Toggle } from "@/components/base/toggle/toggle";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { TajweedLegend } from "@/components/quran/tajweed-legend";
import { player } from "@/lib/audio-engine";
import { createStore, useStore } from "@/lib/create-store";
import { RECITERS, TAFSIR_LANGS, TAFSIR_SOURCE, TRANSLATIONS } from "@/lib/constants";
import { applyPreset, currentPreset, DISPLAY_PRESETS, type DisplayPreset, setSettings, useSettings } from "@/lib/settings";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";

const ARABIC_SAMPLE = "بِسْمِ ٱللَّهِ";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 border-b border-secondary pb-6 last:border-0">
      <h3 className="text-xs font-semibold tracking-wider text-quaternary uppercase">{title}</h3>
      {children}
    </section>
  );
}

const panelStore = createStore({ open: false });
/** Open the settings panel from elsewhere (e.g. the Display menu on phones). */
export const openReaderSettings = () => panelStore.set({ open: true });

export function ReaderSettings({ className }: { className?: string }) {
  const open = useStore(panelStore, (p) => p.open, { open: false });
  const s = useSettings((x) => x);

  return (
    <SlideoutMenu.Trigger isOpen={open} onOpenChange={(o) => panelStore.set({ open: o })}>
      <Button size="sm" color="secondary" iconLeading={Settings04} aria-label="Reader settings" className={className}>
        <span className="hidden sm:inline">Settings</span>
      </Button>
      <SlideoutMenu isDismissable className="z-50">
        {({ close }) => (
          <>
            <SlideoutMenu.Header onClose={close}>
              <h2 className="text-lg font-semibold text-primary">Reader settings</h2>
              <p className="mt-1 text-sm text-tertiary">Saved on this device.</p>
            </SlideoutMenu.Header>
            <SlideoutMenu.Content data-lenis-prevent>
              <Section title="Display">
                <ButtonGroup
                  size="sm"
                  selectedKeys={currentPreset(s) ? [currentPreset(s)!] : []}
                  onSelectionChange={(k) => {
                    const id = [...k][0];
                    if (id) applyPreset(id as DisplayPreset);
                  }}
                  aria-label="Display preset"
                  className="w-full"
                >
                  {(Object.keys(DISPLAY_PRESETS) as DisplayPreset[]).map((id) => (
                    <ButtonGroupItem key={id} id={id} className="flex-1 justify-center">
                      {DISPLAY_PRESETS[id].label}
                    </ButtonGroupItem>
                  ))}
                </ButtonGroup>
                <p className="text-xs text-tertiary">
                  {currentPreset(s) ? DISPLAY_PRESETS[currentPreset(s)!].description : "Custom: adjust the options below."}
                </p>
                <Toggle
                  label="Show tips"
                  hint="How to use words, audio and search"
                  isSelected={!s.seenTips}
                  onChange={(v) => setSettings({ seenTips: !v })}
                />
              </Section>

              <Section title="Arabic text">
                <Toggle label="Tajweed colours" hint="Colour-code recitation rules" isSelected={s.tajweed} onChange={(v) => setSettings({ tajweed: v })} />
                <div className="space-y-2">
                  <p className="flex justify-between text-sm font-medium text-secondary">Font size <span className="text-tertiary tabular-nums">{s.arabicSize} / 6</span></p>
                  <Slider
                    aria-label="Arabic font size"
                    minValue={1}
                    maxValue={6}
                    step={1}
                    value={s.arabicSize}
                    onChange={(v) => setSettings({ arabicSize: Array.isArray(v) ? v[0] : v })}
                  />
                  <p lang="ar" dir="rtl" className="rounded-xl bg-secondary py-3 text-center font-quran text-3xl text-primary">
                    {ARABIC_SAMPLE}
                  </p>
                </div>
                <TajweedLegend />
              </Section>

              <Section title="Word by word">
                <Toggle label="Show under each word" hint="Inline meaning beneath every Arabic word" isSelected={s.wordByWord} onChange={(v) => setSettings({ wordByWord: v })} />
                <Toggle label="Include transliteration" isSelected={s.wbwTransliteration} isDisabled={!s.wordByWord} onChange={(v) => setSettings({ wbwTransliteration: v })} />
              </Section>

              <Section title="Translation">
                <Toggle label="Show translation" isSelected={s.showTranslation} onChange={(v) => setSettings({ showTranslation: v })} />
                <Select
                  label="Language"
                  selectedKey={s.translation}
                  onSelectionChange={(k) => k && setSettings({ translation: String(k) })}
                  items={TRANSLATIONS.map((t) => ({ id: t.id, label: t.language, supportingText: t.author }))}
                  isDisabled={!s.showTranslation}
                >
                  {(item) => <Select.Item id={item.id} label={item.label} supportingText={item.supportingText} />}
                </Select>
                <Toggle label="Verse transliteration" isSelected={s.showTransliteration} onChange={(v) => setSettings({ showTransliteration: v })} />
                <div className="space-y-2">
                  <p className="flex justify-between text-sm font-medium text-secondary">Translation size <span className="text-tertiary tabular-nums">{s.translationSize} / 5</span></p>
                  <Slider
                    aria-label="Translation font size"
                    minValue={1}
                    maxValue={5}
                    step={1}
                    value={s.translationSize}
                    onChange={(v) => setSettings({ translationSize: Array.isArray(v) ? v[0] : v })}
                  />
                </div>
              </Section>

              <Section title="Explanation (tafsir)">
                <Toggle
                  label="Show under every ayah"
                  hint={`${TAFSIR_SOURCE.name}, by the ${TAFSIR_SOURCE.author}`}
                  isSelected={s.tafsirOpen}
                  onChange={(v) => setSettings({ tafsirOpen: v })}
                />
                <Select
                  label="Language"
                  selectedKey={s.tafsirLang}
                  onSelectionChange={(k) => k && setSettings({ tafsirLang: String(k) })}
                  items={[
                    { id: "auto", label: "Same as translation", supportingText: "English when unavailable" },
                    ...TAFSIR_LANGS.map((id) => ({ id, label: TRANSLATIONS.find((t) => t.id === id)?.language ?? "العربية" })),
                  ]}
                >
                  {(item) => <Select.Item id={item.id} label={item.label} supportingText={item.supportingText} />}
                </Select>
              </Section>

              <Section title="Audio">
                <Select
                  label="Reciter"
                  selectedKey={s.reciter}
                  onSelectionChange={(k) => {
                    if (!k) return;
                    setSettings({ reciter: String(k) });
                    player.reload();
                  }}
                  items={RECITERS.map((r) => ({ id: r.id, label: r.name, supportingText: r.style }))}
                >
                  {(item) => <Select.Item id={item.id} label={item.label} supportingText={item.supportingText} />}
                </Select>
                <Toggle label="Auto-scroll while playing" isSelected={s.autoScroll} onChange={(v) => setSettings({ autoScroll: v })} />
                <Select
                  label="Pause after each ayah"
                  hint="Teaching mode: time to recite the ayah back"
                  selectedKey={String(s.pauseAfter)}
                  onSelectionChange={(k) => k != null && setSettings({ pauseAfter: Number(k) })}
                  items={[
                    { id: "0", label: "Off" },
                    { id: "5", label: "5 seconds" },
                    { id: "10", label: "10 seconds" },
                    { id: "-1", label: "As long as the ayah" },
                  ]}
                >
                  {(item) => <Select.Item id={item.id} label={item.label} />}
                </Select>
              </Section>
            </SlideoutMenu.Content>
          </>
        )}
      </SlideoutMenu>
    </SlideoutMenu.Trigger>
  );
}

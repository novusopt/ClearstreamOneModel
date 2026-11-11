"use client";

import {
  BookOpen01,
  Eye,
  GraduationHat02,
  Headphones02,
  Hourglass03,
  Lightbulb05,
  MessageTextSquare02,
  Palette,
  RefreshCcw01,
  Settings04,
  Translate01,
  Type01,
  Type02,
  ArrowsDown,
  LetterSpacing01,
} from "@untitledui/icons";
import type { FC, ReactNode } from "react";
import { useState } from "react";
import { Radio as AriaRadio, RadioGroup as AriaRadioGroup } from "react-aria-components";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { notify } from "@/components/application/notifications/notification";
import { Tab, TabList, TabPanel, Tabs } from "@/components/application/tabs/tabs";
import { Badge } from "@/components/base/badges/badges";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { Button } from "@/components/base/buttons/button";
import { RadioButtonBase } from "@/components/base/radio-buttons/radio-buttons";
import { Select } from "@/components/base/select/select";
import { Slider } from "@/components/base/slider/slider";
import { Toggle } from "@/components/base/toggle/toggle";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { ReciterAvatar } from "@/components/quran/reciter-avatar";
import { TajweedLegend } from "@/components/quran/tajweed-legend";
import { TajweedText } from "@/components/quran/tajweed-text";
import { useTranslationText } from "@/components/quran/use-translation";
import { player } from "@/lib/audio-engine";
import { RECITERS, TAFSIR_LANGS, TAFSIR_SOURCE, TRANSLATIONS } from "@/lib/constants";
import { dataUrl } from "@/lib/data-urls";
import {
  applyPreset,
  ARABIC_SIZES,
  currentPreset,
  DEFAULT_SETTINGS,
  DISPLAY_PRESETS,
  type DisplayPreset,
  type ReaderSettings,
  setSettings,
  settingsStore,
  TRANSLATION_SIZES,
  useSettings,
} from "@/lib/settings";
import type { Verse } from "@/lib/types";
import { useRemote } from "@/lib/use-remote";
import { cx } from "@/utils/cx";

type Icon = FC<{ className?: string }>;

const PRESET_ICONS: Record<DisplayPreset, Icon> = {
  read: BookOpen01,
  study: GraduationHat02,
  arabic: Type01,
};

/** What "Reset" restores: everything this panel controls (not the view mode, tips or memorise options). */
const RESETTABLE = [
  "translation",
  "showTranslation",
  "showTransliteration",
  "wordByWord",
  "wbwTransliteration",
  "tajweed",
  "arabicSize",
  "translationSize",
  "reciter",
  "autoScroll",
  "tafsirOpen",
  "tafsirLang",
  "pauseAfter",
] as const satisfies ReadonlyArray<keyof ReaderSettings>;

const pick = (s: ReaderSettings) => Object.fromEntries(RESETTABLE.map((k) => [k, s[k]])) as Partial<ReaderSettings>;
const isDefault = (s: ReaderSettings) => RESETTABLE.every((k) => s[k] === DEFAULT_SETTINGS[k]);

const ARABIC_SIZE_LABELS = ["Small", "Medium", "Large", "Larger", "Very large", "Largest"];
const TRANSLATION_SIZE_LABELS = ["Small", "Medium", "Large", "Larger", "Largest"];

/* ---------------------------------------------------------------------------------------------- */

/** A titled group of setting rows in one bordered card (Untitled UI settings anatomy). */
function Group({ title, hint, children }: { title: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-primary">{title}</h3>
        {hint && <p className="mt-0.5 text-sm text-tertiary">{hint}</p>}
      </div>
      <div className="divide-y divide-secondary rounded-xl bg-primary shadow-xs ring-1 ring-secondary">{children}</div>
    </section>
  );
}

function Row({ icon: RowIcon, children, className }: { icon: Icon; children: ReactNode; className?: string }) {
  return (
    <div className={cx("flex items-start gap-3 px-4 py-3.5", className)}>
      <RowIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-fg-quaternary" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function ToggleRow(props: { icon: Icon; label: string; hint?: string; isSelected: boolean; isDisabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <Row icon={props.icon}>
      <Toggle
        size="sm"
        label={props.label}
        hint={props.hint}
        isSelected={props.isSelected}
        isDisabled={props.isDisabled}
        onChange={props.onChange}
        className="w-full flex-row-reverse justify-between gap-4"
      />
    </Row>
  );
}

function SliderRow(props: { icon: Icon; label: string; value: number; max: number; labels: string[]; onChange: (v: number) => void }) {
  return (
    <Row icon={props.icon}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-secondary">{props.label}</p>
        <Badge type="modern" color="gray" size="sm">
          {props.labels[props.value - 1]}
        </Badge>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <Type02 aria-hidden="true" className="size-3.5 shrink-0 text-fg-quaternary" />
        <div className="min-w-0 flex-1">
          <Slider
            aria-label={props.label}
            minValue={1}
            maxValue={props.max}
            step={1}
            value={props.value}
            formatOptions={{ style: "decimal" }}
            onChange={(v) => props.onChange(Array.isArray(v) ? v[0] : v)}
          />
        </div>
        <Type02 aria-hidden="true" className="size-5 shrink-0 text-fg-quaternary" />
      </div>
    </Row>
  );
}

/* ---------------------------------------------------------------------------------------------- */

/** Al-Fatihah 1:2 rendered with the current settings, so every change is visible at once. */
function Preview({ s }: { s: ReaderSettings }) {
  const surah = useRemote<{ verses: Verse[] }>(dataUrl.surah(1));
  const v = surah?.verses[1];
  const { texts } = useTranslationText(1, s.translation);
  const translation = s.translation === "en" ? v?.en : texts?.[1];
  const rtl = TRANSLATIONS.find((t) => t.id === s.translation)?.rtl;
  const preset = currentPreset(s);

  return (
    <figure aria-label="Preview" className="overflow-hidden rounded-2xl bg-secondary ring-1 ring-secondary">
      <figcaption className="flex items-center justify-between gap-2 border-b border-secondary bg-primary/60 px-4 py-2.5">
        <span className="flex items-center gap-1.5 text-xs font-medium text-tertiary">
          <Eye aria-hidden="true" className="size-3.5 text-fg-quaternary" />
          Preview · Al-Fatihah 1:2
        </span>
        <Badge type="pill-color" color={preset ? "brand" : "gray"} size="sm">
          {preset ? DISPLAY_PRESETS[preset].label : "Custom"}
        </Badge>
      </figcaption>
      <div className="space-y-3 px-4 py-5">
        {!v ? (
          <div aria-hidden="true" className="space-y-3">
            <div className="ml-auto h-9 w-3/4 animate-pulse rounded-lg bg-quaternary" />
            <div className="h-4 w-full animate-pulse rounded bg-quaternary" />
          </div>
        ) : (
          <>
            <p lang="ar" dir="rtl" className={cx("flex flex-wrap gap-x-3 gap-y-2 font-quran leading-[1.9] text-primary", ARABIC_SIZES[s.arabicSize - 1])}>
              {v.w.map((w, i) => (
                <span key={i} className="inline-flex flex-col items-center">
                  <span>{s.tajweed ? <TajweedText value={w.j} /> : w.a}</span>
                  {s.wordByWord && (
                    <span dir="ltr" lang="en" className="font-body -mt-1 text-center text-xs leading-tight text-tertiary">
                      {s.wbwTransliteration && <span className="block text-quaternary italic">{w.t}</span>}
                      {w.e}
                    </span>
                  )}
                </span>
              ))}
            </p>
            {s.showTransliteration && <p className="text-sm text-tertiary italic">{v.tr}</p>}
            {s.showTranslation &&
              (translation ? (
                <p dir={rtl ? "rtl" : undefined} className={cx("text-secondary", TRANSLATION_SIZES[s.translationSize - 1])}>
                  {translation}
                </p>
              ) : (
                <div aria-hidden="true" className="h-4 w-full animate-pulse rounded bg-quaternary" />
              ))}
            {s.tafsirOpen && (
              <p className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs text-tertiary ring-1 ring-secondary">
                <MessageTextSquare02 aria-hidden="true" className="size-3.5 text-fg-quaternary" />
                Tafsir opens under every ayah
              </p>
            )}
          </>
        )}
      </div>
    </figure>
  );
}

/** Display presets as selectable cards (Untitled UI radio card anatomy). */
function PresetCards({ s }: { s: ReaderSettings }) {
  const preset = currentPreset(s);
  return (
    <div className="space-y-2">
      <AriaRadioGroup
        aria-label="Display preset"
        value={preset ?? ""}
        onChange={(id) => id && applyPreset(id as DisplayPreset)}
        className="grid grid-cols-3 gap-2"
      >
        {(Object.keys(DISPLAY_PRESETS) as DisplayPreset[]).map((id) => (
          <AriaRadio
            key={id}
            value={id}
            className={({ isSelected, isFocusVisible }) =>
              cx(
                "relative flex cursor-pointer flex-col gap-2.5 rounded-xl bg-primary p-3 ring-1 ring-secondary transition outline-focus-ring ring-inset hover:bg-primary_hover",
                isSelected && "bg-brand-primary_alt ring-2 ring-brand hover:bg-brand-primary_alt",
                isFocusVisible && "outline-2 outline-offset-2",
              )
            }
          >
            {({ isSelected }) => (
              <>
                <div className="flex items-start justify-between">
                  <FeaturedIcon icon={PRESET_ICONS[id]} color={isSelected ? "brand" : "gray"} theme="modern" size="sm" />
                  <RadioButtonBase size="sm" isSelected={isSelected} />
                </div>
                <span className={cx("text-sm font-semibold", isSelected ? "text-brand-secondary" : "text-secondary")}>{DISPLAY_PRESETS[id].label}</span>
              </>
            )}
          </AriaRadio>
        ))}
      </AriaRadioGroup>
      <p className="text-sm text-tertiary">{preset ? DISPLAY_PRESETS[preset].description : "Custom: your own mix of the options below."}</p>
    </div>
  );
}

function ReciterCards({ value }: { value: string }) {
  return (
    <AriaRadioGroup
      aria-label="Reciter"
      value={value}
      onChange={(id) => {
        setSettings({ reciter: id });
        player.reload();
      }}
      className="divide-y divide-secondary"
    >
      {RECITERS.map((r) => (
        <AriaRadio
          key={r.id}
          value={r.id}
          className={({ isSelected, isFocusVisible }) =>
            cx(
              "flex cursor-pointer items-center gap-3 px-4 py-3 outline-focus-ring transition first:rounded-t-xl last:rounded-b-xl hover:bg-primary_hover",
              isSelected && "bg-brand-primary_alt hover:bg-brand-primary_alt",
              isFocusVisible && "outline-2 -outline-offset-2",
            )
          }
        >
          {({ isSelected }) => (
            <>
              <ReciterAvatar reciter={r} size="md" />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className={cx("truncate text-sm font-semibold", isSelected ? "text-brand-secondary" : "text-secondary")}>{r.name}</span>
                  {r.wordSync && (
                    <Badge type="pill-color" color="success" size="sm">
                      Word sync
                    </Badge>
                  )}
                </span>
                <span lang="ar" dir="rtl" className="mt-0.5 block text-left font-quran text-sm text-tertiary">
                  {r.arabic}
                </span>
              </span>
              <RadioButtonBase size="md" isSelected={isSelected} />
            </>
          )}
        </AriaRadio>
      ))}
    </AriaRadioGroup>
  );
}

/* ---------------------------------------------------------------------------------------------- */

/** The settings slideout: loaded the first time the panel opens (see ReaderSettings). */
export default function ReaderSettingsPanel() {
  const s = useSettings((x) => x);
  const [tab, setTab] = useState<string>("text");

  const reset = () => {
    const before = pick(settingsStore.get());
    const reciterChanged = before.reciter !== DEFAULT_SETTINGS.reciter;
    setSettings(pick(DEFAULT_SETTINGS));
    if (reciterChanged) player.reload();
    notify.success("Reader settings reset", {
      id: "settings-reset",
      action: {
        label: "Undo",
        onPress: () => {
          setSettings(before);
          if (reciterChanged) player.reload();
        },
      },
    });
  };

  return (
    <SlideoutMenu isDismissable className="z-50">
      {({ close }) => (
        <>
          <SlideoutMenu.Header onClose={close} className="pr-12">
            <div className="flex items-start gap-3">
              <FeaturedIcon icon={Settings04} color="gray" theme="modern" size="md" className="shrink-0" />
              <div>
                <h2 className="text-lg font-semibold text-primary">Reader settings</h2>
                <p className="text-sm text-tertiary">Changes apply at once and are saved on this device.</p>
              </div>
            </div>
          </SlideoutMenu.Header>

          <SlideoutMenu.Content data-lenis-prevent className="gap-6 pb-6 *:shrink-0">
            <Preview s={s} />
            <PresetCards s={s} />

            <Tabs selectedKey={tab} onSelectionChange={(k) => setTab(String(k))}>
              <TabList
                type="button-minimal"
                size="sm"
                fullWidth
                aria-label="Settings sections"
                items={[
                  { id: "text", label: "Text", icon: Type01 },
                  { id: "meaning", label: "Meaning", icon: Translate01 },
                  { id: "audio", label: "Audio", icon: Headphones02 },
                ]}
                className="w-full [&>*]:flex-1 [&>*]:justify-center"
              >
                {(item) => <Tab {...item} />}
              </TabList>

              <TabPanel id="text" className="mt-5 space-y-6 outline-hidden">
                <Group title="Arabic text">
                  <ToggleRow
                    icon={Palette}
                    label="Tajweed colours"
                    hint="Colour-code the recitation rules"
                    isSelected={s.tajweed}
                    onChange={(v) => setSettings({ tajweed: v })}
                  />
                  <SliderRow
                    icon={Type01}
                    label="Arabic size"
                    value={s.arabicSize}
                    max={6}
                    labels={ARABIC_SIZE_LABELS}
                    onChange={(v) => setSettings({ arabicSize: v })}
                  />
                  <Row icon={Lightbulb05}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-secondary">What the colours mean</p>
                        <p className="text-sm text-tertiary">Mishkah&apos;s tajweed palette</p>
                      </div>
                      <TajweedLegend compact />
                    </div>
                  </Row>
                </Group>

                <Group title="Word by word" hint="Hover or tap any word for its meaning, even with these off.">
                  <ToggleRow
                    icon={LetterSpacing01}
                    label="Meaning under each word"
                    hint="English gloss beneath every Arabic word"
                    isSelected={s.wordByWord}
                    onChange={(v) => setSettings({ wordByWord: v })}
                  />
                  <ToggleRow
                    icon={Type02}
                    label="Word transliteration"
                    hint={s.wordByWord ? "Pronunciation above each meaning" : "Turn on meanings first"}
                    isSelected={s.wbwTransliteration}
                    isDisabled={!s.wordByWord}
                    onChange={(v) => setSettings({ wbwTransliteration: v })}
                  />
                </Group>

                <Group title="Help">
                  <ToggleRow
                    icon={Lightbulb05}
                    label="Show reading tips"
                    hint="How to use words, audio and search"
                    isSelected={!s.seenTips}
                    onChange={(v) => setSettings({ seenTips: !v })}
                  />
                </Group>
              </TabPanel>

              <TabPanel id="meaning" className="mt-5 space-y-6 outline-hidden">
                <Group title="Translation">
                  <ToggleRow icon={Translate01} label="Show translation" isSelected={s.showTranslation} onChange={(v) => setSettings({ showTranslation: v })} />
                  <Row icon={BookOpen01}>
                    <Select
                      label="Language"
                      size="sm"
                      selectedKey={s.translation}
                      onSelectionChange={(k) => k && setSettings({ translation: String(k) })}
                      items={TRANSLATIONS.map((t) => ({
                        id: t.id,
                        label: t.language,
                        supportingText: t.author,
                      }))}
                      isDisabled={!s.showTranslation}
                    >
                      {(item) => <Select.Item id={item.id} label={item.label} supportingText={item.supportingText} />}
                    </Select>
                  </Row>
                  <SliderRow
                    icon={Type02}
                    label="Translation size"
                    value={s.translationSize}
                    max={5}
                    labels={TRANSLATION_SIZE_LABELS}
                    onChange={(v) => setSettings({ translationSize: v })}
                  />
                  <ToggleRow
                    icon={LetterSpacing01}
                    label="Ayah transliteration"
                    hint="The whole ayah in Latin letters"
                    isSelected={s.showTransliteration}
                    onChange={(v) => setSettings({ showTransliteration: v })}
                  />
                </Group>

                <Group title="Tafsir" hint={`${TAFSIR_SOURCE.name}, by the ${TAFSIR_SOURCE.author}.`}>
                  <ToggleRow
                    icon={MessageTextSquare02}
                    label="Open under every ayah"
                    hint="Otherwise one tap away on each ayah"
                    isSelected={s.tafsirOpen}
                    onChange={(v) => setSettings({ tafsirOpen: v })}
                  />
                  <Row icon={Translate01}>
                    <Select
                      label="Tafsir language"
                      size="sm"
                      selectedKey={s.tafsirLang}
                      onSelectionChange={(k) => k && setSettings({ tafsirLang: String(k) })}
                      items={[
                        {
                          id: "auto",
                          label: "Same as translation",
                          supportingText: "English when unavailable",
                        },
                        ...TAFSIR_LANGS.map((id) => ({
                          id,
                          label: TRANSLATIONS.find((t) => t.id === id)?.language ?? "العربية",
                        })),
                      ]}
                    >
                      {(item) => <Select.Item id={item.id} label={item.label} supportingText={item.supportingText} />}
                    </Select>
                  </Row>
                </Group>
              </TabPanel>

              <TabPanel id="audio" className="mt-5 space-y-6 outline-hidden">
                <Group title="Reciter" hint="Words light up with the recitation for Al-Husary.">
                  <ReciterCards value={s.reciter} />
                </Group>

                <Group title="Playback">
                  <ToggleRow
                    icon={ArrowsDown}
                    label="Follow the recitation"
                    hint="Scroll to the ayah being recited"
                    isSelected={s.autoScroll}
                    onChange={(v) => setSettings({ autoScroll: v })}
                  />
                  <Row icon={Hourglass03}>
                    <p className="text-sm font-medium text-secondary">Pause after each ayah</p>
                    <p className="text-sm text-tertiary">Teaching mode: time to recite it back</p>
                    <ButtonGroup
                      size="sm"
                      aria-label="Pause after each ayah"
                      selectedKeys={[String(s.pauseAfter)]}
                      onSelectionChange={(k) => {
                        const id = [...k][0];
                        if (id != null) setSettings({ pauseAfter: Number(id) });
                      }}
                      className="mt-3 w-full"
                    >
                      {[
                        { id: "0", label: "Off" },
                        { id: "5", label: "5 s" },
                        { id: "10", label: "10 s" },
                        { id: "-1", label: "Ayah length" },
                      ].map((o) => (
                        <ButtonGroupItem key={o.id} id={o.id} className="flex-1 justify-center">
                          {o.label}
                        </ButtonGroupItem>
                      ))}
                    </ButtonGroup>
                  </Row>
                </Group>
              </TabPanel>
            </Tabs>
          </SlideoutMenu.Content>

          <SlideoutMenu.Footer className="flex items-center justify-between gap-3">
            <Button size="sm" color="link-gray" iconLeading={RefreshCcw01} onPress={reset} isDisabled={isDefault(s)}>
              Reset to defaults
            </Button>
            <Button size="md" onPress={close}>
              Done
            </Button>
          </SlideoutMenu.Footer>
        </>
      )}
    </SlideoutMenu>
  );
}

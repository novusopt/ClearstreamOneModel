"use client";

import { Copy01, Download01, Share07, Trash01 } from "@untitledui/icons";
import { useEffect, useRef, useState } from "react";
import { Heading as AriaHeading } from "react-aria-components";
import { notify } from "@/components/application/notifications/notification";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { TextArea } from "@/components/base/textarea/textarea";
import { BRAND } from "@/lib/brand";
import { useStore } from "@/lib/create-store";
import { closeVerseDialog as close, type DialogTarget, dialogStore, EMPTY_DIALOG as EMPTY } from "@/components/quran/verse-dialogs";
import { libraryStore, saveNote, verseKey } from "@/lib/library";
import { IS_ARTIFACT } from "@/lib/runtime";

/** One shared instance per page: the note editor and the share-as-image card. */
export default function VerseDialogsContent() {
  const target = useStore(dialogStore, (s) => s, EMPTY);
  return (
    <ModalOverlay isDismissable isOpen={target.kind != null} onOpenChange={(o) => !o && close()}>
      <Modal className={target.kind === "note" ? "max-w-lg" : "max-w-2xl"}>
        <Dialog aria-label={target.kind === "image" ? "Share as image" : "Note"}>
          {target.kind === "note" && <NoteEditor key={`${target.surah}:${target.ayah}`} target={target} />}
          {target.kind === "image" && <ImageCard key={`${target.surah}:${target.ayah}`} target={target} />}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 pt-6">
      <div>
        <AriaHeading slot="title" className="text-lg font-semibold text-primary">
          {title}
        </AriaHeading>
        <p className="mt-1 text-sm text-tertiary">{subtitle}</p>
      </div>
      <CloseButton size="sm" onClick={close} />
    </div>
  );
}

function NoteEditor({ target }: { target: DialogTarget }) {
  const key = verseKey(target.surah, target.ayah);
  const existing = libraryStore.get().notes[key]?.text ?? "";
  const [text, setText] = useState(existing);

  const save = () => {
    saveNote(target.surah, target.ayah, text);
    if (text.trim()) notify.success("Note saved", { description: `${target.surahName} ${key} · find it in your Library` });
    else notify.neutral(`Note removed from ${key}`);
    close();
  };

  return (
    <>
      <Header title={existing ? "Edit note" : "Add a note"} subtitle={`${target.surahName} ${key} · saved on this device`} />
      <div className="space-y-4 px-6 pt-5">
        <p lang="ar" dir="rtl" className="line-clamp-2 rounded-xl bg-secondary px-4 py-3 font-quran text-2xl text-secondary">
          {target.arabic}
        </p>
        <TextArea
          autoFocus
          label="Your reflection"
          placeholder="What does this ayah mean to you?"
          rows={5}
          value={text}
          onChange={setText}
          hint={`${text.length} characters`}
        />
      </div>
      <div className="mt-6 flex items-center justify-between gap-3 border-t border-secondary px-6 py-4">
        {existing ? (
          <Button
            color="tertiary-destructive"
            size="sm"
            iconLeading={Trash01}
            onPress={() => {
              saveNote(target.surah, target.ayah, "");
              notify.neutral(`Note removed from ${key}`, {
                action: { label: "Undo", onPress: () => saveNote(target.surah, target.ayah, existing) },
              });
              close();
            }}
          >
            Delete
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button color="secondary" onPress={close}>
            Cancel
          </Button>
          <Button onPress={save} isDisabled={!text.trim() && !existing}>
            Save note
          </Button>
        </div>
      </div>
    </>
  );
}

/* ---------- Share as image ---------- */

const W = 1080;
const H = 1350;

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function cssVar(name: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

async function drawCard(canvas: HTMLCanvasElement, t: DialogTarget) {
  const quran = cssVar("--font-quran", '"Amiri Quran", serif');
  const display = '"Fraunces", Georgia, serif';
  const body = cssVar("--font-body", "Inter, sans-serif");
  await Promise.all([document.fonts.load(`64px ${quran}`), document.fonts.load(`40px ${display}`), document.fonts.load(`30px ${body}`)]).catch(() => undefined);

  const ctx = canvas.getContext("2d")!;
  canvas.width = W;
  canvas.height = H;

  // Midnight niche with a lantern glow.
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, cssVar("--color-brand-900", "rgb(31 39 84)"));
  bg.addColorStop(1, cssVar("--color-brand-950", "rgb(18 23 52)"));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 380, 20, W / 2, 380, 620);
  glow.addColorStop(0, "rgba(240, 188, 92, 0.28)");
  glow.addColorStop(1, "rgba(240, 188, 92, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Arch frame.
  ctx.strokeStyle = "rgba(247, 214, 153, 0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(90, H - 90);
  ctx.lineTo(90, 420);
  ctx.bezierCurveTo(90, 220, 330, 110, W / 2, 70);
  ctx.bezierCurveTo(W - 330, 110, W - 90, 220, W - 90, 420);
  ctx.lineTo(W - 90, H - 90);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Lay out Arabic (right-to-left) and translation first, shrinking for long ayat, then centre the
  // block between the arch top and the reference line.
  const TOP = 240;
  const BOTTOM = H - 270;
  ctx.direction = "rtl";
  let size = 76;
  let lines: string[] = [];
  do {
    ctx.font = `${size}px ${quran}`;
    lines = wrap(ctx, t.arabic, W - 260);
    size -= 4;
  } while (lines.length * (size + 4) * 1.9 > (BOTTOM - TOP) * 0.55 && size > 30);
  const arabicLine = (size + 4) * 1.9;
  const arabicFont = `${size + 4}px ${quran}`;
  const maxArabic = Math.max(1, Math.floor(((BOTTOM - TOP) * 0.55) / arabicLine));
  if (lines.length > maxArabic) lines = [...lines.slice(0, maxArabic - 1), `${lines[maxArabic - 1]} …`];

  ctx.direction = "ltr";
  let tSize = 36;
  let tLines: string[] = [];
  const room = () => BOTTOM - TOP - lines.length * arabicLine - 50;
  do {
    ctx.font = `${tSize}px ${body}`;
    tLines = wrap(ctx, t.translation, W - 300);
    tSize -= 2;
  } while (tLines.length * (tSize + 2) * 1.5 > room() && tSize > 20);
  const tLine = (tSize + 2) * 1.5;
  const tFont = `${tSize + 2}px ${body}`;
  // Very long ayat (e.g. 2:282): keep the card legible and point to the full text.
  const maxT = Math.max(1, Math.floor(room() / tLine));
  if (tLines.length > maxT) tLines = [...tLines.slice(0, maxT - 1), `${tLines[maxT - 1].replace(/\s+\S*$/, "")} …`];

  const blockH = lines.length * arabicLine + 50 + tLines.length * tLine;
  let y = TOP + Math.max(0, (BOTTOM - TOP - blockH) / 2) + arabicLine * 0.75;

  ctx.direction = "rtl";
  ctx.font = arabicFont;
  ctx.fillStyle = "#fbf3de";
  for (const line of lines) {
    ctx.fillText(line, W / 2, y);
    y += arabicLine;
  }
  ctx.direction = "ltr";
  ctx.font = tFont;
  ctx.fillStyle = "rgba(255, 255, 255, 0.86)";
  y += 50 - arabicLine * 0.25;
  for (const line of tLines) {
    ctx.fillText(line, W / 2, y);
    y += tLine;
  }

  // Reference and brand.
  ctx.fillStyle = "rgb(240, 188, 92)";
  ctx.font = `italic 40px ${display}`;
  ctx.fillText(`${t.surahName} · ${t.surah}:${t.ayah}`, W / 2, H - 190);
  ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
  ctx.font = `500 26px ${body}`;
  ctx.fillText(`${BRAND.name} · ${BRAND.tagline}`, W / 2, H - 135);
}

function ImageCard({ target }: { target: DialogTarget }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const name = `${BRAND.storagePrefix}-${target.surah}-${target.ayah}.png`;

  useEffect(() => {
    if (canvasRef.current) void drawCard(canvasRef.current, target).then(() => setReady(true));
  }, [target]);

  const blob = () => new Promise<Blob | null>((res) => canvasRef.current?.toBlob(res, "image/png"));

  const copy = async () => {
    const b = await blob();
    try {
      if (!b) throw new Error("no image");
      await navigator.clipboard.write([new ClipboardItem({ "image/png": b })]);
      notify.success("Image copied", { description: "Paste it into a message or post." });
    } catch {
      notify.error("Couldn't copy the image", { description: "Your browser doesn't allow copying images. Use Share instead." });
    }
  };

  const share = async () => {
    const b = await blob();
    const file = b && new File([b], name, { type: "image/png" });
    if (file && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: `${target.surahName} ${target.surah}:${target.ayah}` }).catch(() => undefined);
    } else void copy();
  };

  const download = () => {
    const a = document.createElement("a");
    a.href = canvasRef.current!.toDataURL("image/png");
    a.download = name;
    a.click();
  };

  return (
    <>
      <Header title="Share as image" subtitle={`${target.surahName} ${target.surah}:${target.ayah} · 1080 × 1350 px`} />
      <div className="px-6 pt-5">
        <canvas
          ref={canvasRef}
          aria-label={`Image of ${target.surahName} ${target.surah}:${target.ayah}`}
          className={`mx-auto aspect-[4/5] w-full max-w-sm rounded-2xl shadow-lg ring-1 ring-secondary transition-opacity ${ready ? "opacity-100" : "opacity-0"}`}
        />
      </div>
      <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-secondary px-6 py-4">
        <Button color="secondary" iconLeading={Copy01} onPress={copy} isDisabled={!ready}>
          Copy image
        </Button>
        {!IS_ARTIFACT && (
          <Button color="secondary" iconLeading={Download01} onPress={download} isDisabled={!ready}>
            Download
          </Button>
        )}
        <Button iconLeading={Share07} onPress={share} isDisabled={!ready}>
          Share
        </Button>
      </div>
    </>
  );
}

import { cx } from "@/utils/cx";

/** Describe a hizb quarter (1–240): "Ḥizb 5", "Ḥizb 5 · ¼", "· ½", "· ¾". */
export function quarterLabel(q: number): string {
  const hizb = Math.ceil(q / 4);
  const part = ["", " · ¼", " · ½", " · ¾"][(q - 1) % 4];
  return `Ḥizb ${hizb}${part}`;
}

/** The mushaf's rub el hizb sign (۞) where a hizb quarter begins. */
export function HizbMark({ q, className }: { q: number; className?: string }) {
  return (
    <span
      role="img"
      aria-label={`${quarterLabel(q)} begins`}
      title={`${quarterLabel(q)} begins`}
      className={cx("mx-1 inline-block align-middle font-quran text-gold-600 dark:text-gold-400", className)}
    >
      ۞
    </span>
  );
}

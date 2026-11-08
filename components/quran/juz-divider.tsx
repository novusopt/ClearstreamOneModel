import { toArabicNumber } from "@/lib/utils";

/** Marks where a new juzʾ begins inside the verse list. */
export function JuzDivider({ juz }: { juz: number }) {
  return (
    <div role="separator" aria-label={`Juzʾ ${juz} begins`} className="flex items-center gap-4 border-b border-secondary bg-secondary/60 px-4 py-3 sm:px-8">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold-400/60" />
      <span className="flex items-center gap-2 text-sm font-semibold text-gold-600 dark:text-gold-400">
        <span aria-hidden="true">۞</span>
        Juzʾ {juz}
        <span lang="ar" className="font-quran text-lg font-normal">
          الجزء {toArabicNumber(juz)}
        </span>
      </span>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold-400/60" />
    </div>
  );
}

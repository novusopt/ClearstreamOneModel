import type { TajweedSegment } from "@/lib/types";

export function TajweedText({ value }: { value: string | TajweedSegment[] }) {
  if (typeof value === "string") return <>{value}</>;
  return (
    <>
      {value.map(([text, rule], i) =>
        rule ? (
          <span key={i} className={`tj-${rule}`}>
            {text}
          </span>
        ) : (
          text
        ),
      )}
    </>
  );
}

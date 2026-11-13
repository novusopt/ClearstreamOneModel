"use client";

import { BookOpen01 } from "@untitledui/icons";
import type { ReactNode } from "react";
import { Select } from "@/components/base/select/select";
import type { GlossaryTerm } from "@/lib/types";
import { cx } from "@/utils/cx";

const NONE = "__none__";

interface Option<T extends string> {
  id: T;
  label: string;
  supportingText?: string;
}

interface PickProps<T extends string> {
  label?: string;
  ariaLabel?: string;
  value: T | undefined;
  onChange: (value: T | undefined) => void;
  options: Option<T>[];
  /** Adds an entry that clears the value. */
  clearable?: boolean;
  /** Label of the clearing entry. */
  clearLabel?: string;
  placeholder?: string;
  hint?: string;
  size?: "sm" | "md";
  className?: string;
}

/** A single-choice dropdown over a fixed list. */
export function Pick<T extends string>({ label, ariaLabel, value, onChange, options, clearable, clearLabel = "None", placeholder, hint, size = "sm", className }: PickProps<T>) {
  const items: Option<string>[] = clearable ? [{ id: NONE, label: clearLabel }, ...options] : options;
  return (
    <Select
      label={label}
      aria-label={label ? undefined : ariaLabel}
      size={size}
      hint={hint}
      placeholder={placeholder ?? "Select"}
      className={className}
      items={items}
      selectedKey={value ?? (clearable ? NONE : null)}
      onSelectionChange={(key) => onChange(key === NONE || key === null ? undefined : (String(key) as T))}
    >
      {(item) => (
        <Select.Item id={item.id} supportingText={item.supportingText}>
          {item.label}
        </Select.Item>
      )}
    </Select>
  );
}

const LEVEL_STYLE: Record<string, string> = {
  Public: "bg-utility-neutral-50 text-utility-neutral-700 ring-utility-neutral-200",
  Internal: "bg-utility-blue-50 text-utility-blue-700 ring-utility-blue-200",
  Confidential: "bg-utility-amber-50 text-utility-amber-700 ring-utility-amber-200",
  Restricted: "bg-utility-red-50 text-utility-red-700 ring-utility-red-200",
};

const chip = "inline-flex max-w-full items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset";

export function ClassificationChip({ fqn }: { fqn: string }) {
  const level = fqn.split(".").pop() ?? fqn;
  return <span className={cx(chip, LEVEL_STYLE[level] ?? LEVEL_STYLE.Public)}>{level}</span>;
}

export function TagChip({ fqn }: { fqn: string }) {
  const personal = fqn.startsWith("PII.");
  return (
    <span className={cx(chip, "font-mono text-[11px]", personal ? "bg-utility-pink-50 text-utility-pink-700 ring-utility-pink-200" : "bg-primary text-secondary ring-primary")}>{fqn}</span>
  );
}

export function TermChip({ term }: { term: GlossaryTerm | undefined }) {
  if (!term) return null;
  return (
    <span title={term.definition} className={cx(chip, "bg-utility-brand-50 text-utility-brand-700 ring-utility-brand-200")}>
      <BookOpen01 className="size-3 shrink-0" />
      <span className="truncate">{term.name}</span>
    </span>
  );
}

export function FieldGroup({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-sm font-medium text-secondary">{label}</legend>
      {children}
      {hint && <p className="text-sm text-tertiary">{hint}</p>}
    </fieldset>
  );
}

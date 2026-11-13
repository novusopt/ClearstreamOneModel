"use client";

import { AlertCircle, AlertTriangle, Asterisk02, ChevronDown, Edit05, Fingerprint04, Key01, Plus, ShieldTick, Trash01 } from "@untitledui/icons";
import type { FC } from "react";
import { useState } from "react";
import { ToggleButton } from "react-aria-components";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import { Tooltip } from "@/components/base/tooltip/tooltip";
import { Mono } from "@/components/app/bits";
import { ClassificationChip, FieldGroup, Pick, TagChip, TermChip } from "@/components/app/fields";
import { RulesEditor } from "@/components/app/rules-editor";
import { newColumn } from "@/lib/describe";
import type { Column, Vocabulary } from "@/lib/types";
import { LOGICAL_TYPES } from "@/lib/types";
import { cx } from "@/utils/cx";

export interface ColumnIssue {
  level: "enforce" | "warn";
  message: string;
  policyId: string;
}

interface SchemaEditorProps {
  columns: Column[];
  onChange: (columns: Column[]) => void;
  vocabulary: Vocabulary;
  /** Policy findings keyed by column name. */
  issues?: Record<string, ColumnIssue[]>;
}

const TYPE_OPTIONS = LOGICAL_TYPES.map((type) => ({ id: type, label: type }));
const GRID = "grid grid-cols-[1.5rem_minmax(11.5rem,1.1fr)_6.75rem_6rem_minmax(9rem,2fr)_5.25rem] items-center gap-x-2";

function Flag({ label, icon: Icon, selected, onChange }: { label: string; icon: FC<{ className?: string }>; selected: boolean; onChange: (selected: boolean) => void }) {
  return (
    <Tooltip title={label} delay={400}>
      <ToggleButton
        aria-label={label}
        isSelected={selected}
        onChange={onChange}
        className={cx(
          "flex size-7 cursor-pointer items-center justify-center rounded-md outline-brand transition-colors focus-visible:outline-2",
          selected ? "bg-brand-solid text-white" : "text-quaternary hover:bg-secondary hover:text-secondary",
        )}
      >
        <Icon className="size-4" />
      </ToggleButton>
    </Tooltip>
  );
}

export function SchemaEditor({ columns, onChange, vocabulary, issues = {} }: SchemaEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = columns.find((column) => column.id === editingId);
  const terms = new Map(vocabulary.terms.map((term) => [term.id, term]));
  const update = (id: string, patch: Partial<Column>) => onChange(columns.map((column) => (column.id === id ? { ...column, ...patch } : column)));
  const move = (index: number, by: number) => {
    const next = [...columns];
    const [item] = next.splice(index, 1);
    next.splice(index + by, 0, item);
    onChange(next);
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="min-w-[44.5rem]">
          <div className={cx(GRID, "border-b border-secondary px-4 py-2 font-mono text-[11px] tracking-[0.06em] text-tertiary uppercase")}>
            <span>#</span>
            <span>Column</span>
            <span>Type</span>
            <span>Constraints</span>
            <span>Meaning and sensitivity</span>
            <span className="text-right">Details</span>
          </div>

          {columns.length === 0 && <p className="px-4 py-10 text-center text-sm text-tertiary">No columns yet. Add the first one below.</p>}

          <ol>
            {columns.map((column, index) => {
              const found = issues[column.name] ?? [];
              const blocking = found.some((issue) => issue.level === "enforce");
              return (
                <li key={column.id} className={cx(GRID, "group border-b border-secondary px-4 py-1.5 last:border-b-0 hover:bg-primary_hover", editingId === column.id && "bg-brand-primary")}>
                  <span className="flex flex-col items-center font-mono text-xs text-quaternary">
                    <button type="button" aria-label={`Move ${column.name || "column"} up`} disabled={index === 0} onClick={() => move(index, -1)} className="cursor-pointer opacity-0 group-hover:opacity-100 focus-visible:opacity-100 disabled:invisible">
                      <ChevronDown className="size-3 rotate-180" />
                    </button>
                    {index + 1}
                    <button type="button" aria-label={`Move ${column.name || "column"} down`} disabled={index === columns.length - 1} onClick={() => move(index, 1)} className="cursor-pointer opacity-0 group-hover:opacity-100 focus-visible:opacity-100 disabled:invisible">
                      <ChevronDown className="size-3" />
                    </button>
                  </span>

                  <input
                    aria-label={`Name of column ${index + 1}`}
                    value={column.name}
                    placeholder="column_name"
                    spellCheck={false}
                    onChange={(event) => update(column.id, { name: event.target.value })}
                    className="w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 font-mono text-sm font-medium text-primary placeholder:text-placeholder hover:border-primary focus:border-brand focus:bg-primary focus:ring-2 focus:ring-brand-100 focus:outline-none"
                  />

                  <Pick ariaLabel={`Type of ${column.name || "column"}`} value={column.logicalType} options={TYPE_OPTIONS} onChange={(logicalType) => logicalType && update(column.id, { logicalType })} />

                  <span className="flex items-center gap-1">
                    <Flag label="Primary key" icon={Key01} selected={column.primaryKey} onChange={(primaryKey) => update(column.id, { primaryKey, required: primaryKey || column.required })} />
                    <Flag label="Required: never empty" icon={Asterisk02} selected={column.required} onChange={(required) => update(column.id, { required })} />
                    <Flag label="Unique: no duplicates" icon={Fingerprint04} selected={column.unique} onChange={(unique) => update(column.id, { unique })} />
                  </span>

                  <button
                    type="button"
                    onClick={() => setEditingId(column.id)}
                    aria-label={`Edit meaning and sensitivity of ${column.name || "column"}`}
                    className="flex min-h-9 cursor-pointer flex-wrap items-center gap-1.5 rounded-md px-1.5 py-1 text-left outline-brand focus-visible:outline-2"
                  >
                    {column.classification && <ClassificationChip fqn={column.classification} />}
                    <TermChip term={terms.get(column.businessTerm ?? "")} />
                    {column.tags.map((tag) => (
                      <TagChip key={tag} fqn={tag} />
                    ))}
                    {column.quality.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-tertiary">
                        <ShieldTick className="size-3.5" />
                        {column.quality.length}
                      </span>
                    )}
                    {!column.classification && !column.businessTerm && column.tags.length === 0 && column.quality.length === 0 && <span className="text-xs text-quaternary">Add meaning…</span>}
                  </button>

                  <span className="flex items-center justify-end gap-0.5">
                    {found.length > 0 && (
                      <Tooltip title={found.map((issue) => issue.message).join(" · ")}>
                        <ToggleButton aria-label={`${found.length} policy findings`} onChange={() => setEditingId(column.id)} className="flex size-7 cursor-pointer items-center justify-center rounded-md outline-brand focus-visible:outline-2">
                          {blocking ? <AlertCircle className="size-4 text-error-primary" /> : <AlertTriangle className="size-4 text-warning-primary" />}
                        </ToggleButton>
                      </Tooltip>
                    )}
                    <Button size="sm" color="tertiary" iconLeading={Edit05} aria-label={`Edit ${column.name || "column"}`} onClick={() => setEditingId(column.id)} />
                    <Button size="sm" color="tertiary" iconLeading={Trash01} aria-label={`Remove ${column.name || "column"}`} onClick={() => onChange(columns.filter((candidate) => candidate.id !== column.id))} />
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <div className="border-t border-secondary px-4 py-3">
        <Button
          size="sm"
          color="secondary"
          iconLeading={Plus}
          onClick={() => {
            const column = newColumn();
            onChange([...columns, column]);
            setEditingId(column.id);
          }}
        >
          Add column
        </Button>
      </div>

      <SlideoutMenu isOpen={Boolean(editing)} onOpenChange={(open) => !open && setEditingId(null)} isDismissable>
        {({ close }) =>
          editing && (
            <>
              <SlideoutMenu.Header onClose={close}>
                <p className="font-mono text-[11px] tracking-[0.08em] text-tertiary uppercase">Column</p>
                <h2 className="mt-1 font-display text-lg font-semibold text-primary">
                  <Mono>{editing.name || "new_column"}</Mono>
                </h2>
              </SlideoutMenu.Header>
              <SlideoutMenu.Content>
                {(issues[editing.name] ?? []).length > 0 && (
                  <ul className="flex flex-col gap-1.5 rounded-lg border border-secondary bg-secondary p-3 text-sm">
                    {(issues[editing.name] ?? []).map((issue) => (
                      <li key={issue.policyId + issue.message} className="flex items-start gap-2">
                        {issue.level === "enforce" ? <AlertCircle className="mt-0.5 size-4 shrink-0 text-error-primary" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-primary" />}
                        <span className="text-secondary">
                          {issue.message} <Mono className="text-tertiary">{issue.policyId}</Mono>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <Input label="Name" value={editing.name} onChange={(name) => update(editing.id, { name })} inputClassName="font-mono" hint="Lower-case words joined by underscores." />
                <TextArea label="Description" rows={3} value={editing.description} onChange={(description) => update(editing.id, { description })} hint="What a consumer needs to know to use this column." />
                <div className="grid grid-cols-2 gap-3">
                  <Pick size="md" label="Type" value={editing.logicalType} options={TYPE_OPTIONS} onChange={(logicalType) => logicalType && update(editing.id, { logicalType })} />
                  <Input label="Physical type" placeholder="e.g. decimal(18,2)" value={editing.physicalType ?? ""} onChange={(physicalType) => update(editing.id, { physicalType: physicalType || undefined })} />
                </div>

                <Pick
                  size="md"
                  label="Business term"
                  clearable
                  value={editing.businessTerm}
                  options={vocabulary.terms.map((term) => ({ id: term.id, label: term.name, supportingText: term.glossary }))}
                  onChange={(businessTerm) => update(editing.id, { businessTerm })}
                  hint={terms.get(editing.businessTerm ?? "")?.definition ?? "Links the column to its meaning in the business glossary."}
                />
                <Pick
                  size="md"
                  label="Classification"
                  clearable
                  value={editing.classification}
                  options={vocabulary.classifications.map((tag) => ({ id: tag.fqn, label: tag.name, supportingText: tag.description }))}
                  onChange={(classification) => update(editing.id, { classification })}
                  hint="How sensitive the values are."
                />

                <FieldGroup label="Tags">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {vocabulary.tags.map((tag) => (
                      <Checkbox
                        key={tag.fqn}
                        size="sm"
                        isSelected={editing.tags.includes(tag.fqn)}
                        onChange={(selected) => update(editing.id, { tags: selected ? [...editing.tags, tag.fqn] : editing.tags.filter((candidate) => candidate !== tag.fqn) })}
                        label={<Mono>{tag.fqn}</Mono>}
                        hint={tag.description}
                      />
                    ))}
                  </div>
                </FieldGroup>

                <FieldGroup label="Quality rules" hint="Checked on every run, before the data reaches consumers.">
                  <RulesEditor scope="column" rules={editing.quality} onChange={(quality) => update(editing.id, { quality })} />
                </FieldGroup>
              </SlideoutMenu.Content>
              <SlideoutMenu.Footer className="flex justify-end">
                <Button size="md" onClick={close}>
                  Done
                </Button>
              </SlideoutMenu.Footer>
            </>
          )
        }
      </SlideoutMenu>
    </div>
  );
}

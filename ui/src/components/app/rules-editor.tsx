"use client";

import { Plus, Trash01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import { Pick } from "@/components/app/fields";
import { METRIC_LABEL, OPERATOR_LABEL, SLA_LABEL, describeRule, newRule, uid } from "@/lib/describe";
import type { Column, QualityMetric, QualityRule, SlaProperty } from "@/lib/types";
import { QUALITY_DIMENSIONS, QUALITY_METRICS, QUALITY_OPERATORS, SLA_PROPERTIES } from "@/lib/types";

type Check = QualityMetric | "sql";

const numeric = (text: string) => (text.trim() === "" || Number.isNaN(Number(text)) ? 0 : Number(text));

export function RulesEditor({ rules, onChange, scope }: { rules: QualityRule[]; onChange: (rules: QualityRule[]) => void; scope: "column" | "table" }) {
  const update = (id: string, patch: Partial<QualityRule>) => onChange(rules.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)));
  const checks: { id: Check; label: string }[] = [
    ...QUALITY_METRICS.filter((metric) => (scope === "table" ? metric === "rowCount" || metric === "duplicateValues" : metric !== "rowCount")).map((metric) => ({ id: metric as Check, label: METRIC_LABEL[metric] })),
    { id: "sql", label: "Custom SQL" },
  ];

  return (
    <div className="flex flex-col gap-3">
      {rules.length === 0 && <p className="rounded-lg border border-dashed border-primary px-3 py-4 text-center text-sm text-tertiary">No rules yet.</p>}
      {rules.map((rule) => (
        <div key={rule.id} className="flex flex-col gap-3 rounded-lg border border-secondary bg-secondary p-3">
          <div className="flex items-end gap-2">
            <Input size="sm" label="Rule" value={rule.name} onChange={(name) => update(rule.id, { name })} className="flex-1" />
            <Button size="sm" color="tertiary" iconLeading={Trash01} aria-label={`Remove rule ${rule.name}`} onClick={() => onChange(rules.filter((candidate) => candidate.id !== rule.id))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Pick<Check>
              label="Check"
              value={rule.type === "sql" ? "sql" : rule.metric}
              options={checks}
              onChange={(check) =>
                check && update(rule.id, check === "sql" ? { type: "sql", metric: undefined, query: rule.query ?? "SELECT COUNT(*) FROM ${table} WHERE " } : { type: "library", metric: check, query: undefined })
              }
            />
            <Pick label="Condition" value={rule.operator} options={QUALITY_OPERATORS.map((operator) => ({ id: operator, label: OPERATOR_LABEL[operator] }))} onChange={(operator) => operator && update(rule.id, { operator })} />
            <div className="flex items-end gap-2">
              <Input size="sm" label="Value" type="number" value={String(rule.value)} onChange={(text) => update(rule.id, { value: numeric(text) })} />
              {rule.operator === "mustBeBetween" && <Input size="sm" aria-label="Upper bound" type="number" value={String(rule.valueTo ?? rule.value)} onChange={(text) => update(rule.id, { valueTo: numeric(text) })} />}
            </div>
            <Pick label="Counted in" value={rule.unit ?? "rows"} options={[{ id: "rows", label: "Rows" }, { id: "percent", label: "Percent" }]} onChange={(unit) => update(rule.id, { unit: unit === "percent" ? "percent" : undefined })} />
            <Pick
              label="If it fails"
              value={rule.severity}
              options={[{ id: "error", label: "Block the run" }, { id: "warning", label: "Flag only" }]}
              onChange={(severity) => severity && update(rule.id, { severity })}
            />
            <Pick label="Dimension" value={rule.dimension} options={QUALITY_DIMENSIONS.map((dimension) => ({ id: dimension, label: dimension[0].toUpperCase() + dimension.slice(1) }))} onChange={(dimension) => dimension && update(rule.id, { dimension })} />
          </div>
          {rule.type === "sql" && <TextArea label="Query" rows={3} value={rule.query ?? ""} onChange={(query) => update(rule.id, { query })} textAreaClassName="font-mono text-sm" />}
          <p className="text-xs text-tertiary">{describeRule(rule)}.</p>
        </div>
      ))}
      <Button size="sm" color="secondary" iconLeading={Plus} className="self-start" onClick={() => onChange([...rules, newRule(scope)])}>
        Add rule
      </Button>
    </div>
  );
}

export function SlaEditor({ sla, onChange, columns, table }: { sla: SlaProperty[]; onChange: (sla: SlaProperty[]) => void; columns: Column[]; table: string }) {
  const update = (id: string, patch: Partial<SlaProperty>) => onChange(sla.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  const timeColumns = columns.filter((column) => ["date", "timestamp"].includes(column.logicalType) && column.name);
  const unused = SLA_PROPERTIES.filter((property) => !sla.some((item) => item.property === property));

  return (
    <div className="flex flex-col gap-3">
      {sla.length === 0 && <p className="rounded-lg border border-dashed border-primary px-3 py-4 text-center text-sm text-tertiary">No service levels yet.</p>}
      {sla.map((item) => (
        <div key={item.id} className="flex flex-wrap items-end gap-2 rounded-lg border border-secondary bg-secondary p-3">
          <Pick
            label="Promise"
            className="min-w-56 flex-1"
            value={item.property}
            options={SLA_PROPERTIES.filter((property) => property === item.property || unused.includes(property)).map((property) => ({ id: property, label: SLA_LABEL[property] }))}
            onChange={(property) => property && update(item.id, { property, element: property === "latency" ? item.element : undefined })}
          />
          <Input size="sm" label="Value" type="number" className="w-20" value={String(item.value)} onChange={(text) => update(item.id, { value: numeric(text) })} />
          <Pick label="Unit" className="w-28" value={item.unit ?? "d"} options={[{ id: "h", label: "Hours" }, { id: "d", label: "Days" }, { id: "y", label: "Years" }]} onChange={(unit) => update(item.id, { unit })} />
          {item.property === "latency" && (
            <Pick
              label="Measured on"
              className="min-w-44 flex-1"
              clearable
              value={item.element?.split(".").pop()}
              options={timeColumns.map((column) => ({ id: column.name, label: column.name }))}
              onChange={(column) => update(item.id, { element: column ? `${table}.${column}` : undefined })}
            />
          )}
          <Button size="sm" color="tertiary" iconLeading={Trash01} aria-label={`Remove ${SLA_LABEL[item.property]}`} onClick={() => onChange(sla.filter((candidate) => candidate.id !== item.id))} />
        </div>
      ))}
      {unused.length > 0 && (
        <Button size="sm" color="secondary" iconLeading={Plus} className="self-start" onClick={() => onChange([...sla, { id: uid(), property: unused[0], value: 1, unit: unused[0] === "retention" ? "y" : "d" }])}>
          Add service level
        </Button>
      )}
    </div>
  );
}

import { Key01, ShieldTick } from "@untitledui/icons";
import { Mono } from "@/components/app/bits";
import { ClassificationChip, TagChip, TermChip } from "@/components/app/fields";
import { describeRule, describeSla } from "@/lib/describe";
import type { DataContract, Vocabulary } from "@/lib/types";

const th = "px-4 py-2.5 text-left font-mono text-[11px] font-medium tracking-[0.06em] text-tertiary uppercase";

/** A contract as consumers read it: schema, rules and service levels. */
export function SchemaTable({ contract, vocabulary }: { contract: DataContract; vocabulary: Vocabulary }) {
  const terms = new Map(vocabulary.terms.map((term) => [term.id, term]));
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[46rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-secondary bg-secondary">
              <th scope="col" className={th}>Column</th>
              <th scope="col" className={th}>Type</th>
              <th scope="col" className={th}>Meaning and sensitivity</th>
              <th scope="col" className={th}>Description</th>
            </tr>
          </thead>
          <tbody>
            {contract.columns.map((column) => (
              <tr key={column.id} className="border-b border-secondary align-top last:border-b-0">
                <th scope="row" className="px-4 py-3 text-left font-normal whitespace-nowrap">
                  <span className="flex items-center gap-1.5">
                    <Mono className="font-medium text-primary">{column.name}</Mono>
                    {column.primaryKey && <Key01 className="size-3.5 text-brand-secondary" aria-label="Primary key" />}
                  </span>
                  <span className="mt-0.5 block text-xs text-tertiary">{[column.required && "required", column.unique && "unique"].filter(Boolean).join(" · ") || "optional"}</span>
                </th>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Mono className="text-secondary">{column.logicalType}</Mono>
                </td>
                <td className="px-4 py-3">
                  <span className="flex flex-wrap gap-1.5">
                    {column.classification && <ClassificationChip fqn={column.classification} />}
                    <TermChip term={terms.get(column.businessTerm ?? "")} />
                    {column.tags.map((tag) => (
                      <TagChip key={tag} fqn={tag} />
                    ))}
                    {!column.classification && !column.businessTerm && column.tags.length === 0 && <span className="text-quaternary">Not mapped</span>}
                  </span>
                </td>
                <td className="px-4 py-3 text-secondary">
                  {column.description || <span className="text-quaternary">No description</span>}
                  {column.quality.map((rule) => (
                    <span key={rule.id} className="mt-1 flex items-center gap-1.5 text-xs text-tertiary">
                      <ShieldTick className="size-3.5 shrink-0" />
                      {describeRule(rule)}
                    </span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-x-8 gap-y-4 border-t border-secondary px-5 py-4 sm:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-primary">Table rules</h3>
          <ul className="mt-1.5 flex flex-col gap-1 text-sm text-secondary">
            {contract.quality.length === 0 && <li className="text-quaternary">None</li>}
            {contract.quality.map((rule) => (
              <li key={rule.id}>
                {rule.name} <span className="text-tertiary">({describeRule(rule).toLowerCase()})</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-primary">Service levels</h3>
          <ul className="mt-1.5 flex flex-col gap-1 text-sm text-secondary">
            {contract.sla.length === 0 && <li className="text-quaternary">None</li>}
            {contract.sla.map((sla) => (
              <li key={sla.id}>{describeSla(sla)}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

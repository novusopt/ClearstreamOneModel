import type { DataContract } from "@/lib/types";

export interface ContractChange {
  kind: "breaking" | "additive" | "neutral";
  column?: string;
  message: string;
}

/**
 * Compares a contract with its last published version, from a consumer's point of view:
 * anything a consumer could rely on that is taken away or narrowed is breaking.
 */
export function diffContracts(published: DataContract, draft: DataContract): ContractChange[] {
  const changes: ContractChange[] = [];
  const before = new Map(published.columns.map((column) => [column.id, column]));
  const after = new Map(draft.columns.map((column) => [column.id, column]));

  for (const [id, old] of before) {
    const next = after.get(id);
    if (!next) {
      changes.push({ kind: "breaking", column: old.name, message: `Column "${old.name}" was removed` });
      continue;
    }
    if (next.name !== old.name) {
      changes.push({ kind: "breaking", column: next.name, message: `Column "${old.name}" was renamed to "${next.name}"` });
    }
    if (next.logicalType !== old.logicalType) {
      changes.push({ kind: "breaking", column: next.name, message: `Type of "${next.name}" changed from ${old.logicalType} to ${next.logicalType}` });
    }
    if (old.required && !next.required) {
      changes.push({ kind: "breaking", column: next.name, message: `"${next.name}" may now be empty; it was required` });
    }
    if (!old.required && next.required) {
      changes.push({ kind: "neutral", column: next.name, message: `"${next.name}" is now required` });
    }
    if (old.unique && !next.unique) {
      changes.push({ kind: "breaking", column: next.name, message: `"${next.name}" is no longer guaranteed unique` });
    }
    if (old.primaryKey !== next.primaryKey) {
      changes.push({ kind: "breaking", column: next.name, message: `Primary key changed on "${next.name}"` });
    }
    if ((old.classification ?? "") !== (next.classification ?? "")) {
      changes.push({
        kind: "neutral",
        column: next.name,
        message: `Classification of "${next.name}" changed from ${old.classification ?? "none"} to ${next.classification ?? "none"}`,
      });
    }
    if ((old.businessTerm ?? "") !== (next.businessTerm ?? "")) {
      changes.push({ kind: "neutral", column: next.name, message: `Business term of "${next.name}" changed` });
    }
    if (old.description !== next.description) {
      changes.push({ kind: "neutral", column: next.name, message: `Description of "${next.name}" changed` });
    }
    if (old.tags.join() !== next.tags.join()) {
      changes.push({ kind: "neutral", column: next.name, message: `Tags of "${next.name}" changed` });
    }
    if (JSON.stringify(old.quality) !== JSON.stringify(next.quality)) {
      changes.push({ kind: "neutral", column: next.name, message: `Quality rules of "${next.name}" changed` });
    }
  }

  for (const [id, next] of after) {
    if (before.has(id)) continue;
    changes.push({ kind: "additive", column: next.name, message: `Column "${next.name}" was added` });
  }

  if (published.table !== draft.table) {
    changes.push({ kind: "breaking", message: `Table renamed from "${published.table}" to "${draft.table}"` });
  }
  if (JSON.stringify(published.quality) !== JSON.stringify(draft.quality)) {
    changes.push({ kind: "neutral", message: "Table-level quality rules changed" });
  }
  if (JSON.stringify(published.sla) !== JSON.stringify(draft.sla)) {
    changes.push({ kind: "neutral", message: "Service levels changed" });
  }
  if (published.purpose !== draft.purpose || published.tableDescription !== draft.tableDescription) {
    changes.push({ kind: "neutral", message: "Descriptions changed" });
  }
  return changes;
}

/** The next semantic version implied by a set of changes. */
export function nextVersion(current: string, changes: ContractChange[]): string {
  const [major = 0, minor = 0, patch = 0] = current.split(".").map((part) => Number.parseInt(part, 10) || 0);
  if (changes.length === 0) return current;
  if (changes.some((change) => change.kind === "breaking")) return major === 0 ? `0.${minor + 1}.0` : `${major + 1}.0.0`;
  if (changes.some((change) => change.kind === "additive")) return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

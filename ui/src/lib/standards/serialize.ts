import { stringify } from "yaml";
import type { Column, DataContract, DataProduct, QualityRule, SlaProperty } from "@/lib/types";

/** Stable identifier of a glossary term, as written into a contract. */
export const termUrl = (termId: string) => `urn:glossary:${termId}`;
export const termIdFromUrl = (url: string) => (url.startsWith("urn:glossary:") ? url.slice("urn:glossary:".length) : undefined);

export const trinoSchema = (product: Pick<DataProduct, "domain" | "name">) => `${product.domain}_${product.name}`.replace(/-/g, "_");

type Doc = Record<string, unknown>;

/** Drops undefined, empty strings and empty arrays so the YAML stays readable. */
function compact<T extends Doc>(doc: T): T {
  const out: Doc = {};
  for (const [key, value] of Object.entries(doc)) {
    if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) continue;
    out[key] = value;
  }
  return out as T;
}

function qualityRule(rule: QualityRule): Doc {
  const comparison = rule.operator === "mustBeBetween" ? [rule.value, rule.valueTo ?? rule.value] : rule.value;
  return compact({
    name: rule.name,
    description: rule.description,
    type: rule.type,
    metric: rule.type === "library" ? rule.metric : undefined,
    query: rule.type === "sql" ? rule.query : undefined,
    [rule.operator]: comparison,
    unit: rule.unit,
    dimension: rule.dimension,
    severity: rule.severity,
  });
}

function property(column: Column, primaryKeyPosition: number): Doc {
  return compact({
    name: column.name,
    logicalType: column.logicalType,
    physicalType: column.physicalType,
    description: column.description,
    required: column.required || undefined,
    unique: column.unique || undefined,
    primaryKey: column.primaryKey || undefined,
    primaryKeyPosition: column.primaryKey ? primaryKeyPosition : undefined,
    classification: column.classification,
    tags: column.tags,
    authoritativeDefinitions: column.businessTerm ? [{ type: "businessDefinition", url: termUrl(column.businessTerm) }] : undefined,
    quality: column.quality.map(qualityRule),
  });
}

function sla(item: SlaProperty): Doc {
  return compact({ property: item.property, value: item.value, unit: item.unit, element: item.element });
}

/** A contract as an ODCS v3.1.0 document. */
export function toOdcs(contract: DataContract, product: DataProduct): Doc {
  let keyPosition = 0;
  return compact({
    apiVersion: "v3.1.0",
    kind: "DataContract",
    id: contract.id,
    name: contract.name,
    version: contract.version,
    status: contract.status,
    domain: product.domain,
    dataProduct: product.name,
    description: compact({ purpose: contract.purpose }),
    tags: contract.tags,
    team: { name: product.team, members: [{ username: product.owner, role: "owner" }] },
    servers: [
      {
        server: "lakehouse",
        type: "trino",
        environment: "prod",
        host: "trino",
        port: 8080,
        catalog: "lakehouse",
        schema: trinoSchema(product),
      },
    ],
    schema: [
      compact({
        name: contract.table,
        physicalName: contract.table,
        physicalType: "table",
        description: contract.tableDescription,
        properties: contract.columns.map((column) => property(column, column.primaryKey ? ++keyPosition : 0)),
        quality: contract.quality.map(qualityRule),
      }),
    ],
    slaProperties: contract.sla.map(sla),
  });
}

/** A product as an ODPS v1.0.0 document. Platform settings travel in `customProperties`. */
export function toOdps(product: DataProduct): Doc {
  return compact({
    apiVersion: "v1.0.0",
    kind: "DataProduct",
    id: product.id,
    name: product.name,
    version: product.version,
    status: product.status,
    domain: product.domain,
    description: compact({ purpose: product.purpose, usage: product.usage, limitations: product.limitations }),
    tags: product.tags,
    inputPorts: product.inputPorts.map((port) => ({ name: port.name, version: port.version, contractId: port.contractId })),
    outputPorts: product.outputPorts.map((port) =>
      compact({ name: port.name, description: port.description, type: "tables", version: port.version, contractId: port.contractId }),
    ),
    team: { name: product.team, members: [{ username: product.owner, role: "owner" }] },
    customProperties: [
      { property: "title", value: product.title },
      { property: "template", value: product.template },
      { property: "schedule", value: product.schedule },
      { property: "targetSchema", value: trinoSchema(product) },
      ...(product.sunsetDate ? [{ property: "sunsetDate", value: product.sunsetDate }] : []),
      ...(product.successor ? [{ property: "successor", value: product.successor }] : []),
    ],
    productCreatedTs: product.createdAt,
  });
}

export const toYaml = (doc: Doc) => stringify(doc, { lineWidth: 100 });

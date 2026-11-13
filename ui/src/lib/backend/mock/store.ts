import { diffContracts, nextVersion } from "@/lib/breaking";
import { allowedTransitions, gatesFor } from "@/lib/lifecycle";
import { pipelineSteps } from "@/lib/pipeline";
import type { DataContract, DataProduct, LifecycleStatus, NewProductInput, PipelineRun, QualityResult, QualityRule } from "@/lib/types";
import { SEEDED_FAILURES, TEMPLATES, VOCABULARY, seedContracts, seedProducts, seedRuns } from "./seed";

interface State {
  products: DataProduct[];
  contracts: DataContract[];
  runs: PipelineRun[];
  runSeq: number;
}

const fresh = (): State => ({ products: seedProducts(), contracts: seedContracts(), runs: seedRuns(), runSeq: 1010 });

// Kept on globalThis so route handlers and server components share one store, and so it survives hot reloads.
const holder = globalThis as typeof globalThis & { __dataProductStore?: State };
const state = (): State => (holder.__dataProductStore ??= fresh());

export class BackendError extends Error {}

const clone = <T>(value: T): T => structuredClone(value);
const now = () => new Date().toISOString();

function requireProduct(id: string): DataProduct {
  const product = state().products.find((candidate) => candidate.id === id);
  if (!product) throw new BackendError(`No product "${id}"`);
  return product;
}

function startRun(productId: string, kind: PipelineRun["kind"], title: string, template: string): PipelineRun {
  const s = state();
  const run: PipelineRun = { id: `run-${s.runSeq++}`, productId, kind, title, startedAt: now(), steps: pipelineSteps(kind, template) };
  s.runs.unshift(run);
  return run;
}

/** Deterministic pass/fail history so the charts do not change between page loads. */
function history(seed: string, failsNow: boolean): ("passed" | "failed")[] {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return Array.from({ length: 14 }, (_, index) => {
    if (index === 13) return failsNow ? "failed" : "passed";
    hash = (hash * 1103515245 + 12345) >>> 0;
    return failsNow && hash % 5 === 0 ? "failed" : hash % 23 === 0 ? "failed" : "passed";
  });
}

function qualityFor(contract: DataContract): QualityResult[] {
  const result = (rule: QualityRule, column?: string): QualityResult => {
    const failed = SEEDED_FAILURES.has(rule.name);
    return {
      contractId: contract.id,
      ruleId: rule.id,
      ruleName: rule.name,
      column,
      severity: rule.severity,
      status: failed ? "failed" : "passed",
      observed: failed ? `3.1${rule.unit === "percent" ? " %" : ""}` : rule.metric === "rowCount" ? "48,212 rows" : `0${rule.unit === "percent" ? " %" : ""}`,
      history: history(`${contract.id}/${rule.id}`, failed),
    };
  };
  return [...contract.columns.flatMap((column) => column.quality.map((rule) => result(rule, column.name))), ...contract.quality.map((rule) => result(rule))];
}

export const mockBackend = {
  async listProducts(): Promise<DataProduct[]> {
    return clone(state().products);
  },
  async getProduct(domain: string, name: string): Promise<DataProduct | undefined> {
    return clone(state().products.find((product) => product.domain === domain && product.name === name));
  },
  async listContracts(): Promise<DataContract[]> {
    return clone(state().contracts);
  },
  async getContract(id: string): Promise<DataContract | undefined> {
    return clone(state().contracts.find((contract) => contract.id === id));
  },
  async getVocabulary() {
    return clone(VOCABULARY);
  },
  async listTemplates() {
    return clone(TEMPLATES);
  },
  async listRuns(productId?: string): Promise<PipelineRun[]> {
    return clone(state().runs.filter((run) => !productId || run.productId === productId));
  },
  async getRun(id: string): Promise<PipelineRun | undefined> {
    return clone(state().runs.find((run) => run.id === id));
  },
  async getQuality(productId: string): Promise<QualityResult[]> {
    const product = requireProduct(productId);
    if (product.status === "proposed" || product.status === "retired") return [];
    return state()
      .contracts.filter((contract) => contract.productId === productId)
      .flatMap(qualityFor);
  },
  async consumersOf(productId: string): Promise<DataProduct[]> {
    const s = state();
    const contractIds = new Set(s.contracts.filter((contract) => contract.productId === productId).map((contract) => contract.id));
    return clone(s.products.filter((product) => product.inputPorts.some((port) => contractIds.has(port.contractId))));
  },

  async createProduct(input: NewProductInput): Promise<{ product: DataProduct; run?: PipelineRun }> {
    const s = state();
    const id = `${input.domain}.${input.name}`;
    if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(input.name)) throw new BackendError("The name must be lower-case words separated by hyphens");
    const existing = s.products.find((product) => product.id === id);
    // A proposal is the same product at an earlier stage: building it replaces the placeholder.
    const fromProposal = existing?.status === "proposed" && input.status === "draft";
    if (existing && !fromProposal) throw new BackendError(`A product named "${input.name}" already exists in ${input.domain}`);
    if (fromProposal) s.products = s.products.filter((product) => product.id !== id);
    const domain = VOCABULARY.domains.find((candidate) => candidate.id === input.domain);
    if (!domain) throw new BackendError(`Unknown domain "${input.domain}"`);

    const timestamp = now();
    const proposed = input.status === "proposed";
    const contractId = `${id}.${input.port}`;
    const product: DataProduct = {
      id,
      name: input.name,
      title: input.title,
      domain: input.domain,
      purpose: input.purpose,
      status: input.status,
      version: "0.1.0",
      team: domain.team,
      owner: input.owner,
      template: input.template,
      schedule: input.schedule,
      inputPorts: proposed ? [] : input.inputPorts,
      outputPorts: proposed ? [] : [{ name: input.port, description: input.tableDescription, contractId, version: "0.1.0" }],
      tags: [],
      transformation: input.transformation,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };
    s.products.unshift(product);
    if (proposed) return { product: clone(product) };

    s.contracts.push({
      id: contractId,
      productId: id,
      port: input.port,
      name: input.title,
      version: "0.1.0",
      status: "draft",
      purpose: input.purpose,
      table: input.table,
      tableDescription: input.tableDescription,
      columns: input.columns,
      quality: input.quality,
      sla: input.sla,
      tags: [],
      updatedAt: timestamp,
    });
    return { product: clone(product), run: clone(startRun(id, "create", `Create ${input.title}`, input.template)) };
  },

  async saveContract(id: string, draft: DataContract, message: string): Promise<{ contract: DataContract; run: PipelineRun }> {
    const s = state();
    const index = s.contracts.findIndex((contract) => contract.id === id);
    if (index < 0) throw new BackendError(`No contract "${id}"`);
    const published = s.contracts[index];
    const product = requireProduct(published.productId);
    if (product.status === "retired") throw new BackendError("A retired product's contract cannot be changed");

    const changes = diffContracts(published, draft);
    if (changes.length === 0) throw new BackendError("Nothing has changed");
    const names = draft.columns.map((column) => column.name);
    if (names.some((name) => !name.trim())) throw new BackendError("Every column needs a name");
    if (new Set(names).size !== names.length) throw new BackendError("Column names must be unique");

    const version = nextVersion(published.version, changes);
    const timestamp = now();
    const saved: DataContract = { ...clone(draft), id, productId: published.productId, port: published.port, status: published.status, version, updatedAt: timestamp };
    s.contracts[index] = saved;
    const port = product.outputPorts.find((candidate) => candidate.contractId === id);
    if (port) port.version = version;
    product.version = version;
    product.updatedAt = timestamp;
    return { contract: clone(saved), run: clone(startRun(product.id, "contract-change", message || "Change the contract", product.template)) };
  },

  async changeStatus(productId: string, target: LifecycleStatus, options: { sunsetDate?: string; successor?: string } = {}): Promise<{ product: DataProduct; run: PipelineRun }> {
    const s = state();
    const product = requireProduct(productId);
    if (!allowedTransitions(product.status).includes(target)) throw new BackendError(`A ${product.status} product cannot become ${target}`);
    const contracts = s.contracts.filter((contract) => contract.productId === productId);
    const gates = gatesFor(target, {
      product,
      contracts,
      quality: await this.getQuality(productId),
      consumers: await this.consumersOf(productId),
      sunsetDate: options.sunsetDate,
    });
    const unmet = gates.filter((gate) => !gate.ok);
    if (unmet.length) throw new BackendError(`Not ready for ${target}: ${unmet.map((gate) => gate.label).join("; ")}`);

    const timestamp = now();
    product.status = target;
    product.updatedAt = timestamp;
    if (target === "active" && product.version.startsWith("0.")) product.version = "1.0.0";
    if (target === "deprecated") {
      product.sunsetDate = options.sunsetDate;
      product.successor = options.successor || undefined;
    }
    for (const contract of contracts) {
      contract.status = target;
      contract.updatedAt = timestamp;
      if (target === "active" && contract.version.startsWith("0.")) contract.version = "1.0.0";
    }
    for (const port of product.outputPorts) {
      port.version = contracts.find((contract) => contract.id === port.contractId)?.version ?? port.version;
    }
    const labels: Record<LifecycleStatus, string> = { proposed: "Propose", draft: "Start building", active: "Promote to Active", deprecated: "Deprecate", retired: "Retire" };
    return { product: clone(product), run: clone(startRun(productId, "lifecycle", `${labels[target]}: ${product.title}`, product.template)) };
  },

  async reset(): Promise<void> {
    holder.__dataProductStore = fresh();
  },
};

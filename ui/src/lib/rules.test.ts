import { describe, expect, it } from "vitest";
import { seedContracts, seedProducts } from "@/lib/backend/mock/seed";
import { mockBackend } from "@/lib/backend/mock/store";
import { diffContracts, nextVersion } from "./breaking";
import { gatesFor } from "./lifecycle";
import { evaluatePolicies } from "./policies";

const products = seedProducts();
const contracts = seedContracts();
const contractsOf = (productId: string) => contracts.filter((contract) => contract.productId === productId);
const product = (id: string) => products.find((candidate) => candidate.id === id)!;

describe("breaking-change detection", () => {
  const published = contractsOf("settlement.settlement-fails-daily")[0];

  it("treats a removed column as breaking and bumps the major version", () => {
    const draft = { ...published, columns: published.columns.filter((column) => column.name !== "fail_rate") };
    const changes = diffContracts(published, draft);
    expect(changes).toEqual([{ kind: "breaking", column: "fail_rate", message: 'Column "fail_rate" was removed' }]);
    expect(nextVersion("1.3.0", changes)).toBe("2.0.0");
  });

  it("treats a new column as additive and a description edit as a patch", () => {
    const added = { ...published, columns: [...published.columns, { ...published.columns[0], id: "new", name: "region" }] };
    expect(nextVersion("1.3.0", diffContracts(published, added))).toBe("1.4.0");
    const edited = { ...published, columns: published.columns.map((column, index) => (index === 0 ? { ...column, description: "Changed." } : column)) };
    expect(nextVersion("1.3.0", diffContracts(published, edited))).toBe("1.3.1");
  });

  it("reports nothing for an unchanged contract", () => {
    expect(diffContracts(published, structuredClone(published))).toEqual([]);
  });
});

describe("policies", () => {
  it("passes every enforced policy for the seeded Active products", () => {
    for (const candidate of products.filter((item) => item.status === "active")) {
      const enforced = evaluatePolicies(candidate, contractsOf(candidate.id)).filter((violation) => violation.level === "enforce");
      expect(enforced, candidate.id).toEqual([]);
    }
  });

  it("applies a domain policy only inside its domain, on top of the global ones", () => {
    const fails = product("settlement.settlement-fails-daily");
    const violations = evaluatePolicies(fails, contractsOf(fails.id));
    expect(violations.map((violation) => `${violation.policyId}:${violation.column}`)).toEqual(["D-SET-001:counterparty_lei"]);
    const risk = product("risk.counterparty-exposure");
    expect(evaluatePolicies(risk, contractsOf(risk.id)).some((violation) => violation.scope === "settlement")).toBe(false);
  });

  it("requires retention when a column is tagged as personal data", () => {
    const instructions = product("settlement.settlement-instructions");
    const withoutRetention = contractsOf(instructions.id).map((contract) => ({ ...contract, sla: contract.sla.filter((sla) => sla.property !== "retention") }));
    expect(evaluatePolicies(instructions, withoutRetention).map((violation) => violation.policyId)).toContain("G-006");
  });
});

describe("lifecycle gates", () => {
  it("holds the draft back from Active until its contract is complete", () => {
    const draft = product("risk.counterparty-exposure");
    const gates = gatesFor("active", { product: draft, contracts: contractsOf(draft.id), quality: [], consumers: [] });
    expect(gates.filter((gate) => !gate.ok).map((gate) => gate.label)).toEqual([
      "Every column is described, classified and mapped to a business term",
      "Each output has a primary key and a quality rule",
      "Frequency and latency are stated",
    ]);
  });

  it("refuses the move in the backend and allows it once the gates are met", async () => {
    await mockBackend.reset();
    await expect(mockBackend.changeStatus("risk.counterparty-exposure", "active")).rejects.toThrow(/Not ready for active/);
    await expect(mockBackend.changeStatus("settlement.settlement-fails-daily", "retired")).rejects.toThrow(/cannot become retired/);
    const { product: deprecated } = await mockBackend.changeStatus("settlement.settlement-fails-daily", "deprecated", { sunsetDate: "2027-06-30" });
    expect(deprecated.status).toBe("deprecated");
    expect((await mockBackend.getContract("settlement.settlement-fails-daily.fails_daily"))?.status).toBe("deprecated");
    await mockBackend.reset();
  });
});

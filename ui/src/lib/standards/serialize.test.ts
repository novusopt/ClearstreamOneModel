import { describe, expect, it } from "vitest";
import { seedContracts, seedProducts } from "@/lib/backend/mock/seed";
import { toOdcs, toOdps, toYaml } from "./serialize";
import { validateAgainstStandard } from "./validate";

const products = seedProducts();
const contracts = seedContracts();

describe("serialization to the open standards", () => {
  it.each(products.map((product) => [product.id, product] as const))("%s is a valid ODPS v1.0.0 document", (_, product) => {
    expect(validateAgainstStandard("odps", toOdps(product))).toEqual([]);
  });

  it.each(contracts.map((contract) => [contract.id, contract] as const))("%s is a valid ODCS v3.1.0 document", (_, contract) => {
    const product = products.find((candidate) => candidate.id === contract.productId)!;
    expect(validateAgainstStandard("odcs", toOdcs(contract, product))).toEqual([]);
  });

  it("reports what is wrong with an invalid contract", () => {
    const product = products[0];
    const doc = { ...toOdcs(contracts[0], product), status: undefined, schema: [{ properties: [{ logicalType: "varchar" }] }] };
    const issues = validateAgainstStandard("odcs", doc);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.map((issue) => issue.message).join(" ")).toMatch(/required property/);
  });

  it("writes business terms, classifications and tags into the contract", () => {
    const instructions = contracts.find((contract) => contract.port === "instructions")!;
    const yaml = toYaml(toOdcs(instructions, products.find((product) => product.id === instructions.productId)!));
    expect(yaml).toContain("url: urn:glossary:Settlement.Counterparty");
    expect(yaml).toContain("classification: Confidentiality.Restricted");
    expect(yaml).toContain("- PII.Sensitive");
    expect(yaml).toContain("primaryKeyPosition: 1");
  });
});

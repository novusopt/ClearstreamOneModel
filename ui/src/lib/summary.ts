import { backend } from "@/lib/backend";
import { evaluatePolicies } from "@/lib/policies";
import type { DataContract, DataProduct } from "@/lib/types";

export interface ProductSummary {
  failingErrors: number;
  failingWarnings: number;
  rules: number;
  policyBlocking: number;
  policyWarnings: number;
}

/** Health figures for a product card: latest contract test and policy findings. */
export async function summarize(product: DataProduct, contracts: DataContract[]): Promise<ProductSummary> {
  const quality = await backend.getQuality(product.id);
  const violations = evaluatePolicies(product, contracts.filter((contract) => contract.productId === product.id));
  return {
    rules: quality.length,
    failingErrors: quality.filter((result) => result.status === "failed" && result.severity === "error").length,
    failingWarnings: quality.filter((result) => result.status === "failed" && result.severity === "warning").length,
    policyBlocking: violations.filter((violation) => violation.level === "enforce").length,
    policyWarnings: violations.filter((violation) => violation.level === "warn").length,
  };
}

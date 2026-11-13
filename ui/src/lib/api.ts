import type { DataContract, DataProduct, LifecycleStatus, NewProductInput, PipelineRun } from "@/lib/types";

async function call<T>(url: string, method: string, body?: unknown): Promise<T> {
  const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((payload as { error?: string }).error ?? `Request failed (${response.status})`);
  return payload as T;
}

/** Browser-side calls to the backend's HTTP interface. */
export const api = {
  createProduct: (input: NewProductInput) => call<{ product: DataProduct; run?: PipelineRun }>("/api/products", "POST", input),
  saveContract: (id: string, contract: DataContract, message: string) =>
    call<{ contract: DataContract; run: PipelineRun }>(`/api/contracts/${encodeURIComponent(id)}`, "PUT", { contract, message }),
  changeStatus: (productId: string, target: LifecycleStatus, options: { sunsetDate?: string; successor?: string } = {}) =>
    call<{ product: DataProduct; run: PipelineRun }>(`/api/products/${encodeURIComponent(productId)}/status`, "POST", { target, ...options }),
  getRun: (id: string) => call<PipelineRun>(`/api/runs/${id}`, "GET"),
  reset: () => call<{ ok: true }>("/api/reset", "POST"),
};

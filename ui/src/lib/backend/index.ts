import { mockBackend } from "./mock/store";

export { BackendError } from "./mock/store";

/**
 * The one place the UI gets its data from. Today it is an in-memory mock; the real implementation
 * (Git for specs and contracts, the catalog for vocabulary and results) replaces it behind the same
 * functions without touching any screen.
 */
export type Backend = typeof mockBackend;
export const backend: Backend = mockBackend;

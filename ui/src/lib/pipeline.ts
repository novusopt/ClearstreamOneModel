import type { PipelineRun, PipelineStep } from "@/lib/types";

export type StepState = "done" | "running" | "pending";

export interface RunProgress {
  steps: (PipelineStep & { state: StepState })[];
  finished: boolean;
  percent: number;
}

/** A run's progress is a pure function of when it started, so nothing has to tick on the server. */
export function runProgress(run: PipelineRun, now: number = Date.now()): RunProgress {
  const elapsed = now - new Date(run.startedAt).getTime();
  const total = run.steps.reduce((sum, step) => sum + step.durationMs, 0);
  let offset = 0;
  const steps = run.steps.map((step) => {
    const start = offset;
    offset += step.durationMs;
    const state: StepState = elapsed >= offset ? "done" : elapsed >= start ? "running" : "pending";
    return { ...step, state };
  });
  return { steps, finished: elapsed >= total, percent: total === 0 ? 100 : Math.min(100, Math.round((elapsed / total) * 100)) };
}

export function pipelineSteps(kind: PipelineRun["kind"], template: string): PipelineStep[] {
  const validate: PipelineStep[] = [
    { key: "validate", label: "Validate spec and contract", detail: "ODPS v1.0.0 and ODCS v3.1.0 schemas, cross-file rules", durationMs: 2200 },
    { key: "policy", label: "Check policies", detail: "Global policies and the domain's own", durationMs: 1800 },
    { key: "build", label: "Build and test in a staging schema", detail: "Contract tested before anything is published", durationMs: 4000 },
    { key: "merge", label: "Merge to main", detail: "Git is the source; everything else follows", durationMs: 1200 },
    { key: "deploy", label: "Deploy", detail: "Tables in Trino, pipeline in Airflow", durationMs: 3600 },
    { key: "publish", label: "Publish to the catalog", detail: "Domain, product, ports, contract, tags, terms and lineage", durationMs: 2600 },
  ];
  if (kind === "create") {
    return [
      { key: "scaffold", label: "Render the template", detail: `templates/${template} into a new branch`, durationMs: 2400 },
      { key: "pr", label: "Open a pull request", detail: "Spec, contract and transformation code", durationMs: 1200 },
      ...validate,
    ];
  }
  return [{ key: "pr", label: "Open a pull request", detail: kind === "lifecycle" ? "Status change in the product spec" : "Contract change", durationMs: 1200 }, ...validate];
}

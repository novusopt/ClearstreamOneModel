"use client";

import { Check, CheckCircle, XCircle } from "@untitledui/icons";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Pick } from "@/components/app/fields";
import { api } from "@/lib/api";
import type { Gate } from "@/lib/lifecycle";
import { LIFECYCLE_META } from "@/lib/lifecycle";
import type { DataProduct, LifecycleStatus } from "@/lib/types";
import { LIFECYCLE } from "@/lib/types";
import { cx } from "@/utils/cx";

export interface Transition {
  target: LifecycleStatus;
  gates: Gate[];
}

const ACTION: Record<LifecycleStatus, string> = { proposed: "Propose", draft: "Start building", active: "Promote to Active", deprecated: "Deprecate", retired: "Retire" };

export function LifecyclePanel({ product, transitions, successors }: { product: DataProduct; transitions: Transition[]; successors: { id: string; title: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [deprecating, setDeprecating] = useState(false);
  const [sunsetDate, setSunsetDate] = useState("");
  const [successor, setSuccessor] = useState<string>();
  const currentIndex = LIFECYCLE.indexOf(product.status);
  const main = transitions.find((transition) => transition.target !== "retired") ?? transitions[0];
  const abandon = transitions.find((transition) => transition.target === "retired" && transition !== main);

  const change = (target: LifecycleStatus, options: { sunsetDate?: string; successor?: string } = {}) =>
    start(async () => {
      try {
        const { run } = await api.changeStatus(product.id, target, options);
        setDeprecating(false);
        router.push(`/products/${product.domain}/${product.name}?run=${run.id}`);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "The change failed");
      }
    });

  // Deprecation's only gate is the sunset date, which the dialog collects.
  const ready = main ? main.target === "deprecated" || main.gates.every((gate) => gate.ok) : false;

  return (
    <div className="flex flex-col gap-5 p-5">
      <ol className="flex items-start">
        {LIFECYCLE.map((status, index) => {
          const done = index < currentIndex;
          const current = index === currentIndex;
          return (
            <li key={status} aria-current={current ? "step" : undefined} className="relative flex flex-1 flex-col items-center gap-2 text-center">
              {index > 0 && <span className={cx("absolute top-3 right-1/2 h-0.5 w-full -translate-y-1/2", index <= currentIndex ? "bg-brand-500" : "bg-tertiary")} />}
              <span
                className={cx(
                  "relative z-1 flex size-6 items-center justify-center rounded-full font-mono text-[11px] font-medium",
                  done && "bg-brand-solid text-white",
                  current && "bg-brand-solid text-white ring-4 ring-brand-100",
                  !done && !current && "border border-primary bg-primary text-quaternary",
                )}
              >
                {done ? <Check className="size-3.5" /> : index + 1}
              </span>
              <span className={cx("text-xs", current ? "font-semibold text-primary" : "text-tertiary")}>{LIFECYCLE_META[status].label}</span>
            </li>
          );
        })}
      </ol>

      <div className="rounded-lg bg-secondary p-3.5">
        <p className="text-sm font-medium text-primary">{LIFECYCLE_META[product.status].meaning}</p>
        <p className="mt-0.5 text-sm text-tertiary">{LIFECYCLE_META[product.status].platform}</p>
        {product.sunsetDate && product.status === "deprecated" && (
          <p className="mt-2 text-sm text-warning-primary">
            Sunset on {product.sunsetDate}
            {product.successor ? `. Successor: ${successors.find((candidate) => candidate.id === product.successor)?.title ?? product.successor}` : ""}
          </p>
        )}
      </div>

      {main ? (
        <div>
          <h3 className="text-sm font-semibold text-primary">To become {LIFECYCLE_META[main.target].label}</h3>
          {main.target === "deprecated" && <p className="mt-1.5 text-sm text-tertiary">You give a sunset date in the next step, so consumers have a date to plan against.</p>}
          <ul className={cx("mt-2.5 flex flex-col gap-2", main.target === "deprecated" && "hidden")}>
            {main.gates.map((gate) => (
              <li key={gate.label} className="flex items-start gap-2 text-sm">
                {gate.ok ? <CheckCircle className="mt-0.5 size-4 shrink-0 text-success-primary" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-error-primary" />}
                <span>
                  <span className={gate.ok ? "text-secondary" : "font-medium text-primary"}>{gate.label}</span>
                  {!gate.ok && gate.detail && <span className="block text-tertiary">{gate.detail}</span>}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {product.status === "proposed" ? (
              <Button size="md" href={`/products/new?from=${encodeURIComponent(product.id)}`}>
                Continue in the wizard
              </Button>
            ) : (
              <Button size="md" isDisabled={!ready || pending} isLoading={pending && !deprecating} onClick={() => (main.target === "deprecated" ? setDeprecating(true) : change(main.target))}>
                {ACTION[main.target]}
              </Button>
            )}
            {abandon && (
              <Button size="md" color="tertiary" isDisabled={pending || !abandon.gates.every((gate) => gate.ok)} onClick={() => change("retired")}>
                Abandon
              </Button>
            )}
          </div>
          {!ready && product.status !== "proposed" && <p className="mt-2 text-sm text-tertiary">Fix the open points in the contract editor, then come back.</p>}
        </div>
      ) : (
        <p className="text-sm text-tertiary">This product has reached the end of its lifecycle.</p>
      )}

      <ModalOverlay isOpen={deprecating} onOpenChange={setDeprecating} isDismissable>
        <Modal className="max-w-md">
          <Dialog>
            <div className="flex w-full flex-col gap-4 p-6">
              <div>
                <h2 className="font-display text-lg font-semibold text-primary">Deprecate {product.title}</h2>
                <p className="mt-1 text-sm text-tertiary">It keeps running until the sunset date. No new consumers can pick it as an input.</p>
              </div>
              <Input label="Sunset date" type="date" isRequired value={sunsetDate} onChange={setSunsetDate} />
              <Pick size="md" label="Successor" clearable value={successor} options={successors.filter((candidate) => candidate.id !== product.id).map((candidate) => ({ id: candidate.id, label: candidate.title }))} onChange={setSuccessor} hint="Where consumers should move to." />
              <div className="flex justify-end gap-2 pt-2">
                <Button color="secondary" onClick={() => setDeprecating(false)}>
                  Cancel
                </Button>
                <Button color="primary-destructive" isDisabled={!sunsetDate || pending} isLoading={pending} onClick={() => change("deprecated", { sunsetDate, successor })}>
                  Deprecate
                </Button>
              </div>
            </div>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </div>
  );
}

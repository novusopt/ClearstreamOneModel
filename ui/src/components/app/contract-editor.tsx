"use client";

import { AlertCircle, AlertTriangle, ArrowNarrowRight, CheckCircle, FlipBackward } from "@untitledui/icons";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Tabs } from "@/components/application/tabs/tabs";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import { Breadcrumbs, Card, CardHeader, LifecycleBadge, Mono, PageHeader } from "@/components/app/bits";
import { DocumentPanel } from "@/components/app/code";
import { RulesEditor, SlaEditor } from "@/components/app/rules-editor";
import type { ColumnIssue } from "@/components/app/schema-editor";
import { SchemaEditor } from "@/components/app/schema-editor";
import { api } from "@/lib/api";
import type { ContractChange } from "@/lib/breaking";
import { diffContracts, nextVersion } from "@/lib/breaking";
import type { PolicyViolation } from "@/lib/policies";
import { evaluatePolicies } from "@/lib/policies";
import { toOdcs, toYaml } from "@/lib/standards/serialize";
import { validateAgainstStandard } from "@/lib/standards/validate";
import type { DataContract, DataProduct, Vocabulary } from "@/lib/types";
import { cx } from "@/utils/cx";

const CHANGE_STYLE: Record<ContractChange["kind"], { label: string; className: string }> = {
  breaking: { label: "Breaking", className: "bg-utility-red-50 text-utility-red-700 ring-utility-red-200" },
  additive: { label: "Added", className: "bg-utility-green-50 text-utility-green-700 ring-utility-green-200" },
  neutral: { label: "Changed", className: "bg-utility-neutral-50 text-utility-neutral-700 ring-utility-neutral-200" },
};

function ChangeList({ changes }: { changes: ContractChange[] }) {
  if (changes.length === 0) return <p className="text-sm text-tertiary">Nothing has changed since the published version.</p>;
  return (
    <ul className="flex flex-col gap-2">
      {changes.map((change) => (
        <li key={change.message} className="flex items-start gap-2.5 text-sm">
          <span className={cx("mt-px shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset", CHANGE_STYLE[change.kind].className)}>{CHANGE_STYLE[change.kind].label}</span>
          <span className="text-secondary">{change.message}</span>
        </li>
      ))}
    </ul>
  );
}

function ViolationList({ title, violations, empty }: { title: string; violations: PolicyViolation[]; empty?: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-primary">{title}</h3>
      {violations.length === 0 ? (
        <p className="mt-2 flex items-center gap-2 text-sm text-tertiary">
          <CheckCircle className="size-4 text-success-primary" />
          {empty ?? "Nothing to fix."}
        </p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2.5">
          {violations.map((violation) => (
            <li key={violation.policyId + violation.message} className="flex items-start gap-2 text-sm">
              {violation.level === "enforce" ? <AlertCircle className="mt-0.5 size-4 shrink-0 text-error-primary" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-primary" />}
              <span>
                <span className="text-primary">{violation.message}</span>
                <span className="block text-tertiary">
                  <Mono>{violation.policyId}</Mono> · {violation.scope === "global" ? "Global" : `${violation.scope} domain`} · {violation.fix}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface ContractEditorProps {
  product: DataProduct;
  published: DataContract;
  vocabulary: Vocabulary;
  /** Products that read this contract through an input port. */
  consumers: { id: string; title: string; status: string }[];
}

export function ContractEditor({ product, published, vocabulary, consumers }: ContractEditorProps) {
  const router = useRouter();
  const [draft, setDraft] = useState(published);
  const [reviewing, setReviewing] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, startSaving] = useTransition();
  const patch = (change: Partial<DataContract>) => setDraft((current) => ({ ...current, ...change }));
  const productHref = `/products/${product.domain}/${product.name}`;

  const { yamlText, schemaIssues } = useMemo(() => {
    const doc = toOdcs(draft, product);
    return { yamlText: toYaml(doc), schemaIssues: validateAgainstStandard("odcs", doc) };
  }, [draft, product]);

  const changes = useMemo(() => diffContracts(published, draft), [published, draft]);
  const version = nextVersion(published.version, changes);
  const breaking = changes.filter((change) => change.kind === "breaking");

  const { now, ahead, issues } = useMemo(() => {
    const current = evaluatePolicies(product, [draft]);
    // For a draft, also show what Active will ask for, so nothing comes as a surprise at promotion.
    const future = product.status === "draft" ? evaluatePolicies(product, [draft], "active").filter((violation) => !current.some((seen) => seen.policyId === violation.policyId && seen.message === violation.message)) : [];
    const byColumn: Record<string, ColumnIssue[]> = {};
    for (const violation of current) if (violation.column) (byColumn[violation.column] ??= []).push({ level: violation.level, message: violation.message, policyId: violation.policyId });
    for (const violation of future) if (violation.column) (byColumn[violation.column] ??= []).push({ level: "warn", message: `Needed for Active: ${violation.message}`, policyId: violation.policyId });
    return { now: current, ahead: future, issues: byColumn };
  }, [draft, product]);

  const blocking = now.filter((violation) => violation.level === "enforce");
  const canSave = changes.length > 0 && blocking.length === 0 && schemaIssues.length === 0;

  const save = () =>
    startSaving(async () => {
      try {
        const { run } = await api.saveContract(published.id, draft, message.trim() || `Change the ${published.port} contract`);
        router.push(`${productHref}?run=${run.id}`);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Saving failed");
      }
    });

  return (
    <>
      <PageHeader
        eyebrow={<Breadcrumbs items={[{ label: "Products", href: "/products" }, { label: product.title, href: productHref }, { label: `Contract: ${published.port}` }]} />}
        title={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {draft.name || "Contract"}
            <LifecycleBadge status={published.status} size="md" />
          </span>
        }
        description={
          <span className="flex flex-wrap items-center gap-2 text-sm">
            <Mono>{published.id}</Mono>
            <span aria-hidden>·</span>
            <Mono>{published.version}</Mono>
            {version !== published.version && (
              <>
                <ArrowNarrowRight className="size-4 text-quaternary" aria-label="becomes" />
                <Mono className={cx("rounded px-1.5 py-0.5 font-medium", breaking.length ? "bg-utility-red-50 text-utility-red-700" : "bg-utility-brand-50 text-utility-brand-700")}>{version}</Mono>
              </>
            )}
          </span>
        }
        actions={
          <>
            <Button color="secondary" iconLeading={FlipBackward} isDisabled={changes.length === 0} onClick={() => setDraft(published)}>
              Discard
            </Button>
            <Button isDisabled={!canSave} onClick={() => setReviewing(true)}>
              Review and save
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-6 px-5 py-6 sm:px-8 xl:grid-cols-[minmax(0,1fr)_24rem] 2xl:grid-cols-[minmax(0,1fr)_29rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader title="Schema" description="Each column: its type, constraints, what it means and how sensitive it is. Meaning and tags come from the catalog's vocabulary." />
            <SchemaEditor columns={draft.columns} onChange={(columns) => patch({ columns })} vocabulary={vocabulary} issues={issues} />
          </Card>

          <Card>
            <CardHeader title="Table rules" description="Checks on the table as a whole." />
            <div className="p-5">
              <RulesEditor scope="table" rules={draft.quality} onChange={(quality) => patch({ quality })} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Service levels" description="What consumers can rely on. The freshness watchdog checks against these." />
            <div className="p-5">
              <SlaEditor sla={draft.sla} onChange={(sla) => patch({ sla })} columns={draft.columns} table={draft.table} />
            </div>
          </Card>

          <Card>
            <CardHeader title="About this output" />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Input label="Contract name" value={draft.name} onChange={(name) => patch({ name })} />
              <Input label="Table" value={draft.table} onChange={(table) => patch({ table })} inputClassName="font-mono" hint={published.status === "active" ? "Renaming the table breaks consumers." : undefined} />
              <TextArea label="Purpose" rows={3} className="sm:col-span-2" value={draft.purpose} onChange={(purpose) => patch({ purpose })} />
              <TextArea label="What one row is" rows={2} className="sm:col-span-2" value={draft.tableDescription} onChange={(tableDescription) => patch({ tableDescription })} />
            </div>
          </Card>
        </div>

        <aside className="xl:sticky xl:top-6">
          <Tabs defaultSelectedKey="yaml">
            <Tabs.List type="button-border" size="sm" fullWidth>
              <Tabs.Item id="yaml" label="Contract file" />
              <Tabs.Item id="checks" label="Checks" badge={now.length + ahead.length || undefined} />
              <Tabs.Item id="changes" label="Changes" badge={changes.length || undefined} />
            </Tabs.List>
            <Tabs.Panel id="yaml" className="pt-3">
              <DocumentPanel title={`contracts/${published.port}.odcs.yaml`} standard="ODCS v3.1.0" yamlText={yamlText} issues={schemaIssues} maxHeight="calc(100dvh - 15rem)" />
            </Tabs.Panel>
            <Tabs.Panel id="checks" className="pt-3">
              <Card className="flex flex-col gap-5 p-5">
                <ViolationList title="Policies" violations={now} empty="All policies pass." />
                {product.status === "draft" && <ViolationList title="Still needed to become Active" violations={ahead} empty="Ready for promotion." />}
              </Card>
            </Tabs.Panel>
            <Tabs.Panel id="changes" className="pt-3">
              <Card className="p-5">
                <ChangeList changes={changes} />
              </Card>
            </Tabs.Panel>
          </Tabs>
        </aside>
      </div>

      <ModalOverlay isOpen={reviewing} onOpenChange={setReviewing} isDismissable>
        <Modal className="max-w-xl">
          <Dialog>
            <div className="flex w-full flex-col gap-5 p-6">
              <div>
                <h2 className="font-display text-lg font-semibold text-primary">Save as a pull request</h2>
                <p className="mt-1 text-sm text-tertiary">
                  Version <Mono>{published.version}</Mono> becomes <Mono className="font-medium text-primary">{version}</Mono>. The pipeline validates, tests and publishes it.
                </p>
              </div>

              {breaking.length > 0 && (
                <div className="rounded-lg border border-error_subtle bg-error-primary p-3.5 text-sm">
                  <p className="flex items-center gap-2 font-semibold text-error-primary">
                    <AlertCircle className="size-4" />
                    {breaking.length === 1 ? "This is a breaking change" : `These are ${breaking.length} breaking changes`}
                  </p>
                  {consumers.length > 0 ? (
                    <p className="mt-1 text-secondary">
                      {consumers.length === 1 ? "One product reads" : `${consumers.length} products read`} this contract and will need to change: <strong className="font-medium">{consumers.map((consumer) => consumer.title).join(", ")}</strong>.
                    </p>
                  ) : (
                    <p className="mt-1 text-secondary">No other product reads this contract yet.</p>
                  )}
                  {published.status === "active" && <p className="mt-1 text-secondary">Because the product is Active, the major version is raised.</p>}
                </div>
              )}

              <div className="max-h-56 overflow-y-auto rounded-lg border border-secondary p-3.5">
                <ChangeList changes={changes} />
              </div>
              <Input label="Title of the change" placeholder={`Change the ${published.port} contract`} value={message} onChange={setMessage} />
              <div className="flex justify-end gap-2">
                <Button color="secondary" onClick={() => setReviewing(false)}>
                  Keep editing
                </Button>
                <Button color={breaking.length ? "primary-destructive" : "primary"} isLoading={saving} isDisabled={saving} onClick={save}>
                  {breaking.length ? "Save breaking change" : "Save"}
                </Button>
              </div>
            </div>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </>
  );
}

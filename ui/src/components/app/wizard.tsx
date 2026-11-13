"use client";

import { AlertCircle, ArrowLeft, ArrowNarrowRight, ArrowRight, Check, CheckCircle, Database01, LayersThree01, Lightning01, RefreshCw01, XCircle } from "@untitledui/icons";
import { useRouter } from "next/navigation";
import type { FC, ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import { ToggleButton } from "react-aria-components";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import { Breadcrumbs, Card, Eyebrow, Mono, PageHeader } from "@/components/app/bits";
import { Code, DocumentPanel } from "@/components/app/code";
import { FieldGroup, Pick } from "@/components/app/fields";
import { RulesEditor, SlaEditor } from "@/components/app/rules-editor";
import type { ColumnIssue } from "@/components/app/schema-editor";
import { SchemaEditor } from "@/components/app/schema-editor";
import { api } from "@/lib/api";
import { newColumn, toSlug, uid } from "@/lib/describe";
import { evaluatePolicies } from "@/lib/policies";
import { toOdcs, toOdps, toYaml } from "@/lib/standards/serialize";
import { validateAgainstStandard } from "@/lib/standards/validate";
import type { Column, DataContract, DataProduct, NewProductInput, QualityRule, SlaProperty, TemplateId, TemplateInfo, Vocabulary } from "@/lib/types";
import { cx } from "@/utils/cx";

const STEPS = ["Template", "Basics", "Inputs", "Contract", "Transformation", "Review"] as const;
const TEMPLATE_ICON: Record<TemplateId, FC<{ className?: string }>> = { "source-aligned-dbt": Database01, "aggregate-dbt": LayersThree01, "spark-iceberg": Lightning01 };
const SCHEDULES = [
  { id: "0 6 * * *", label: "Daily at 06:00" },
  { id: "0 * * * *", label: "Hourly" },
  { id: "0 6 * * 1", label: "Weekly, Monday 06:00" },
  { id: "0 7 1 * *", label: "Monthly, 1st at 07:00" },
];
const SNAKE = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/;
const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

interface Form {
  template: TemplateId;
  title: string;
  name: string;
  nameTouched: boolean;
  domain: string | undefined;
  owner: string;
  purpose: string;
  schedule: string;
  /** Contract ids of the chosen input ports. */
  inputs: string[];
  sourceTable: string;
  port: string;
  portTouched: boolean;
  tableDescription: string;
  columns: Column[];
  /** Where a carried-over column comes from, keyed by column id. */
  origins: Record<string, { contractId: string; column: string }>;
  quality: QualityRule[];
  sla: SlaProperty[];
  code: string;
  codeTouched: boolean;
}

/** A starting transformation that selects every output column from where it was carried over. */
function generateCode(form: Form, template: TemplateInfo, contracts: Map<string, DataContract>): string {
  const inputs = form.inputs.map((id) => contracts.get(id)).filter((contract): contract is DataContract => Boolean(contract));
  const named = form.columns.filter((column) => column.name);
  const sourceOf = (column: Column) => contracts.get(form.origins[column.id]?.contractId ?? "");

  if (template.language === "python") {
    const reads = inputs.map((input) => `${input.port} = spark.table(input_port("${input.port}"))`);
    const [first, ...rest] = inputs;
    const joins = rest.map((input) => {
      const shared = first.columns.find((column) => input.columns.some((other) => other.name === column.name))?.name;
      return `    .join(${input.port}, on="${shared ?? "TODO_join_key"}")`;
    });
    const selects = named.map((column) => (sourceOf(column) ? `        "${form.origins[column.id].column}",` : `        F.lit(None).alias("${column.name}"),  # TODO`));
    return [
      "from pyspark.sql import functions as F",
      "",
      ...reads,
      "",
      "result = (",
      `    ${first?.port ?? "spark.table(\"TODO\")"}`,
      ...joins,
      "    .select(",
      ...selects,
      "    )",
      ")",
      "",
      `write_output_port(result, "${form.port || "output"}")`,
    ].join("\n");
  }

  const qualify = inputs.length > 1;
  const lines = named.map((column) => {
    const origin = form.origins[column.id];
    const source = sourceOf(column);
    if (!source) return template.takesInputPorts ? `    null as ${column.name}  -- TODO` : `    ${column.name}`;
    const reference = qualify ? `${source.port}.${origin.column}` : origin.column;
    return origin.column === column.name ? `    ${reference}` : `    ${reference} as ${column.name}`;
  });
  const select = `select\n${lines.length ? lines.join(",\n") : "    *"}`;
  if (!template.takesInputPorts) return `${select}\nfrom {{ source('raw', '${form.sourceTable || "TODO_source_table"}') }}`;
  if (inputs.length === 0) return `${select}\nfrom TODO`;
  const [first, ...rest] = inputs;
  const joins = rest.map((input) => {
    const shared = first.columns.find((column) => input.columns.some((other) => other.name === column.name))?.name;
    const condition = shared ? `${input.port}.${shared} = ${first.port}.${shared}` : "TODO";
    return `join {{ ref('${input.port}') }} as ${input.port} on ${condition}`;
  });
  return [select, `from {{ ref('${first.port}') }}${qualify ? ` as ${first.port}` : ""}`, ...joins].join("\n");
}

function Readiness({ items }: { items: { label: string; ok: boolean }[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.label} className="flex items-start gap-2 text-sm">
          {item.ok ? <CheckCircle className="mt-0.5 size-4 shrink-0 text-success-primary" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-quaternary" />}
          <span className={item.ok ? "text-secondary" : "text-tertiary"}>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

function StepSection({ title, lead, children }: { title: string; lead: string; children: ReactNode }) {
  return (
    <div className="animate-rise">
      <div className="border-b border-secondary px-6 py-5">
        <h2 className="font-display text-xl font-semibold tracking-tight text-primary">{title}</h2>
        <p className="mt-1 text-sm text-tertiary">{lead}</p>
      </div>
      {children}
    </div>
  );
}

interface WizardProps {
  templates: TemplateInfo[];
  vocabulary: Vocabulary;
  products: DataProduct[];
  contracts: DataContract[];
  /** A proposed product to carry on from. */
  proposal?: DataProduct;
}

export function Wizard({ templates, vocabulary, products, contracts, proposal }: WizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(proposal ? 2 : 0);
  const [reached, setReached] = useState(step);
  const [submitting, startSubmit] = useTransition();
  const [form, setForm] = useState<Form>({
    template: proposal?.template ?? "aggregate-dbt",
    title: proposal?.title ?? "",
    name: proposal?.name ?? "",
    nameTouched: Boolean(proposal),
    domain: proposal?.domain,
    owner: proposal?.owner ?? "",
    purpose: proposal?.purpose ?? "",
    schedule: proposal?.schedule ?? SCHEDULES[0].id,
    inputs: [],
    sourceTable: "",
    port: proposal ? proposal.name.replace(/-/g, "_") : "",
    portTouched: false,
    tableDescription: "",
    columns: [],
    origins: {},
    quality: [],
    sla: [{ id: uid(), property: "frequency", value: 1, unit: "d" }],
    code: "",
    codeTouched: false,
  });
  const patch = (change: Partial<Form>) => setForm((current) => ({ ...current, ...change }));

  const template = templates.find((candidate) => candidate.id === form.template) ?? templates[0];
  const contractById = useMemo(() => new Map(contracts.map((contract) => [contract.id, contract])), [contracts]);
  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const available = contracts.filter((contract) => productById.get(contract.productId)?.status === "active");
  const domain = vocabulary.domains.find((candidate) => candidate.id === form.domain);
  const code = form.codeTouched ? form.code : generateCode(form, template, contractById);

  const nameTaken = !proposal && products.some((product) => product.domain === form.domain && product.name === form.name);
  const columnNames = form.columns.map((column) => column.name);

  const { product, contract } = useMemo(() => {
    const id = `${form.domain ?? "domain"}.${form.name || "product"}`;
    const timestamp = "2026-01-01T00:00:00Z";
    const draftProduct: DataProduct = {
      id,
      name: form.name || "product",
      title: form.title || "Untitled product",
      domain: form.domain ?? "domain",
      purpose: form.purpose,
      status: "draft",
      version: "0.1.0",
      team: domain?.team ?? "",
      owner: form.owner,
      template: form.template,
      schedule: form.schedule,
      inputPorts: template.takesInputPorts ? form.inputs.flatMap((inputId) => { const input = contractById.get(inputId); return input ? [{ name: input.port, contractId: input.id, version: input.version }] : []; }) : [],
      outputPorts: [{ name: form.port || "output", description: form.tableDescription, contractId: `${id}.${form.port || "output"}`, version: "0.1.0" }],
      tags: [],
      transformation: { language: template.language, code },
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const draftContract: DataContract = {
      id: `${id}.${form.port || "output"}`,
      productId: id,
      port: form.port || "output",
      name: form.title || "Untitled product",
      version: "0.1.0",
      status: "draft",
      purpose: form.purpose,
      table: form.port || "output",
      tableDescription: form.tableDescription,
      columns: form.columns,
      quality: form.quality,
      sla: form.sla,
      tags: [],
      updatedAt: timestamp,
    };
    return { product: draftProduct, contract: draftContract };
  }, [form, template, domain, contractById, code]);

  const checks = useMemo(() => {
    const odps = toOdps(product);
    const odcs = toOdcs(contract, product);
    const now = evaluatePolicies(product, [contract]);
    const ahead = evaluatePolicies(product, [contract], "active").filter((violation) => !now.some((seen) => seen.policyId === violation.policyId && seen.message === violation.message));
    const issues: Record<string, ColumnIssue[]> = {};
    for (const violation of now) if (violation.column) (issues[violation.column] ??= []).push({ level: violation.level, message: violation.message, policyId: violation.policyId });
    return { odpsYaml: toYaml(odps), odpsIssues: validateAgainstStandard("odps", odps), odcsYaml: toYaml(odcs), odcsIssues: validateAgainstStandard("odcs", odcs), now, ahead, issues };
  }, [product, contract]);

  const blocking = checks.now.filter((violation) => violation.level === "enforce");
  const valid = [
    true,
    Boolean(form.title.trim() && KEBAB.test(form.name) && !nameTaken && form.domain && /\S+@\S+\.\S+/.test(form.owner) && form.purpose.trim()),
    template.takesInputPorts ? form.inputs.length > 0 : SNAKE.test(form.sourceTable),
    SNAKE.test(form.port) && form.columns.length > 0 && columnNames.every((name) => name.trim()) && new Set(columnNames).size === columnNames.length,
    code.trim().length > 0,
  ];
  const ready = valid.every(Boolean) && blocking.length === 0 && checks.odpsIssues.length === 0 && checks.odcsIssues.length === 0;

  const go = (target: number) => {
    setStep(target);
    setReached((current) => Math.max(current, target));
    window.scrollTo({ top: 0 });
  };

  const toggleInput = (contractId: string, selected: boolean) => {
    if (selected) return patch({ inputs: [...form.inputs, contractId] });
    const dropped = new Set(form.columns.filter((column) => form.origins[column.id]?.contractId === contractId).map((column) => column.id));
    patch({ inputs: form.inputs.filter((id) => id !== contractId), columns: form.columns.filter((column) => !dropped.has(column.id)) });
  };

  const toggleCarry = (source: DataContract, column: Column, selected: boolean) => {
    if (!selected) {
      const carried = form.columns.find((candidate) => form.origins[candidate.id]?.contractId === source.id && form.origins[candidate.id]?.column === column.name);
      return patch({ columns: form.columns.filter((candidate) => candidate.id !== carried?.id) });
    }
    // The copy keeps meaning and sensitivity, so classification and tags follow the data downstream.
    const copy = newColumn({ ...column, id: uid(), name: columnNames.includes(column.name) ? `${source.port}_${column.name}` : column.name, primaryKey: false, unique: false, quality: [] });
    patch({ columns: [...form.columns, copy], origins: { ...form.origins, [copy.id]: { contractId: source.id, column: column.name } } });
  };

  const submit = (status: "proposed" | "draft") =>
    startSubmit(async () => {
      const input: NewProductInput = {
        name: form.name,
        title: form.title.trim(),
        domain: form.domain ?? "",
        purpose: form.purpose.trim(),
        owner: form.owner.trim(),
        template: form.template,
        schedule: form.schedule,
        inputPorts: product.inputPorts,
        port: form.port,
        table: form.port,
        tableDescription: form.tableDescription.trim(),
        columns: form.columns,
        quality: form.quality,
        sla: form.sla,
        transformation: { language: template.language, code },
        status,
      };
      try {
        const { product: created, run } = await api.createProduct(input);
        router.push(`/products/${created.domain}/${created.name}${run ? `?run=${run.id}` : ""}`);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Creating the product failed");
      }
    });

  const readiness = [
    { label: `Template: ${template.name}`, ok: true },
    { label: "Named, owned and described", ok: valid[1] },
    { label: template.takesInputPorts ? "At least one input port" : "Raw source table named", ok: valid[2] },
    { label: "Output port with named columns", ok: valid[3] },
    { label: "Passes the policies for a draft", ok: valid[3] && blocking.length === 0 },
    { label: "Valid ODPS and ODCS documents", ok: checks.odpsIssues.length === 0 && checks.odcsIssues.length === 0 },
  ];

  return (
    <>
      <PageHeader
        eyebrow={<Breadcrumbs items={[{ label: "Products", href: "/products" }, { label: proposal ? `Build ${proposal.title}` : "New data product" }]} />}
        title={proposal ? `Build ${proposal.title}` : "New data product"}
        description="The wizard fills in a template. The result is a pull request with a product spec, a data contract and the transformation code."
      />

      <div className="grid items-start gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[13rem_minmax(0,1fr)] 2xl:grid-cols-[13rem_minmax(0,1fr)_21rem]">
        <nav aria-label="Steps" className="lg:sticky lg:top-6">
          <ol className="flex gap-1 overflow-x-auto lg:flex-col">
            {STEPS.map((label, index) => {
              const current = index === step;
              const done = index < step && valid[index] !== false;
              return (
                <li key={label}>
                  <button
                    type="button"
                    disabled={index > reached}
                    aria-current={current ? "step" : undefined}
                    onClick={() => go(index)}
                    className={cx(
                      "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium whitespace-nowrap outline-brand transition-colors focus-visible:outline-2 disabled:cursor-not-allowed",
                      current ? "bg-ink-900 text-white" : index > reached ? "text-quaternary" : "text-secondary hover:bg-primary",
                    )}
                  >
                    <span className={cx("flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px]", current ? "bg-brand-400 text-ink-950" : done ? "bg-brand-solid text-white" : "border border-primary")}>
                      {done ? <Check className="size-3" /> : index + 1}
                    </span>
                    {label}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <Card className="min-w-0 overflow-hidden">
          {step === 0 && (
            <StepSection title="Choose a template" lead="A template decides how the product is built and run. The spec and the contract look the same for all of them.">
              <div className="grid gap-4 p-6 md:grid-cols-3">
                {templates.map((item) => {
                  const Icon = TEMPLATE_ICON[item.id];
                  const selected = item.id === form.template;
                  return (
                    <ToggleButton
                      key={item.id}
                      isSelected={selected}
                      onChange={() => patch({ template: item.id, inputs: item.takesInputPorts ? form.inputs : [], codeTouched: false })}
                      className={cx(
                        "flex cursor-pointer flex-col items-start gap-3 rounded-xl border p-5 text-left outline-offset-2 outline-brand transition-[border-color,box-shadow] focus-visible:outline-2",
                        selected ? "border-brand bg-brand-primary ring-2 ring-brand-200" : "border-secondary hover:border-primary hover:shadow-sm",
                      )}
                    >
                      <span className={cx("flex size-10 items-center justify-center rounded-lg", selected ? "bg-brand-solid text-white" : "bg-secondary text-tertiary")}>
                        <Icon className="size-5" />
                      </span>
                      <span>
                        <span className="block font-display text-lg font-semibold text-primary">{item.name}</span>
                        <Mono className="text-xs text-tertiary">{item.engine}</Mono>
                      </span>
                      <span className="text-sm text-tertiary">{item.summary}</span>
                    </ToggleButton>
                  );
                })}
              </div>
            </StepSection>
          )}

          {step === 1 && (
            <StepSection title="Name it and say what it is for" lead="This is what people see when they look for data. Write the purpose for someone outside your team.">
              <div className="grid gap-5 p-6 sm:grid-cols-2">
                <Input label="Title" isRequired placeholder="Counterparty Fail Rates" value={form.title} onChange={(title) => patch({ title, ...(form.nameTouched ? {} : { name: toSlug(title), ...(form.portTouched ? {} : { port: toSlug(title).replace(/-/g, "_") }) }) })} />
                <Input
                  label="Name"
                  isRequired
                  isDisabled={Boolean(proposal)}
                  inputClassName="font-mono"
                  value={form.name}
                  onChange={(name) => patch({ name, nameTouched: true, ...(form.portTouched ? {} : { port: name.replace(/-/g, "_") }) })}
                  isInvalid={Boolean(form.name) && (!KEBAB.test(form.name) || nameTaken)}
                  hint={nameTaken ? "A product with this name already exists in the domain." : "Lower-case words joined by hyphens. Used in paths and table names."}
                />
                <Pick size="md" label="Domain" placeholder="Choose a domain" value={form.domain} options={vocabulary.domains.map((item) => ({ id: item.id, label: item.name, supportingText: item.team }))} onChange={(value) => !proposal && patch({ domain: value })} hint={domain ? `Owned by the ${domain.team} team.` : "The domain decides which policies apply."} />
                <Input label="Owner" isRequired type="email" placeholder="team@example.org" value={form.owner} onChange={(owner) => patch({ owner })} hint="Who consumers contact, and who is told when a run fails." />
                <TextArea label="Purpose" isRequired rows={3} className="sm:col-span-2" placeholder="What question does this product answer, and for whom?" value={form.purpose} onChange={(purpose) => patch({ purpose })} />
                <Pick size="md" label="Schedule" value={form.schedule} options={SCHEDULES} onChange={(schedule) => schedule && patch({ schedule })} hint="Applies once the product is Active." />
              </div>
            </StepSection>
          )}

          {step === 2 &&
            (template.takesInputPorts ? (
              <StepSection title="Choose what it reads" lead="Only output ports of Active products can be used. Each one comes with a contract you can rely on.">
                <div className="flex flex-col gap-6 p-6">
                  <ul className="grid gap-3 md:grid-cols-2">
                    {available.map((input) => {
                      const source = productById.get(input.productId);
                      const selected = form.inputs.includes(input.id);
                      return (
                        <li key={input.id}>
                          <ToggleButton
                            isSelected={selected}
                            onChange={(value) => toggleInput(input.id, value)}
                            className={cx(
                              "flex w-full cursor-pointer items-start gap-3 rounded-xl border p-4 text-left outline-offset-2 outline-brand transition-[border-color,box-shadow] focus-visible:outline-2",
                              selected ? "border-brand bg-brand-primary ring-2 ring-brand-200" : "border-secondary hover:border-primary",
                            )}
                          >
                            <span className={cx("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border", selected ? "border-brand-solid bg-brand-solid text-white" : "border-primary bg-primary")}>{selected && <Check className="size-3.5" />}</span>
                            <span className="min-w-0">
                              <Eyebrow>{source?.domain}</Eyebrow>
                              <span className="block font-display text-md font-semibold text-primary">{source?.title}</span>
                              <span className="mt-0.5 block text-sm text-tertiary">
                                <Mono className="font-medium text-brand-secondary">{input.port}</Mono> · <Mono>v{input.version}</Mono> · {input.columns.length} columns
                              </span>
                            </span>
                          </ToggleButton>
                        </li>
                      );
                    })}
                  </ul>

                  {form.inputs.length > 0 && (
                    <FieldGroup label="Carry columns into the output" hint="A carried column keeps its description, business term, classification and tags, so meaning and sensitivity follow the data.">
                      <div className="flex flex-col gap-4">
                        {form.inputs.map((inputId) => {
                          const input = contractById.get(inputId);
                          if (!input) return null;
                          return (
                            <div key={inputId} className="rounded-lg border border-secondary p-3.5">
                              <Mono className="text-sm font-medium text-brand-secondary">{input.port}</Mono>
                              <div className="mt-2.5 flex flex-wrap gap-2">
                                {input.columns.map((column) => {
                                  const carried = form.columns.some((candidate) => form.origins[candidate.id]?.contractId === input.id && form.origins[candidate.id]?.column === column.name);
                                  return (
                                    <ToggleButton
                                      key={column.id}
                                      isSelected={carried}
                                      onChange={(value) => toggleCarry(input, column, value)}
                                      className={cx(
                                        "flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-xs outline-brand transition-colors focus-visible:outline-2",
                                        carried ? "border-brand-solid bg-brand-solid text-white" : "border-primary bg-primary text-secondary hover:border-brand",
                                      )}
                                    >
                                      {carried && <Check className="size-3" />}
                                      {column.name}
                                      <span className={carried ? "text-brand-200" : "text-quaternary"}>{column.logicalType}</span>
                                    </ToggleButton>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </FieldGroup>
                  )}
                </div>
              </StepSection>
            ) : (
              <StepSection title="Name the raw source" lead="A source-aligned product reads one raw table and takes no input ports.">
                <div className="p-6">
                  <Input label="Raw source table" isRequired placeholder="settlement_instructions" inputClassName="font-mono" className="max-w-md" value={form.sourceTable} onChange={(sourceTable) => patch({ sourceTable })} hint="The table in the raw schema, as loaded from the operational system." />
                </div>
              </StepSection>
            ))}

          {step === 3 && (
            <StepSection title="Define the output and its contract" lead="The contract is what consumers rely on: the columns, what they mean, how sensitive they are and what is checked.">
              <div className="grid gap-5 border-b border-secondary p-6 sm:grid-cols-2">
                <Input label="Output port" isRequired inputClassName="font-mono" value={form.port} onChange={(port) => patch({ port, portTouched: true })} isInvalid={Boolean(form.port) && !SNAKE.test(form.port)} hint="Also the table name. Lower-case words joined by underscores." />
                <Input label="What one row is" placeholder="One row per counterparty and day" value={form.tableDescription} onChange={(tableDescription) => patch({ tableDescription })} />
              </div>
              <SchemaEditor columns={form.columns} onChange={(columns) => patch({ columns })} vocabulary={vocabulary} issues={checks.issues} />
              <div className="grid gap-6 border-t border-secondary p-6 xl:grid-cols-2">
                <FieldGroup label="Table rules">
                  <RulesEditor scope="table" rules={form.quality} onChange={(quality) => patch({ quality })} />
                </FieldGroup>
                <FieldGroup label="Service levels">
                  <SlaEditor sla={form.sla} onChange={(sla) => patch({ sla })} columns={form.columns} table={form.port} />
                </FieldGroup>
              </div>
            </StepSection>
          )}

          {step === 4 && (
            <StepSection title="Write the transformation" lead={`A starting point generated from the inputs and the contract. ${template.language === "sql" ? "It becomes a dbt model." : "It becomes a PySpark job."} Larger changes are easier on the pull request branch.`}>
              <div className="flex items-center justify-between gap-3 border-b border-secondary bg-secondary px-6 py-2.5">
                <Mono className="text-xs font-medium text-secondary">{template.language === "sql" ? `dbt/models/${form.port || "output"}.sql` : `spark/${(form.name || "product").replace(/-/g, "_")}.py`}</Mono>
                <Button size="sm" color="tertiary" iconLeading={RefreshCw01} isDisabled={!form.codeTouched} onClick={() => patch({ codeTouched: false })}>
                  Regenerate
                </Button>
              </div>
              <Code value={code} language={template.language} onChange={(value) => patch({ code: value, codeTouched: true })} minHeight="320px" maxHeight="560px" ariaLabel="Transformation code" />
            </StepSection>
          )}

          {step === 5 && (
            <StepSection title="Review and create" lead="These three files are what gets committed. Nothing else describes the product.">
              <div className="flex flex-col gap-6 p-6">
                {blocking.length > 0 && (
                  <div className="rounded-lg border border-error_subtle bg-error-primary p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-error-primary">
                      <AlertCircle className="size-4" />
                      Fix these before creating the product
                    </p>
                    <ul className="mt-2 flex flex-col gap-1 text-sm text-secondary">
                      {blocking.map((violation) => (
                        <li key={violation.policyId + violation.message}>
                          {violation.message}. {violation.fix} <Mono className="text-tertiary">{violation.policyId}</Mono>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {checks.ahead.length > 0 && (
                  <div className="rounded-lg border border-secondary bg-secondary p-4">
                    <p className="text-sm font-semibold text-primary">Fine for a draft. Still needed before it can become Active:</p>
                    <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm text-secondary">
                      {checks.ahead.map((violation) => (
                        <li key={violation.policyId + violation.message}>{violation.message}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="grid items-start gap-6 xl:grid-cols-2">
                  <DocumentPanel title="dataproduct.odps.yaml" standard="ODPS v1.0.0" yamlText={checks.odpsYaml} issues={checks.odpsIssues} maxHeight="420px" />
                  <DocumentPanel title={`contracts/${form.port || "output"}.odcs.yaml`} standard="ODCS v3.1.0" yamlText={checks.odcsYaml} issues={checks.odcsIssues} maxHeight="420px" />
                </div>
              </div>
            </StepSection>
          )}

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-secondary bg-secondary px-6 py-4">
            <Button color="secondary" iconLeading={ArrowLeft} isDisabled={step === 0} onClick={() => go(step - 1)}>
              Back
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              {step === 1 && !proposal && (
                <Button color="tertiary" isDisabled={!valid[1] || submitting} onClick={() => submit("proposed")}>
                  Register as a proposal only
                </Button>
              )}
              {step < STEPS.length - 1 ? (
                <Button iconTrailing={ArrowRight} isDisabled={!valid[step]} onClick={() => go(step + 1)}>
                  Continue
                </Button>
              ) : (
                <Button isDisabled={!ready || submitting} isLoading={submitting} onClick={() => submit("draft")}>
                  Create data product
                </Button>
              )}
            </div>
          </footer>
        </Card>

        <aside className="hidden flex-col gap-6 2xl:sticky 2xl:top-6 2xl:flex">
          <Card className="overflow-hidden">
            <div className="bg-dots p-5">
              <Eyebrow>Blueprint</Eyebrow>
              <div className="mt-4 flex flex-col items-center gap-2">
                <div className="flex flex-wrap justify-center gap-1.5">
                  {product.inputPorts.length === 0 && <span className="rounded-md border border-dashed border-primary bg-primary px-2 py-1 font-mono text-xs text-tertiary">{template.takesInputPorts ? "no inputs yet" : form.sourceTable || "raw source"}</span>}
                  {product.inputPorts.map((port) => (
                    <span key={port.contractId} className="rounded-md border border-primary bg-primary px-2 py-1 font-mono text-xs text-secondary">
                      {port.name}
                    </span>
                  ))}
                </div>
                <ArrowNarrowRight className="size-5 rotate-90 text-quaternary" aria-hidden />
                <div className="w-full rounded-xl border border-brand bg-primary p-3.5 text-center shadow-sm">
                  <Eyebrow>{form.domain ?? "domain"}</Eyebrow>
                  <p className="mt-0.5 font-display text-md font-semibold text-primary">{form.title || "Untitled product"}</p>
                  <Mono className="text-xs text-tertiary">{template.engine}</Mono>
                </div>
                <ArrowNarrowRight className="size-5 rotate-90 text-quaternary" aria-hidden />
                <span className="rounded-md bg-brand-solid px-2 py-1 font-mono text-xs font-medium text-white">
                  {form.port || "output"} · {form.columns.length} {form.columns.length === 1 ? "column" : "columns"}
                </span>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="mb-3 font-display text-md font-semibold text-primary">Ready to create?</h2>
            <Readiness items={readiness} />
          </Card>
        </aside>
      </div>
    </>
  );
}

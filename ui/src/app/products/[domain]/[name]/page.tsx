import { AlertCircle, AlertTriangle, ArrowNarrowRight, CheckCircle, Edit05 } from "@untitledui/icons";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, Card, CardHeader, HistoryStrip, LifecycleBadge, Mono, PageHeader, describeSchedule, formatDate } from "@/components/app/bits";
import { Code, DocumentPanel } from "@/components/app/code";
import { LifecyclePanel } from "@/components/app/lifecycle-panel";
import { LineageMap } from "@/components/app/lineage-map";
import { PipelineProgress } from "@/components/app/pipeline-progress";
import { ProductTabs } from "@/components/app/product-tabs";
import { SchemaTable } from "@/components/app/schema-table";
import { Button } from "@/components/base/buttons/button";
import { backend } from "@/lib/backend";
import { allowedTransitions, gatesFor } from "@/lib/lifecycle";
import { POLICIES, evaluatePolicies } from "@/lib/policies";
import { toOdcs, toOdps, toYaml } from "@/lib/standards/serialize";
import { validateAgainstStandard } from "@/lib/standards/validate";
import { cx } from "@/utils/cx";

export const dynamic = "force-dynamic";

type Params = Promise<{ domain: string; name: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { domain, name } = await params;
  return { title: (await backend.getProduct(domain, name))?.title ?? "Product" };
}

const th = "px-4 py-2.5 text-left font-mono text-[11px] font-medium tracking-[0.06em] text-tertiary uppercase";

export default async function ProductPage({ params, searchParams }: { params: Params; searchParams: Promise<{ run?: string }> }) {
  const [{ domain, name }, { run: runId }] = await Promise.all([params, searchParams]);
  const product = await backend.getProduct(domain, name);
  if (!product) notFound();

  const [products, allContracts, vocabulary, templates, quality, consumers, runs, run] = await Promise.all([
    backend.listProducts(),
    backend.listContracts(),
    backend.getVocabulary(),
    backend.listTemplates(),
    backend.getQuality(product.id),
    backend.consumersOf(product.id),
    backend.listRuns(product.id),
    runId ? backend.getRun(runId) : undefined,
  ]);
  const contracts = allContracts.filter((contract) => contract.productId === product.id);
  const template = templates.find((candidate) => candidate.id === product.template);
  const violations = evaluatePolicies(product, contracts);
  const applicable = POLICIES.filter((policy) => (policy.scope === "global" || policy.scope === product.domain) && policy.appliesTo.includes(product.status));
  const transitions = allowedTransitions(product.status).map((target) => ({ target, gates: gatesFor(target, { product, contracts, quality, consumers }) }));
  const href = `/products/${product.domain}/${product.name}`;
  const editable = product.status !== "retired" && contracts.length > 0;
  const upstream = (contractId: string) => {
    const contract = allContracts.find((candidate) => candidate.id === contractId);
    return contract && products.find((candidate) => candidate.id === contract.productId);
  };

  const odps = toOdps(product);
  const facts = [
    { label: "Owner", value: product.owner },
    { label: "Team", value: product.team },
    { label: "Template", value: template ? `${template.name} · ${template.engine}` : product.template },
    { label: "Schedule", value: `${describeSchedule(product.schedule)}${product.status === "active" || product.status === "deprecated" ? "" : " (once Active)"}` },
    { label: "Created", value: formatDate(product.createdAt) },
    { label: "Last change", value: formatDate(product.updatedAt) },
  ];

  const overview = (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
      <div className="flex min-w-0 flex-col gap-6">
        <Card>
          <CardHeader title="About" />
          <div className="flex flex-col gap-4 p-5">
            <p className="text-md text-secondary">{product.purpose}</p>
            {product.usage && (
              <p className="text-sm text-tertiary">
                <span className="font-medium text-secondary">Used for: </span>
                {product.usage}
              </p>
            )}
            {product.limitations && (
              <p className="text-sm text-tertiary">
                <span className="font-medium text-secondary">Limitations: </span>
                {product.limitations}
              </p>
            )}
            <dl className="grid gap-x-6 gap-y-4 border-t border-secondary pt-4 sm:grid-cols-2 lg:grid-cols-3">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="font-mono text-[11px] tracking-[0.08em] text-tertiary uppercase">{fact.label}</dt>
                  <dd className="mt-0.5 text-sm break-words text-primary">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Card>

        <Card>
          <CardHeader title="Ports" description="What the product reads and what it promises." />
          <div className="grid gap-6 p-5 md:grid-cols-[1fr_auto_1fr] md:items-start">
            <div>
              <h3 className="font-mono text-[11px] tracking-[0.08em] text-tertiary uppercase">Input ports</h3>
              <ul className="mt-2 flex flex-col gap-2">
                {product.inputPorts.length === 0 && <li className="text-sm text-tertiary">{product.outputPorts.length ? "None. Reads a raw source table." : "None yet."}</li>}
                {product.inputPorts.map((port) => {
                  const source = upstream(port.contractId);
                  return (
                    <li key={port.name} className="rounded-lg border border-secondary p-3">
                      <Mono className="text-sm font-medium text-primary">{port.name}</Mono>
                      <p className="mt-0.5 text-sm text-tertiary">
                        from{" "}
                        {source ? (
                          <Link href={`/products/${source.domain}/${source.name}`} className="font-medium text-brand-secondary underline-offset-2 outline-brand hover:underline focus-visible:outline-2">
                            {source.title}
                          </Link>
                        ) : (
                          port.contractId
                        )}{" "}
                        · <Mono>v{port.version}</Mono>
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
            <ArrowNarrowRight className="mt-9 hidden size-6 text-quaternary md:block" aria-hidden />
            <div>
              <h3 className="font-mono text-[11px] tracking-[0.08em] text-tertiary uppercase">Output ports</h3>
              <ul className="mt-2 flex flex-col gap-2">
                {product.outputPorts.length === 0 && <li className="text-sm text-tertiary">None yet.</li>}
                {product.outputPorts.map((port) => (
                  <li key={port.name} className="rounded-lg border border-brand-200 bg-brand-primary p-3">
                    <Mono className="text-sm font-medium text-brand-secondary">{port.name}</Mono>
                    <p className="mt-0.5 text-sm text-tertiary">
                      {port.description} · <Mono>v{port.version}</Mono>
                    </p>
                  </li>
                ))}
              </ul>
              {consumers.length > 0 && (
                <p className="mt-3 text-sm text-tertiary">
                  Read by{" "}
                  {consumers.map((consumer, index) => (
                    <span key={consumer.id}>
                      {index > 0 && ", "}
                      <Link href={`/products/${consumer.domain}/${consumer.name}`} className="font-medium text-brand-secondary underline-offset-2 outline-brand hover:underline focus-visible:outline-2">
                        {consumer.title}
                      </Link>
                    </span>
                  ))}
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Lifecycle" description="One path for every product. Each move is a pull request." />
        <LifecyclePanel product={product} transitions={transitions} successors={products.filter((candidate) => candidate.status === "active").map((candidate) => ({ id: candidate.id, title: candidate.title }))} />
      </Card>
    </div>
  );

  const contractTab = (
    <div className="flex flex-col gap-6">
      {contracts.length === 0 && (
        <div className="rounded-xl border border-dashed border-primary bg-dots px-6 py-14 text-center">
          <p className="font-display text-lg font-semibold text-primary">No contract yet</p>
          <p className="mt-1 text-sm text-tertiary">A proposed product has no output. Continue in the wizard to define one.</p>
        </div>
      )}
      {contracts.map((contract) => (
        <Card key={contract.id}>
          <CardHeader
            title={
              <span className="flex flex-wrap items-center gap-2">
                {contract.name} <Mono className="text-sm font-normal text-tertiary">v{contract.version}</Mono>
              </span>
            }
            description={contract.purpose}
            actions={
              editable && (
                <Button href={`${href}/contracts/${contract.port}`} size="sm" color="secondary" iconLeading={<Edit05 data-icon className="size-4" />}>
                  Edit contract
                </Button>
              )
            }
          />
          <SchemaTable contract={contract} vocabulary={vocabulary} />
        </Card>
      ))}
    </div>
  );

  const qualityTab = (
    <Card>
      <CardHeader title="Contract test results" description="One row per quality rule in the contract. Results and history are simulated by the mock backend." />
      {quality.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-tertiary">{contracts.length ? "The contract has no quality rules yet." : "Nothing is built yet."}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-secondary bg-secondary">
                <th scope="col" className={th}>Rule</th>
                <th scope="col" className={th}>Column</th>
                <th scope="col" className={th}>If it fails</th>
                <th scope="col" className={th}>Latest run</th>
                <th scope="col" className={th}>Last 14 runs</th>
              </tr>
            </thead>
            <tbody>
              {quality.map((result) => (
                <tr key={result.contractId + result.ruleId} className="border-b border-secondary last:border-b-0">
                  <th scope="row" className="px-4 py-3 text-left font-medium text-primary">{result.ruleName}</th>
                  <td className="px-4 py-3">{result.column ? <Mono className="text-secondary">{result.column}</Mono> : <span className="text-tertiary">whole table</span>}</td>
                  <td className="px-4 py-3 text-secondary">{result.severity === "error" ? "Blocks the run" : "Flags only"}</td>
                  <td className="px-4 py-3">
                    <span className={cx("flex items-center gap-1.5 font-medium", result.status === "passed" ? "text-success-primary" : result.severity === "error" ? "text-error-primary" : "text-warning-primary")}>
                      {result.status === "passed" ? <CheckCircle className="size-4" /> : <AlertTriangle className="size-4" />}
                      {result.status === "passed" ? "Passed" : "Failed"}
                      <span className="font-normal text-tertiary">· observed {result.observed}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <HistoryStrip history={result.history} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );

  const policiesTab = (
    <Card>
      <CardHeader title="Policies" description={`Global policies and those of the ${product.domain} domain that apply to a ${product.status} product.`} />
      <ul>
        {applicable.map((policy) => {
          const found = violations.filter((violation) => violation.policyId === policy.id);
          return (
            <li key={policy.id} className="flex items-start gap-3 border-b border-secondary px-5 py-4 last:border-b-0">
              {found.length === 0 ? (
                <CheckCircle className="mt-0.5 size-5 shrink-0 text-success-primary" aria-label="Passes" />
              ) : policy.level === "enforce" ? (
                <AlertCircle className="mt-0.5 size-5 shrink-0 text-error-primary" aria-label="Blocks" />
              ) : (
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning-primary" aria-label="Warns" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-primary">
                  {policy.title} <Mono className="font-normal text-tertiary">{policy.id}</Mono>
                </p>
                <p className="text-sm text-tertiary">
                  {policy.scope === "global" ? "Global" : `${policy.scope} domain`} · {policy.level === "enforce" ? "blocks" : "warns"} · {policy.rationale}
                </p>
                {found.map((violation) => (
                  <p key={violation.message} className="mt-1.5 text-sm text-secondary">
                    {violation.message}. <span className="text-tertiary">{violation.fix}</span>
                  </p>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );

  const specTab = (
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <DocumentPanel title="dataproduct.odps.yaml" standard="ODPS v1.0.0" yamlText={toYaml(odps)} issues={validateAgainstStandard("odps", odps)} />
      <div className="flex flex-col gap-6">
        {contracts.map((contract) => {
          const odcs = toOdcs(contract, product);
          return <DocumentPanel key={contract.id} title={`contracts/${contract.port}.odcs.yaml`} standard="ODCS v3.1.0" yamlText={toYaml(odcs)} issues={validateAgainstStandard("odcs", odcs)} />;
        })}
        {product.transformation.code && (
          <div className="overflow-hidden rounded-xl border border-secondary bg-primary">
            <p className="border-b border-secondary bg-secondary px-4 py-2.5 font-mono text-xs font-medium text-secondary">
              {product.transformation.language === "sql" ? `dbt/models/${contracts[0]?.table ?? product.name}.sql` : `spark/${product.name.replace(/-/g, "_")}.py`}
            </p>
            <Code value={product.transformation.code} language={product.transformation.language} maxHeight="420px" ariaLabel="Transformation code" />
          </div>
        )}
      </div>
    </div>
  );

  const activityTab = (
    <Card>
      <CardHeader title="Changes" description="Every change to the product arrives as a pull request and a pipeline run." />
      <ul>
        {runs.length === 0 && <li className="px-5 py-10 text-center text-sm text-tertiary">No changes yet.</li>}
        {runs.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-b border-secondary px-5 py-3.5 last:border-b-0">
            <span className="text-sm font-medium text-primary">{item.title}</span>
            <span className="text-sm text-tertiary">
              <Mono>{item.id}</Mono> · {item.kind === "create" ? "New product" : item.kind === "lifecycle" ? "Lifecycle move" : "Contract change"} · {formatDate(item.startedAt)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );

  return (
    <>
      <PageHeader
        eyebrow={<Breadcrumbs items={[{ label: "Products", href: "/products" }, { label: product.title }]} />}
        title={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {product.title}
            <LifecycleBadge status={product.status} size="md" />
          </span>
        }
        description={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <Mono>{product.id}</Mono>
            <span aria-hidden>·</span>
            <Mono>v{product.version}</Mono>
            <span aria-hidden>·</span>
            {product.team}
          </span>
        }
        actions={
          product.status === "proposed" ? (
            <Button href={`/products/new?from=${encodeURIComponent(product.id)}`} size="md">
              Continue in the wizard
            </Button>
          ) : (
            editable && (
              <Button href={`${href}/contracts/${contracts[0].port}`} size="md" iconLeading={<Edit05 data-icon className="size-5" />}>
                Edit contract
              </Button>
            )
          )
        }
      />
      {run && (
        <div className="px-5 pt-6 sm:px-8">
          <PipelineProgress key={run.id} run={run} />
        </div>
      )}
      <ProductTabs
        panels={[
          { id: "overview", label: "Overview", content: overview },
          { id: "contract", label: "Contract", content: contractTab },
          { id: "lineage", label: "Lineage", content: <LineageMap products={products} contracts={allContracts} focusId={product.id} className="h-[30rem]" /> },
          { id: "quality", label: "Quality", badge: quality.filter((result) => result.status === "failed").length, content: qualityTab },
          { id: "policies", label: "Policies", badge: violations.length, content: policiesTab },
          { id: "spec", label: "Files", content: specTab },
          { id: "activity", label: "Changes", content: activityTab },
        ]}
      />
    </>
  );
}

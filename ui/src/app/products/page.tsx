import { Plus } from "@untitledui/icons";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/bits";
import { ProductBrowser } from "@/components/app/product-browser";
import { Button } from "@/components/base/buttons/button";
import { backend } from "@/lib/backend";
import { summarize } from "@/lib/summary";

export const metadata: Metadata = { title: "Products" };
export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const [products, contracts, vocabulary] = await Promise.all([backend.listProducts(), backend.listContracts(), backend.getVocabulary()]);
  const summaries = Object.fromEntries(await Promise.all(products.map(async (product) => [product.id, await summarize(product, contracts)] as const)));
  const findings = Object.values(summaries).reduce((sum, summary) => sum + summary.policyBlocking + summary.policyWarnings, 0);
  const stats = [
    { label: "Products", value: products.length },
    { label: "Active", value: products.filter((product) => product.status === "active").length },
    { label: "Contracts", value: contracts.length },
    { label: "Policy findings", value: findings },
  ];

  return (
    <>
      <PageHeader
        title="Data products"
        description="Each product is a self-contained unit: a spec, one contract per output, and the code that builds it."
        actions={
          <Button href="/products/new" size="md" iconLeading={<Plus data-icon className="size-5" />}>
            New data product
          </Button>
        }
      >
        <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="font-mono text-[11px] tracking-[0.08em] text-tertiary uppercase">{stat.label}</dt>
              <dd className="font-display text-display-xs font-semibold text-primary tabular-nums">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </PageHeader>
      <ProductBrowser products={products} summaries={summaries} domains={vocabulary.domains} />
    </>
  );
}

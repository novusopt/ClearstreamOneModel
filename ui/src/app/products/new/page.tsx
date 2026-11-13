import type { Metadata } from "next";
import { Wizard } from "@/components/app/wizard";
import { backend } from "@/lib/backend";

export const metadata: Metadata = { title: "New data product" };
export const dynamic = "force-dynamic";

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams;
  const [templates, vocabulary, products, contracts] = await Promise.all([backend.listTemplates(), backend.getVocabulary(), backend.listProducts(), backend.listContracts()]);
  const proposal = products.find((product) => product.id === from && product.status === "proposed");
  return <Wizard key={proposal?.id ?? "new"} templates={templates} vocabulary={vocabulary} products={products} contracts={contracts} proposal={proposal} />;
}

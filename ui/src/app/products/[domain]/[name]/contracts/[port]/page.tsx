import { notFound } from "next/navigation";
import { ContractEditor } from "@/components/app/contract-editor";
import { backend } from "@/lib/backend";

export const dynamic = "force-dynamic";

type Params = Promise<{ domain: string; name: string; port: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { port } = await params;
  return { title: `Contract: ${port}` };
}

export default async function ContractPage({ params }: { params: Params }) {
  const { domain, name, port } = await params;
  const product = await backend.getProduct(domain, name);
  const contract = product && (await backend.getContract(`${product.id}.${port}`));
  if (!product || !contract || product.status === "retired") notFound();

  const [vocabulary, consumers] = await Promise.all([backend.getVocabulary(), backend.consumersOf(product.id)]);
  const readers = consumers
    .filter((consumer) => consumer.inputPorts.some((input) => input.contractId === contract.id))
    .map((consumer) => ({ id: consumer.id, title: consumer.title, status: consumer.status }));

  // Keyed by version so the editor starts from the saved contract after each save.
  return <ContractEditor key={contract.version} product={product} published={contract} vocabulary={vocabulary} consumers={readers} />;
}

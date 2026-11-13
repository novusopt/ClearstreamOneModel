import type { Metadata } from "next";
import { PageHeader } from "@/components/app/bits";
import { LineageMap } from "@/components/app/lineage-map";
import { backend } from "@/lib/backend";

export const metadata: Metadata = { title: "Product map" };
export const dynamic = "force-dynamic";

export default async function MapPage() {
  const [products, contracts] = await Promise.all([backend.listProducts(), backend.listContracts()]);
  return (
    <div className="flex h-dvh flex-col">
      <PageHeader title="Product map" description="How products feed each other. An edge runs from an output port to the input port that reads it. Select a product to open it." />
      <div className="min-h-0 flex-1 p-5 sm:p-8">
        <LineageMap products={products} contracts={contracts} className="h-full min-h-96" />
      </div>
    </div>
  );
}

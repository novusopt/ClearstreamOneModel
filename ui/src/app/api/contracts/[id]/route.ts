import { respond } from "@/app/api/respond";
import { backend } from "@/lib/backend";
import type { DataContract } from "@/lib/types";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as { contract: DataContract; message: string };
  return respond(() => backend.saveContract(decodeURIComponent(id), body.contract, body.message));
}

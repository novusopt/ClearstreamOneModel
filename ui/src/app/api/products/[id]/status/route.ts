import { respond } from "@/app/api/respond";
import { backend } from "@/lib/backend";
import type { LifecycleStatus } from "@/lib/types";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as { target: LifecycleStatus; sunsetDate?: string; successor?: string };
  return respond(() => backend.changeStatus(decodeURIComponent(id), body.target, body));
}

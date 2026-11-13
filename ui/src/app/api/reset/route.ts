import { respond } from "@/app/api/respond";
import { backend } from "@/lib/backend";

export async function POST() {
  return respond(async () => {
    await backend.reset();
    return { ok: true };
  });
}

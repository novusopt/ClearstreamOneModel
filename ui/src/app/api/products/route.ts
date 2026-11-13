import { respond } from "@/app/api/respond";
import { backend } from "@/lib/backend";
import type { NewProductInput } from "@/lib/types";

export async function POST(request: Request) {
  const input = (await request.json()) as NewProductInput;
  return respond(() => backend.createProduct(input));
}

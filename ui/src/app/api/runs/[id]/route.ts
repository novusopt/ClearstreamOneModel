import { NextResponse } from "next/server";
import { backend } from "@/lib/backend";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = await backend.getRun(id);
  return run ? NextResponse.json(run) : NextResponse.json({ error: "No such run" }, { status: 404 });
}

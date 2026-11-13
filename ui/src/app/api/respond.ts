import { NextResponse } from "next/server";
import { BackendError } from "@/lib/backend";

/** Runs a backend call and turns its outcome into a JSON response. */
export async function respond<T>(work: () => Promise<T>) {
  try {
    return NextResponse.json(await work());
  } catch (error) {
    if (error instanceof BackendError) return NextResponse.json({ error: error.message }, { status: 422 });
    throw error;
  }
}

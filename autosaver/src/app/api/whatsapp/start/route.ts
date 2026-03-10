import { NextResponse } from "next/server";
import { ensureClient } from "@/lib/whatsappClient";

export const runtime = "nodejs";

export async function POST() {
  ensureClient();
  return NextResponse.json({ ok: true });
}


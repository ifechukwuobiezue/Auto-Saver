import { NextResponse } from "next/server";
import { getStatus } from "@/lib/whatsappClient";

export const runtime = "nodejs";

export async function GET() {
  const status = getStatus();
  return NextResponse.json(status);
}


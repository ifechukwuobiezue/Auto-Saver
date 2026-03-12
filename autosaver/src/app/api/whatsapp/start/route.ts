import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ensureClient } from "@/lib/whatsappClient";
import { authOptions } from "../../auth/[...nextauth]/route";

export const runtime = "nodejs";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return NextResponse.json(
      { error: "Not authenticated or missing Google access token" },
      { status: 401 }
    );
  }

  // Pass the user's Google access token down to the WhatsApp client
  ensureClient(String(session.accessToken));

  return NextResponse.json({ ok: true });
}


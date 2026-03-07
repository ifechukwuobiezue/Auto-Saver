"use client";

import { useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import QRCode from "react-qr-code";

export default function Home() {
  const { data: session, status } = useSession();
  const [qr, setQr] = useState<string | null>(null);
  const [waState, setWaState] = useState<string>("idle");

  useEffect(() => {
    if (status !== "authenticated") return;

    let interval: NodeJS.Timeout | undefined;

    async function start() {
      await fetch("/api/whatsapp/start", { method: "POST" });
      interval = setInterval(async () => {
        const res = await fetch("/api/whatsapp/status");
        const data = (await res.json()) as { qr?: string | null; state?: string };
        setQr(data.qr ?? null);
        setWaState(data.state ?? "idle");
      }, 3000);
    }

    start().catch(() => {
      // ignore
    });

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-3xl font-semibold">Autosaver</h1>
        <p>Sign in with Google to connect WhatsApp.</p>
        <button
          className="rounded bg-black px-4 py-2 text-white"
          onClick={() => signIn("google")}
        >
          Sign in with Google
        </button>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-start gap-8 p-8">
      <header className="flex w-full max-w-xl items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Autosaver</h1>
          <p className="text-sm text-zinc-600">
            Signed in as {session.user?.email}
          </p>
        </div>
        <button
          className="rounded border px-3 py-1 text-sm"
          onClick={() => signOut()}
        >
          Sign out
        </button>
      </header>

      <section className="w-full max-w-xl rounded-lg border p-6">
        <h2 className="mb-2 text-lg font-medium">WhatsApp connection</h2>
        <p className="mb-4 text-sm text-zinc-700">Status: {waState}</p>
        {qr ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm">
              Open WhatsApp on your phone → Linked devices → Link a device, then
              scan this QR:
            </p>
            <QRCode value={qr} size={220} />
          </div>
        ) : (
          <p className="text-sm text-zinc-600">
            Waiting for QR / already connected…
          </p>
        )}
      </section>
    </main>
  );
}


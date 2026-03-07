import { useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import QRCode from "qrcode.react";

export default function Home() {
  const { data: session, status } = useSession();
  const [qr, setQr] = useState(null);
  const [waState, setWaState] = useState("idle");

  useEffect(() => {
    if (status !== "authenticated") return;

    let interval;

    async function start() {
      await fetch("/api/whatsapp/start", { method: "POST" });
      interval = setInterval(async () => {
        const res = await fetch("/api/whatsapp/status");
        const data = await res.json();
        setQr(data.qr || null);
        setWaState(data.state || "idle");
      }, 3000);
    }

    start();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (!session) {
    return (
      <main style={{ padding: 32 }}>
        <h1>Autosaver</h1>
        <p>Sign in with Google to link your contacts.</p>
        <button onClick={() => signIn("google")}>Sign in with Google</button>
      </main>
    );
  }

  return (
    <main style={{ padding: 32 }}>
      <h1>Autosaver</h1>
      <p>Signed in as {session.user?.email}</p>
      <button onClick={() => signOut()}>Sign out</button>

      <section style={{ marginTop: 32 }}>
        <h2>WhatsApp connection</h2>
        <p>Status: {waState}</p>
        {qr ? (
          <div style={{ marginTop: 16 }}>
            <p>Scan this QR with WhatsApp on your phone:</p>
            <QRCode value={qr} size={256} />
          </div>
        ) : (
          <p>Waiting for QR / connection...</p>
        )}
      </section>
    </main>
  );
}


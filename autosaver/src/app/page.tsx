// "use client";

// import { useEffect, useState } from "react";
// import { useSession, signIn, signOut } from "next-auth/react";
// import QRCode from "react-qr-code";
// import { FcGoogle } from "react-icons/fc";

// export default function Home() {
//   const { data: session, status } = useSession();
//   const [qr, setQr] = useState<string | null>(null);
//   const [waState, setWaState] = useState<string>("idle");

//   useEffect(() => {
//     if (status !== "authenticated") return;

//     let interval: NodeJS.Timeout | undefined;

//     async function start() {
//       await fetch("/api/whatsapp/start", { method: "POST" });

//       interval = setInterval(async () => {
//         const res = await fetch("/api/whatsapp/status");
//         const data = await res.json();

//         setQr(data.qr ?? null);
//         setWaState(data.state ?? "idle");
//       }, 3000);
//     }

//     start().catch(() => {});

//     return () => {
//       if (interval) clearInterval(interval);
//     };
//   }, [status]);

//   // If user is not signed in
//   if (!session) {
//     return (
//       <main className="flex min-h-screen flex-col items-center justify-center gap-4">
//         <h1 className="text-3xl font-semibold">Contact Autosaver</h1>

//         <p>Sign in to connect WhatsApp.</p>

//         <button
//           onClick={() => signIn("google")}
//           className="flex items-center gap-3 cursor-pointer rounded bg-black px-6 py-2 text-white transition hover:bg-zinc-800"
//         >
//           <FcGoogle size={20} />
//           Sign in with Google
//         </button>
//       </main>
//     );
//   }

//   return (
//     <main className="flex min-h-screen flex-col items-center justify-start gap-8 p-8">
//       <header className="flex w-full max-w-xl items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-semibold">Contact Autosaver</h1>

//           <p className="text-sm text-zinc-600">
//             Signed in as {session.user?.email}
//           </p>
//         </div>

//         <button
//           onClick={() => signOut()}
//           className="rounded border px-3 py-1 text-sm"
//         >
//           Sign out
//         </button>
//       </header>

//       <section className="w-full max-w-xl rounded-lg border p-6">
//         <h2 className="mb-2 text-lg font-medium">WhatsApp connection</h2>

//         <p className="mb-4 text-sm text-zinc-700">Status: {waState}</p>

//         {qr ? (
//           <div className="flex flex-col items-center gap-4">
//             <p className="text-sm">
//               Open WhatsApp → Linked devices → Link a device and scan the QR
//               code.
//             </p>

//             <QRCode value={qr} size={220} />
//           </div>
//         ) : (
//           <p className="text-sm text-zinc-600">
//             Waiting for QR / already connected…
//           </p>
//         )}
//       </section>
//     </main>
//   );
// }
"use client";

import { useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import WhatsAppQRCard from "../components/WhatsappQrCard";
import GoogleLoginCard from "../components/GoogleLoginCard";

export default function Home() {
  const { data: session, status } = useSession();

  const [qr, setQr] = useState<string | null>(null);
  const [waState, setWaState] = useState<string>("idle");

  useEffect(() => {
    if (status !== "authenticated") return;

    let interval: NodeJS.Timeout | undefined;

    async function startWhatsApp() {
      await fetch("/api/whatsapp/start", { method: "POST" });

      interval = setInterval(async () => {
        const res = await fetch("/api/whatsapp/status");
        const data = await res.json();

        setQr(data.qr ?? null);
        setWaState(data.state ?? "idle");
      }, 3000);
    }

    startWhatsApp().catch(() => {});

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  const handleSignIn = () => signIn("google");

  const handleSignOut = () => signOut();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#171E21] p-4 md:p-8">
      {!session ? (
        <GoogleLoginCard onSignIn={handleSignIn} />
      ) : (
        <WhatsAppQRCard
          qr={qr}
          waState={waState}
          userEmail={session.user?.email ?? null}
          onSignOut={handleSignOut}
        />
      )}
    </main>
  );
}
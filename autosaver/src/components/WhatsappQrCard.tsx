"use client";

import QRCode from "react-qr-code";

interface Props {
  qr: string | null;
  waState: string;
  userEmail: string | null;
  onSignOut: () => void;
}

export default function WhatsAppQRCard({
  qr,
  waState,
  userEmail,
  onSignOut,
}: Props) {
  const connected = waState === "connected";

  return (
    <div className="bg-[#212C30] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] p-6 md:p-12 w-full max-w-[960px] min-h-[480px] flex flex-col">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-white">
            Contact Autosaver
          </h1>

          {userEmail && (
            <p className="text-xs text-gray-400">
              Signed in as {userEmail}
            </p>
          )}
        </div>

        <button
          onClick={onSignOut}
          className="text-xs border border-gray-600 px-3 py-1 rounded text-gray-300 hover:text-white hover:border-gray-400"
        >
          Sign out
        </button>
      </div>

      {/* BODY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 flex-1 items-center">

        {/* LEFT INSTRUCTIONS */}
        <div>
          <h2 className="text-2xl font-medium text-white mb-8">
            Link WhatsApp
          </h2>

          <ol className="space-y-6 text-sm text-white">
            <li className="flex gap-3">
              <span className="text-green-500 font-semibold">1.</span>
              Open WhatsApp on your phone
            </li>

            <li className="flex gap-3">
              <span className="text-green-500 font-semibold">2.</span>
              Tap <b>Linked Devices</b>
            </li>

            <li className="flex gap-3">
              <span className="text-green-500 font-semibold">3.</span>
              Tap <b>Link a device</b> and scan the QR
            </li>
          </ol>

          <a
            href="https://www.linkedin.com/in/ifechukwuobiezue/"
            className="text-green-400 text-sm mt-8 inline-block hover:underline"
          >
            Need help?
          </a>
        </div>

        {/* RIGHT QR */}
        <div className="flex flex-col items-center justify-center">

          {connected && (
            <div className="text-green-400 text-sm mb-4">
              WhatsApp Connected ✓
            </div>
          )}

          {qr ? (
            <div className="bg-white p-3 rounded-lg">
              <QRCode value={qr} size={240} />
            </div>
          ) : (
            <div className="text-gray-400 text-sm">
              Waiting for QR code...
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
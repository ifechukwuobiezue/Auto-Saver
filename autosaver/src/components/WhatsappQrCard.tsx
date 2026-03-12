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
  // Treat any non-error, non-disconnected, non-QR state as "connected"
  const connected =
    waState !== "idle" &&
    waState !== "qr" &&
    waState !== "disconnected" &&
    waState !== "error";

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
        <div className="flex flex-col">
          <h2 className="text-2xl font-medium text-white mb-8">
            Link WhatsApp
          </h2>

          <div className="flex flex-col relative">

            {/* STEP 1 */}
            <div className="flex items-start gap-4 pb-6 relative">
              <div className="flex flex-col items-center z-10">
                <div className="w-7 h-7 rounded-full border-2 border-green-500 flex items-center justify-center text-xs font-medium text-green-500 bg-[#212C30]">
                  1
                </div>
              </div>

              <p className="text-sm text-white pt-1">
                Open WhatsApp on your phone
              </p>

              <div className="absolute left-[13px] top-[28px] w-[2px] h-[calc(100%-16px)] bg-gray-600" />
            </div>

            {/* STEP 2 */}
            <div className="flex items-start gap-4 pb-6 relative">
              <div className="flex flex-col items-center z-10">
                <div className="w-7 h-7 rounded-full border-2 border-green-500 flex items-center justify-center text-xs font-medium text-green-500 bg-[#212C30]">
                  2
                </div>
              </div>

              <p className="text-sm text-white pt-1">
                Tap <span className="font-semibold">Linked Devices</span>
              </p>

              <div className="absolute left-[13px] top-[28px] w-[2px] h-[calc(100%-16px)] bg-gray-600" />
            </div>

            {/* STEP 3 */}
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center z-10">
                <div className="w-7 h-7 rounded-full border-2 border-green-500 flex items-center justify-center text-xs font-medium text-green-500 bg-[#212C30]">
                  3
                </div>
              </div>

              <p className="text-sm text-white pt-1">
                Tap <span className="font-semibold">Link a device</span> and scan the QR code
              </p>
            </div>

          </div>

          <a
            href="https://www.linkedin.com/in/ifechukwuobiezue/"
            className="text-green-400 text-sm mt-8 inline-flex items-center gap-1 hover:underline"
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

          {connected ? (
            <div className="text-green-400 text-sm">
              Connected. Keep this tab open.
            </div>
          ) : qr ? (
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
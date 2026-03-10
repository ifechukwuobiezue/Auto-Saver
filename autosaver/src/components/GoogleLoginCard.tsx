"use client";

import { FcGoogle } from "react-icons/fc";

interface GoogleLoginCardProps {
  onSignIn: () => void;
}

const GoogleLoginCard = ({ onSignIn }: GoogleLoginCardProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      {/* Card */}
      <div className="bg-[#212C30] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] p-8 md:p-12 w-full max-w-[820px]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          
          {/* Left Side */}
          <div>
            <h1 className="text-2xl md:text-3xl font-medium text-white mb-4">
              Contact Autosaver
            </h1>

            <p className="text-sm text-gray-400 mb-8">
              Sign in with Google to start auto-saving your WhatsApp contacts.
            </p>

            <div className="flex flex-col relative">

              {/* Step 1 */}
              <div className="flex items-start gap-4 pb-6 relative">
                <div className="flex flex-col items-center z-10">
                  <div className="w-7 h-7 rounded-full border-2 border-green-500 flex items-center justify-center text-xs font-medium text-green-500 bg-[#212C30]">
                    1
                  </div>
                </div>

                <p className="text-sm text-white pt-1">
                  Sign in with your <span className="font-semibold">Google</span> account
                </p>

                <div className="absolute left-[13px] top-[28px] w-[2px] h-[calc(100%-16px)] bg-gray-600" />
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-4 pb-6 relative">
                <div className="flex flex-col items-center z-10">
                  <div className="w-7 h-7 rounded-full border-2 border-green-500 flex items-center justify-center text-xs font-medium text-green-500 bg-[#212C30]">
                    2
                  </div>
                </div>

                <p className="text-sm text-white pt-1">
                  Link your WhatsApp by scanning the QR code
                </p>

                <div className="absolute left-[13px] top-[28px] w-[2px] h-[calc(100%-16px)] bg-gray-600" />
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center z-10">
                  <div className="w-7 h-7 rounded-full border-2 border-green-500 flex items-center justify-center text-xs font-medium text-green-500 bg-[#212C30]">
                    3
                  </div>
                </div>

                <p className="text-sm text-white pt-1">
                  Contacts are saved automatically
                </p>
              </div>

            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center justify-center h-full">
            <div className="w-full max-w-[280px] flex flex-col items-center justify-center">
              
              <button
                onClick={onSignIn}
                className="w-full flex items-center justify-center gap-3 rounded-lg bg-white text-black px-6 py-3 text-sm font-medium transition hover:opacity-90"
              >
                <FcGoogle size={20} />
                Sign in with Google
              </button>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default GoogleLoginCard;
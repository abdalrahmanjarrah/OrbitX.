import { useState, useCallback } from "react";
import { UserPlus, Check, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { buildInviteLink } from "../lib/share";
import { useLanguage } from "../context/LanguageContext";
import type { UserData } from "../shared";

interface ReferralCardProps {
  user: UserData;
}

export function ReferralCard({ user }: ReferralCardProps) {
  const { isAr } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildInviteLink(user.uid));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [user.uid]);

  return (
    <div className="fixed top-20 right-5 z-[55] hidden lg:block">
      <motion.button
        onClick={handleCopy}
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.96 }}
        className="relative group"
      >
        {/* Outer glow pulse */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-fuchsia-500/30 via-purple-400/20 to-fuchsia-500/30 rounded-2xl blur-[6px] opacity-50 group-hover:opacity-90 transition-opacity animate-[pulse_3s_ease-in-out_infinite]" />

        {/* Button body */}
        <div className="relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#0c0f20]/90 backdrop-blur-xl border border-fuchsia-500/25 shadow-[0_0_20px_rgba(192,132,252,0.1)] group-hover:shadow-[0_0_30px_rgba(192,132,252,0.2)] transition-all">
          {/* Icon */}
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500/15 to-purple-500/10 border border-fuchsia-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <UserPlus size={14} className="text-fuchsia-400" />
            {/* Sparkle */}
            <Sparkles size={8} className="absolute -top-1 -right-1 text-amber-400 animate-pulse" />
          </div>

          {/* Text */}
          <div className="flex flex-col items-start leading-none">
            <span className="text-[9px] font-bold text-fuchsia-400/60 uppercase tracking-wider">
              {isAr ? "ادعُ صديق" : "INVITE"}
            </span>
            <span className="text-[11px] font-black text-white mt-0.5">
              {copied
                ? (isAr ? "تم النسخ ✓" : "COPIED ✓")
                : (isAr ? "+100 XP" : "+100 XP")
              }
            </span>
          </div>
        </div>
      </motion.button>
    </div>
  );
}

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
    <div className="fixed top-20 right-0 z-[55] hidden lg:block">
      <motion.button
        onClick={handleCopy}
        whileHover={{ x: -6 }}
        whileTap={{ scale: 0.95 }}
        className="relative group"
      >
        {/* Glow */}
        <div className="absolute inset-0 rounded-l-xl blur-md bg-fuchsia-500/25 opacity-50 group-hover:opacity-90 transition-opacity" />

        {/* Tab body — right edge flat, left side rounded */}
        <div className="relative flex items-center gap-2 pl-4 pr-1 py-3 rounded-l-xl border border-r-0 border-fuchsia-500/25 bg-[#0c0f20]/95 backdrop-blur-xl shadow-[0_0_15px_rgba(192,132,252,0.1)] group-hover:shadow-[0_0_25px_rgba(192,132,252,0.2)] transition-all">
          <div className="w-7 h-7 rounded-lg bg-fuchsia-500/15 border border-fuchsia-500/20 flex items-center justify-center shrink-0">
            <UserPlus size={12} className="text-fuchsia-400" />
          </div>
          <div className="flex flex-col items-start leading-none">
            <span className="text-[8px] font-bold text-fuchsia-400/60 uppercase tracking-wider">{isAr ? "ادعُ صديق" : "INVITE"}</span>
            <span className="text-[10px] font-black text-white mt-0.5">
              {copied ? (isAr ? "تم ✓" : "DONE ✓") : "+100 XP"}
            </span>
          </div>
          <Sparkles size={8} className="text-amber-400 animate-pulse ml-1" />
        </div>
      </motion.button>
    </div>
  );
}

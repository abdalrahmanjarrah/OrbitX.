import { useState, useCallback } from "react";
import { UserPlus, Check } from "lucide-react";
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
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40 hidden lg:block">
      <motion.button
        onClick={handleCopy}
        whileHover={{ scale: 1.05, x: -4 }}
        whileTap={{ scale: 0.95 }}
        className="relative group"
      >
        {/* Glow ring */}
        <div className="absolute -inset-1 bg-gradient-to-r from-fuchsia-500/30 via-purple-500/20 to-fuchsia-500/30 rounded-2xl blur-sm opacity-60 group-hover:opacity-100 transition-opacity animate-pulse" />

        {/* Main card */}
        <div className="relative flex items-center gap-3 px-4 py-3 bg-[#0e1025]/90 backdrop-blur-xl border border-fuchsia-500/30 rounded-2xl shadow-[0_0_30px_rgba(192,132,252,0.15)] group-hover:shadow-[0_0_40px_rgba(192,132,252,0.3)] transition-all">
          <div className="w-9 h-9 rounded-xl bg-fuchsia-500/15 border border-fuchsia-500/25 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <UserPlus size={16} className="text-fuchsia-400" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-bold text-fuchsia-300/70 leading-none whitespace-nowrap">
              {isAr ? "ادعُ صديق" : "Invite Friend"}
            </span>
            <span className="text-xs font-black text-white leading-tight whitespace-nowrap">
              {copied
                ? (isAr ? "تم النسخ ✅" : "Copied! ✅")
                : (isAr ? "+100 XP مكافأة" : "+100 XP reward")
              }
            </span>
          </div>
        </div>
      </motion.button>
    </div>
  );
}

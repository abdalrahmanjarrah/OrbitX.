import { useState, useEffect, useCallback } from "react";
import { Timer, Lock, CheckCircle, Gift } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getChestState, claimChest, CHEST_CONFIG } from "../lib/timeChests";
import { useLanguage } from "../context/LanguageContext";
import type { UserData } from "../shared";

function formatTime(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface TimeChestsProps {
  user: UserData;
}

export function TimeChests({ user }: TimeChestsProps) {
  const { isAr } = useLanguage();
  const [state, setState] = useState(() => getChestState(user));
  const [claiming, setClaiming] = useState<number | null>(null);
  const [showReward, setShowReward] = useState<{ xp: number; icon: string } | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setState(getChestState(user)), 1000);
    return () => clearInterval(interval);
  }, [user]);

  const handleClaim = useCallback(async (i: number) => {
    if (claiming !== null) return;
    setClaiming(i);
    const granted = await claimChest(i, user);
    setClaiming(null);
    if (granted > 0) {
      setShowReward({ xp: CHEST_CONFIG[i].xp, icon: CHEST_CONFIG[i].icon });
      setState(getChestState(user));
      setTimeout(() => setShowReward(null), 2500);
    }
  }, [user, claiming]);

  const nextLockedIdx = state.statuses.findIndex((s) => s === "locked");
  const readyIdx = state.statuses.findIndex((s) => s === "ready");
  const readyCount = state.statuses.filter((s) => s === "ready").length;
  const claimedCount = state.statuses.filter((s) => s === "claimed").length;

  return (
    <div className="fixed bottom-8 right-0 z-[55]">
      {/* Reward popup */}
      <AnimatePresence>
        {showReward && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: -40, scale: 1 }}
            exit={{ opacity: 0, y: -60, scale: 0.8 }}
            className="absolute bottom-full right-4 mb-2 pointer-events-none z-50"
          >
            <div className="bg-gradient-to-b from-amber-500/20 to-amber-600/10 border border-amber-500/40 rounded-2xl px-5 py-3 backdrop-blur-xl shadow-[0_0_40px_rgba(245,158,11,0.4)]">
              <div className="text-2xl mb-1 text-center">{showReward.icon}</div>
              <div className="text-sm font-black text-amber-300 text-center">+{showReward.xp} XP</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="absolute bottom-full right-0 mb-2 mr-0"
          >
            <div className="bg-[#0c0f20]/95 backdrop-blur-2xl border border-white/10 border-r-0 rounded-l-2xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.9)] w-[220px]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Timer size={12} className="text-amber-400" />
                  <span className="text-[11px] font-black text-white">{isAr ? "صناديق الوقت" : "TIME CHESTS"}</span>
                </div>
                <button onClick={() => setExpanded(false)} className="text-gray-500 hover:text-white text-[10px] transition-colors">✕</button>
              </div>
              <div className="flex gap-1.5 mb-3">
                {CHEST_CONFIG.map((chest, i) => {
                  const status = state.statuses[i];
                  return (
                    <button
                      key={i}
                      disabled={status !== "ready" || claiming !== null}
                      onClick={() => handleClaim(i)}
                      className={`flex-1 h-10 rounded-xl text-base transition-all flex items-center justify-center ${
                        status === "claimed" ? "bg-emerald-500/10 border border-emerald-500/20"
                          : status === "ready" ? "bg-amber-500/10 border border-amber-500/30 hover:scale-105 cursor-pointer"
                          : "bg-white/[0.03] border border-white/5 opacity-30"
                      }`}
                    >
                      {status === "claimed" ? <CheckCircle size={14} className="text-emerald-400" />
                        : status === "ready" ? <Gift size={14} className="text-amber-400 animate-pulse" />
                        : <Lock size={10} className="text-gray-600" />}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-center gap-1 mb-2">
                {CHEST_CONFIG.map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${
                    state.statuses[i] === "claimed" ? "bg-emerald-400"
                      : state.statuses[i] === "ready" ? "bg-amber-400" : "bg-white/10"
                  }`} />
                ))}
              </div>
              {state.allClaimed ? (
                <div className="text-center text-[10px] font-bold text-emerald-400/80">{isAr ? "✓ تتجدد بعد 24 ساعة" : "✓ Resets in 24h"}</div>
              ) : (
                <div className="text-center text-[10px] font-bold text-gray-500">
                  {nextLockedIdx >= 0 ? <>{isAr ? "الجاي بعد" : "Next"} <span className="text-amber-400 font-mono">{formatTime(state.timeUntilNext)}</span></>
                    : <span className="text-amber-400">{isAr ? "صندوق جاهز!" : "Ready!"}</span>}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab stuck to right edge */}
      <motion.button
        whileHover={{ x: -6 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setExpanded(!expanded)}
        className="relative group"
      >
        {/* Glow */}
        <div className={`absolute inset-0 rounded-l-xl blur-md transition-opacity ${
          readyCount > 0
            ? "bg-amber-500/30 opacity-60 group-hover:opacity-100"
            : "bg-white/5 opacity-20"
        }`} />

        {/* Tab body — right edge flat, left side rounded */}
        <div className={`relative flex items-center gap-2 pl-4 pr-1 py-3 rounded-l-xl border border-r-0 transition-all ${
          readyCount > 0
            ? "bg-[#0c0f20]/95 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.12)]"
            : "bg-[#0c0f20]/90 border-white/8"
        }`}>
          <div className="text-lg">{readyCount > 0 ? "📦" : "📭"}</div>
          <div className="flex flex-col items-start leading-none">
            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wider">{isAr ? "صندوق" : "CHEST"}</span>
            {readyCount > 0 ? (
              <span className="text-[10px] font-black text-amber-400">{isAr ? "جاهز ✓" : "READY ✓"}</span>
            ) : claimedCount > 0 ? (
              <span className="text-[10px] font-bold text-emerald-400/60">{claimedCount}/5</span>
            ) : (
              <span className="text-[10px] font-black text-amber-400/70 font-mono">{formatTime(state.timeUntilNext)}</span>
            )}
          </div>
          {readyCount > 0 && (
            <div className="absolute -top-1.5 left-2 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-[0_0_8px_rgba(245,158,11,0.5)]">{readyCount}</div>
          )}
        </div>
      </motion.button>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { Timer, Lock, CheckCircle, Gift } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getChestState, claimChest, CHEST_CONFIG, type ChestStatus } from "../lib/timeChests";
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
    const interval = setInterval(() => {
      setState(getChestState(user));
    }, 1000);
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
  const mainIdx = readyIdx >= 0 ? readyIdx : (nextLockedIdx >= 0 ? nextLockedIdx : 0);
  const mainStatus = state.statuses[mainIdx];
  const mainChest = CHEST_CONFIG[mainIdx];

  const readyCount = state.statuses.filter((s) => s === "ready").length;
  const claimedCount = state.statuses.filter((s) => s === "claimed").length;

  return (
    <div className="fixed bottom-5 right-5 z-[55]">
      {/* Reward popup */}
      <AnimatePresence>
        {showReward && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: -50, scale: 1 }}
            exit={{ opacity: 0, y: -70, scale: 0.8 }}
            className="absolute bottom-full right-0 mb-3 pointer-events-none z-50"
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
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="absolute bottom-full right-0 mb-3 w-[260px]"
          >
            <div className="relative bg-[#0c0f20]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_1px_rgba(255,255,255,0.1)]">
              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-bl-[40px] pointer-events-none" />

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/15 flex items-center justify-center">
                    <Timer size={12} className="text-amber-400" />
                  </div>
                  <span className="text-[11px] font-black text-white tracking-wide">
                    {isAr ? "صناديق الوقت" : "TIME CHESTS"}
                  </span>
                </div>
                <button
                  onClick={() => setExpanded(false)}
                  className="w-5 h-5 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-500 hover:text-white text-[10px] transition-all"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center gap-1.5 mb-3">
                {CHEST_CONFIG.map((chest, i) => {
                  const status = state.statuses[i];
                  return (
                    <button
                      key={i}
                      disabled={status !== "ready" || claiming !== null}
                      onClick={() => handleClaim(i)}
                      className={`
                        flex-1 relative flex items-center justify-center h-10 rounded-xl text-base transition-all
                        ${status === "claimed"
                          ? "bg-emerald-500/10 border border-emerald-500/20"
                          : status === "ready"
                            ? "bg-amber-500/10 border border-amber-500/30 hover:scale-105 hover:shadow-[0_0_15px_rgba(245,158,11,0.25)] cursor-pointer"
                            : "bg-white/[0.03] border border-white/5 opacity-30"
                        }
                      `}
                    >
                      {status === "claimed" ? (
                        <CheckCircle size={14} className="text-emerald-400" />
                      ) : status === "ready" ? (
                        <Gift size={14} className="text-amber-400 animate-pulse" />
                      ) : (
                        <Lock size={10} className="text-gray-600" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Progress dots */}
              <div className="flex items-center justify-center gap-1 mb-2">
                {CHEST_CONFIG.map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      state.statuses[i] === "claimed"
                        ? "bg-emerald-400"
                        : state.statuses[i] === "ready"
                          ? "bg-amber-400"
                          : "bg-white/10"
                    }`}
                  />
                ))}
              </div>

              {state.allClaimed ? (
                <div className="text-center text-[10px] font-bold text-emerald-400/80">
                  {isAr ? "✓ الدورة كاملة — تتجدد بعد 24 ساعة" : "✓ Complete — resets in 24h"}
                </div>
              ) : (
                <div className="text-center text-[10px] font-bold text-gray-500">
                  {nextLockedIdx >= 0 ? (
                    <>
                      {isAr ? "الجاي بعد" : "Next in"}{" "}
                      <span className="text-amber-400 font-mono">{formatTime(state.timeUntilNext)}</span>
                    </>
                  ) : (
                    <span className="text-amber-400">{isAr ? "صندوق جاهز!" : "Chest ready!"}</span>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main floating button */}
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setExpanded(!expanded)}
        className="relative group"
      >
        {/* Outer glow */}
        <div className={`absolute -inset-0.5 rounded-2xl blur-sm transition-opacity ${
          mainStatus === "ready"
            ? "bg-gradient-to-r from-amber-500/40 via-orange-500/30 to-amber-500/40 opacity-70 group-hover:opacity-100"
            : "bg-gradient-to-r from-white/5 via-white/3 to-white/5 opacity-40"
        }`} />

        {/* Button body */}
        <div className={`relative flex items-center gap-2 px-3.5 py-2.5 rounded-xl backdrop-blur-xl border transition-all ${
          mainStatus === "ready"
            ? "bg-[#0c0f20]/90 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
            : mainStatus === "claimed"
              ? "bg-[#0c0f20]/90 border-emerald-500/20"
              : "bg-[#0c0f20]/80 border-white/8"
        }`}>
          <div className="text-lg leading-none">
            {mainStatus === "claimed" ? "✅" : mainChest.icon}
          </div>
          <div className="flex flex-col items-start leading-none">
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">
              {isAr ? "صندوق" : "CHEST"}
            </span>
            {mainStatus === "ready" ? (
              <span className="text-[11px] font-black text-amber-400">
                {isAr ? "جاهز ✓" : "READY ✓"}
              </span>
            ) : mainStatus === "claimed" ? (
              <span className="text-[11px] font-bold text-emerald-400/60">
                {claimedCount}/5
              </span>
            ) : (
              <span className="text-[11px] font-black text-amber-400/70 font-mono">
                {formatTime(state.timeUntilNext)}
              </span>
            )}
          </div>

          {/* Ready badge */}
          {readyCount > 0 && (
            <div className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-[0_0_8px_rgba(245,158,11,0.5)]">
              {readyCount}
            </div>
          )}
        </div>
      </motion.button>
    </div>
  );
}

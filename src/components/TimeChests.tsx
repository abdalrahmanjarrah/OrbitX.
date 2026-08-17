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

  // Find the next available chest to show as the main button
  const readyIdx = state.statuses.findIndex((s) => s === "ready");
  const mainIdx = readyIdx >= 0 ? readyIdx : (nextLockedIdx >= 0 ? nextLockedIdx : 0);
  const mainStatus = state.statuses[mainIdx];
  const mainChest = CHEST_CONFIG[mainIdx];

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <AnimatePresence>
        {showReward && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: -60, scale: 1 }}
            exit={{ opacity: 0, y: -80, scale: 0.8 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none z-50"
          >
            <div className="bg-amber-500/20 border border-amber-500/40 rounded-2xl px-5 py-3 backdrop-blur-xl shadow-[0_0_40px_rgba(245,158,11,0.3)]">
              <div className="text-2xl mb-1">{showReward.icon}</div>
              <div className="text-sm font-black text-amber-300">+{showReward.xp} XP</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact mode: single chest + timer */}
      {!expanded ? (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setExpanded(true)}
          className={`
            relative flex items-center gap-2.5 px-4 py-2.5 rounded-2xl backdrop-blur-xl border shadow-lg transition-all
            ${mainStatus === "ready"
              ? "bg-amber-500/15 border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.25)] animate-pulse cursor-pointer"
              : mainStatus === "claimed"
                ? "bg-emerald-500/10 border-emerald-500/25"
                : "bg-[#0e1025]/80 border-white/10"
            }
          `}
        >
          <div className="text-xl">
            {mainStatus === "claimed" ? "✅" : mainChest.icon}
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-bold text-white/70 leading-none">
              {isAr ? "صندوق الوقت" : "Time Chest"}
            </span>
            {mainStatus === "ready" ? (
              <span className="text-xs font-black text-amber-400 leading-tight">
                {isAr ? "جاهز! افتح" : "Ready! Open"}
              </span>
            ) : mainStatus === "claimed" ? (
              <span className="text-xs font-bold text-emerald-400/70 leading-tight">
                {isAr ? "تم فتحه" : "Claimed"}
              </span>
            ) : (
              <span className="text-xs font-black text-amber-400/80 leading-tight font-mono">
                {formatTime(state.timeUntilNext)}
              </span>
            )}
          </div>
        </motion.button>
      ) : (
        /* Expanded mode: all chests */
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="bg-[#0e1025]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.8)] min-w-[280px]"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Timer size={14} className="text-amber-400" />
              <span className="text-xs font-black text-white">
                {isAr ? "صناديق الوقت" : "Time Chests"}
              </span>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="text-gray-500 hover:text-white text-xs font-bold transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 mb-3">
            {CHEST_CONFIG.map((chest, i) => {
              const status = state.statuses[i];
              return (
                <button
                  key={i}
                  disabled={status !== "ready" || claiming !== null}
                  onClick={() => handleClaim(i)}
                  className={`
                    relative flex items-center justify-center w-11 h-11 rounded-xl text-lg transition-all
                    ${status === "claimed"
                      ? "bg-emerald-500/10 border border-emerald-500/30"
                      : status === "ready"
                        ? "bg-amber-500/15 border border-amber-500/40 hover:scale-110 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] cursor-pointer animate-pulse"
                        : "bg-white/5 border border-white/5 opacity-40"
                    }
                  `}
                >
                  {status === "claimed" ? (
                    <CheckCircle size={16} className="text-emerald-400" />
                  ) : status === "ready" ? (
                    <Gift size={16} className="text-amber-400" />
                  ) : (
                    <Lock size={12} className="text-gray-600" />
                  )}
                </button>
              );
            })}
          </div>

          {state.allClaimed ? (
            <div className="text-center text-[10px] font-bold text-emerald-400/80">
              {isAr ? "أكملت الدورة! تتجدد بعد 24 ساعة" : "Cycle complete! Resets in 24h"}
            </div>
          ) : nextLockedIdx >= 0 ? (
            <div className="text-center text-[10px] font-bold text-gray-500">
              {isAr ? "الصندوق الجاي يفتح بعد" : "Next chest in"}{" "}
              <span className="text-amber-400 font-black">{formatTime(state.timeUntilNext)}</span>
            </div>
          ) : (
            <div className="text-center text-[10px] font-bold text-amber-400/80">
              {isAr ? "صندوق جاهز! اضغط لفتحه" : "Chest ready! Tap to open"}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

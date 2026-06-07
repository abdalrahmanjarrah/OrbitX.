import React, { useState, useEffect } from "react";
import { Swords, RefreshCw, Trophy, Zap, Info, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { UserData, Challenge } from "../shared";
import { db } from "../firebase";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { ChallengesHero } from "../components/challenges/ChallengesHero";
import { ActiveChallengesList } from "../components/challenges/ActiveChallengesList";
import { ChallengeInvites } from "../components/challenges/ChallengeInvites";
import { ChallengeHistory } from "../components/challenges/ChallengeHistory";
import { ChallengeLeaderboard } from "../components/challenges/ChallengeLeaderboard";
import { HowChallengesWork } from "../components/challenges/HowChallengesWork";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../context/LanguageContext";
import { cn } from "../lib/utils";

interface ChallengesHubViewProps {
  user: UserData;
  onEnterStation: (stationId: string) => void;
  onSelectUser: (userId: string) => void;
}

export default function ChallengesHubView({
  user,
  onEnterStation,
  onSelectUser,
}: ChallengesHubViewProps) {
  const { isAr, t } = useLanguage();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"active" | "invites" | "history" | "leaderboard">("active");

  const fetchAllChallenges = async () => {
    setLoading(true);
    try {
      const challengesRef = collection(db, "challenges");

      // 1. Fetch challenger challenges
      const q1 = query(challengesRef, where("challengerId", "==", user.uid));
      const snap1 = await getDocs(q1);
      const list1 = snap1.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Challenge);

      // 2. Fetch challenged challenges
      const q2 = query(challengesRef, where("challengedId", "==", user.uid));
      const snap2 = await getDocs(q2);
      const list2 = snap2.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Challenge);

      // 3. Merge & deduplicate
      const mergedMap = new Map<string, Challenge>();
      list1.forEach(c => mergedMap.set(c.id, c));
      list2.forEach(c => mergedMap.set(c.id, c));

      // 4. Sort by creation date descending
      const sorted = Array.from(mergedMap.values()).sort((a, b) => b.createdAt - a.createdAt);
      setChallenges(sorted);
    } catch (err) {
      console.error("Failed loading Hub challenges data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllChallenges();
  }, [user.uid]);

  // Derive categories
  const incomingInvites = challenges.filter(c => c.status === "pending" && c.challengedId === user.uid);
  const outgoingInvites = challenges.filter(c => c.status === "pending" && c.challengerId === user.uid);
  const activeChallenges = challenges.filter(c => c.status === "active" || c.status === "accepted");
  const completedChallenges = challenges.filter(c => c.status === "completed" || c.status === "declined" || c.status === "cancelled");

  return (
    <div className={cn("space-y-8 pb-32", isAr ? "text-right" : "text-left")} dir={isAr ? "rtl" : "ltr"}>
      {/* 1. HERO / INTRO SECTION */}
      <ChallengesHero
        onStartChallengeClick={() => {
          setActiveSubTab("invites");
          // Smooth scroll to challenge friend panel
          const element = document.getElementById("challenges-interactive-hub");
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
          }
        }}
        onInviteFriendClick={() => {
          // Instruct the parent dashboard helper to switch to search/add-friend tab
          const element = document.getElementById("mobile-search-tab-trigger");
          if (element) {
            element.click();
          } else {
            // General support guidance
            alert(
              isAr
                ? "يمكنك دعوة مفقودين ورواد فضاء جدد للمجرة عبر التوجه لقسم 'البث والاستكشاف' والبحث عنهم!"
                : "You can invite new astronauts to the galaxy by heading to the Radar & Explore section and searching for them!"
            );
          }
        }}
        friendsCount={user.friendsCount || 0}
      />

      {/* Control center sub-navigation */}
      <div id="challenges-interactive-hub" className={cn("flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-white/5 pb-4", isAr ? "md:flex-row" : "md:flex-row-reverse")}>
        {/* Dynamic Nav buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSubTab("active")}
            className={`px-4 py-2 rounded-2xl font-bold text-xs transition-colors flex items-center gap-1.5 ${
              activeSubTab === "active"
                ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/30"
                : "bg-white/[0.01] border border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <Swords size={14} />
            <span>
              {isAr ? `المعارك النشطة (${activeChallenges.length})` : `Active Battles (${activeChallenges.length})`}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab("invites")}
            className={`px-4 py-2 rounded-2xl font-bold text-xs transition-colors flex items-center gap-1.5 ${
              activeSubTab === "invites"
                ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/30"
                : "bg-white/[0.01] border border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <Zap size={14} />
            <span>
              {isAr 
                ? `الدعوات والطلبات (${incomingInvites.length + outgoingInvites.length})` 
                : `Invites & Requests (${incomingInvites.length + outgoingInvites.length})`}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab("history")}
            className={`px-4 py-2 rounded-2xl font-bold text-xs transition-colors flex items-center gap-1.5 ${
              activeSubTab === "history"
                ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/30"
                : "bg-white/[0.01] border border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <Trophy size={14} />
            <span>{isAr ? "أرشيف المعارك" : "Battle Log"}</span>
          </button>

          <button
            onClick={() => setActiveSubTab("leaderboard")}
            className={`px-4 py-2 rounded-2xl font-bold text-xs transition-colors flex items-center gap-1.5 ${
              activeSubTab === "leaderboard"
                ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/30"
                : "bg-white/[0.01] border border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <Sparkles size={14} />
            <span>{isAr ? "صرح المصارعين الـ 10" : "Top 10 Gladiators"}</span>
          </button>
        </div>

        {/* Global Manual telemetry refresh button */}
        <button
          onClick={fetchAllChallenges}
          disabled={loading}
          className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-indigo-400 transition-colors bg-white/[0.02] border border-white/5 rounded-full flex items-center gap-2 self-start md:self-auto active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <RefreshCw size={13} className="hover:rotate-180 transition-transform duration-500" />
          )}
          <span>{isAr ? "مسح راداري جديد" : "New Radar Sweep"}</span>
        </button>
      </div>

      {/* Subtab Dynamic Views Container */}
      <div className="relative">
        {loading && challenges.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={36} className="text-indigo-500 animate-spin mb-4" />
            <span className="text-xs text-gray-500 font-mono">
              {isAr ? "تحديث رادار الفضاء..." : "Scanning deep space radar..."}
            </span>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSubTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeSubTab === "active" && (
                <ActiveChallengesList
                  challenges={challenges}
                  currentUser={user}
                  onEnterStation={onEnterStation}
                  onRefresh={fetchAllChallenges}
                  onStartChallengeClick={() => {
                    setActiveSubTab("invites");
                    const element = document.getElementById("challenges-interactive-hub");
                    if (element) {
                      element.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  onInviteFriendClick={() => {
                    const element = document.getElementById("mobile-search-tab-trigger");
                    if (element) {
                      element.click();
                    } else {
                      alert(
                        isAr 
                          ? "يمكنك دعوة مفقودين ورواد فضاء جدد للمجرة عبر التوجه لقسم 'البث والاستكشاف' والبحث عنهم!"
                          : "You can invite new astronauts to the galaxy by heading to the Radar & Explore section and searching for them!"
                      );
                    }
                  }}
                />
              )}

              {activeSubTab === "invites" && (
                <ChallengeInvites
                  incomingInvites={incomingInvites}
                  outgoingInvites={outgoingInvites}
                  currentUser={user}
                  onRefresh={fetchAllChallenges}
                />
              )}

              {activeSubTab === "history" && (
                <ChallengeHistory
                  challenges={challenges}
                  currentUser={user}
                />
              )}

              {activeSubTab === "leaderboard" && (
                <ChallengeLeaderboard
                  onSelectUser={onSelectUser}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* 6. SIMPLE "HOW IT WORKS" SECTION */}
      <HowChallengesWork />
    </div>
  );
}

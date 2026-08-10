import React from "react";
import { Swords, Timer, Trophy, Zap } from "lucide-react";
import { Challenge, UserData } from "../../shared";
import { db } from "../../firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from "firebase/firestore";
import { motion } from "motion/react";

interface ActiveChallengesListProps {
  challenges: Challenge[];
  currentUser: UserData;
  onRefresh: () => void;
  onStartChallengeClick: () => void;
  onInviteFriendClick: () => void;
}

const formatDuration = (mins: number) => {
  if (mins >= 1440) {
    const d = Math.floor(mins / 1440);
    const h = Math.floor((mins % 1440) / 60);
    return h > 0 ? `${d}ي ${h}س` : `${d}ي`;
  }
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}س ${m}د` : `${h}س`;
  }
  return `${mins} د`;
};

export const ActiveChallengesList: React.FC<ActiveChallengesListProps> = ({
  challenges,
  currentUser,
  onRefresh,
  onStartChallengeClick,
  onInviteFriendClick,
}) => {
  const handleFinishChallengeEarly = async (challenge: Challenge) => {
    // Prevent double-claim: only an active battle can be settled
    if (challenge.status !== "active") {
      alert("هذا السباق لم يبدأ بعد أو تم احتسابه سابقاً.");
      return;
    }

    // Determine winner based on current score
    const score1 = challenge.progressPlayer1 || 0;
    const score2 = challenge.progressPlayer2 || 0;
    let winnerId = "";
    if (score1 > score2) {
      winnerId = challenge.challengerId;
    } else if (score2 > score1) {
      winnerId = challenge.challengedId;
    } else if (score1 > 0 || score2 > 0) {
      winnerId = "draw"; // It's a draw
    } else {
      winnerId = "tie";
    }

    // Real duel: winner is whoever collected the most focus minutes
    try {
      await updateDoc(doc(db, "challenges", challenge.id), {
        status: "completed",
        winnerId,
        completedAt: Date.now()
      });

      // Award the winner — full rewards for the most focused astronaut
      if (winnerId !== "draw" && winnerId !== "tie" && winnerId !== "") {
        const { grantChallengeReward } = await import("../../lib/xpSystem");
        await grantChallengeReward(challenge.id, winnerId);

        // Push notifications
        await addDoc(collection(db, "users", winnerId, "notifications"), {
          type: "challenge_win",
          content: `🏆 مبروك! لقد فزت بتحدي التركيز ضد ${winnerId === challenge.challengerId ? challenge.challengedName : challenge.challengerName}! تم إضافة شارة "بطل المعركة" الأسبوعية، 50 عملة، و 100 XP!`,
          read: false,
          timestamp: serverTimestamp(),
        });

        const loserId = winnerId === challenge.challengerId ? challenge.challengedId : challenge.challengerId;
        await addDoc(collection(db, "users", loserId, "notifications"), {
          type: "challenge_completed",
          content: `⚔️ انتهى السباق! فاز ${winnerId === challenge.challengerId ? challenge.challengerName : challenge.challengedName} بـ ${Math.max(score1, score2)} دقيقة مقابل ${Math.min(score1, score2)} دقيقة لك. حظاً أوفر المرة القادمة!`,
          read: false,
          timestamp: serverTimestamp(),
        });
      } else {
        // Tie
        const msg = `🤝 انتهى السباق بالتعادل بين ${challenge.challengerName} و ${challenge.challengedName} بـ ${score1} دقيقة تركيز لكل منهما!`;
        await addDoc(collection(db, "users", challenge.challengerId, "notifications"), {
          type: "challenge_completed",
          content: msg,
          read: false,
          timestamp: serverTimestamp(),
        });
        await addDoc(collection(db, "users", challenge.challengedId, "notifications"), {
          type: "challenge_completed",
          content: msg,
          read: false,
          timestamp: serverTimestamp(),
        });
      }

      onRefresh();
    } catch (err) {
      console.error("Failed to finish challenge", err);
    }
  };

  const activeOnly = challenges.filter(c => c.status === "active");

  if (activeOnly.length === 0) {
    return (
      <div className="rounded-3xl border border-white/5 bg-[#0b0c16]/30 backdrop-blur-md p-12 text-center max-w-2xl mx-auto">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 shadow-[0_0_30px_rgba(99,102,241,0.05)]">
          🚀
        </div>
        <h3 className="text-xl font-black text-white mb-3">لا توجد سباقات تركيز نشطة حالياً</h3>
        <p className="text-gray-400 text-sm max-w-md mx-auto mb-8 leading-relaxed">
          ابدأ أول سباق تركيز مع أصدقائك واختبر من يجمع أكتر دقائق تركيز خلال المدة المحددة. كل جلسة تركيز عادية تحسب لك!
        </p>
        <div className="flex flex-wrap lg:flex-nowrap justify-center gap-3">
          <button
            onClick={onStartChallengeClick}
            className="px-5 py-2.5 bg-gradient-to-l from-indigo-500 to-fuchsia-600 hover:from-indigo-600 hover:to-fuchsia-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 transform active:scale-95"
          >
            <Swords size={13} />
            <span>بدء سباق تركيز</span>
          </button>
          <button
            onClick={onInviteFriendClick}
            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-200 border border-white/5 rounded-xl font-bold text-xs transition-all transform active:scale-95"
          >
            دعوة رائد فضاء جديد
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {activeOnly.map((challenge) => {
        const isChallenger = challenge.challengerId === currentUser.uid;
        const myXp = isChallenger ? (challenge.progressPlayer1 || 0) : (challenge.progressPlayer2 || 0);
        const oppXp = isChallenger ? (challenge.progressPlayer2 || 0) : (challenge.progressPlayer1 || 0);
        const myName = isChallenger ? challenge.challengerName : challenge.challengedName;
        const opponentName = isChallenger ? challenge.challengedName : challenge.challengerName;
        const myPhoto = isChallenger ? challenge.challengerPhoto : challenge.challengedPhoto;
        const oppPhoto = isChallenger ? challenge.challengedPhoto : challenge.challengerPhoto;
        const myInitial = (myName || "؟").charAt(0);
        const oppInitial = (opponentName || "؟").charAt(0);

        // Progress calc
        const totalXp = (myXp + oppXp) || 1;
        const myPercent = Math.round((myXp / totalXp) * 100);
        const oppPercent = 100 - myPercent;

        // Time calculations — timer runs from the moment the challenge was accepted
        const start = challenge.startTime || challenge.createdAt || Date.now();
        const elapsedMinutes = Math.floor((Date.now() - start) / 60000);
        const minutesLeft = Math.max(0, (challenge.durationMinutes || 60) - elapsedMinutes);
        const isExpired = minutesLeft <= 0;

        const isBehind = oppXp > myXp;
        const behindDiff = oppXp - myXp;

        const myLead = myXp > oppXp;
        const oppLead = oppXp > myXp;

        return (
          <div
            key={challenge.id}
            className="group relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-[#0e0f1e] to-[#070812] p-6 shadow-2xl transition-all duration-300 hover:border-indigo-500/30 hover:shadow-[0_12px_40px_rgba(99,102,241,0.15)] flex flex-col gap-5"
          >
            {/* Ambient slight glow */}
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-indigo-500/8 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-fuchsia-500/4 blur-2xl pointer-events-none" />

            {/* Header: Status Pills */}
            <div className="flex items-center justify-between z-10 relative">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isExpired ? "bg-amber-400" : "bg-emerald-400"}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isExpired ? "bg-amber-500" : "bg-emerald-500"}`}></span>
                </span>
                <span className={`text-[11px] font-bold ${isExpired ? "text-amber-400" : "text-emerald-400"} tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-white/[0.03] border border-white/5`}>
                  {isExpired ? "بانتظار الحساب" : "سباق نشط"}
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/5 text-gray-300 text-xs font-mono">
                <Timer size={12} className="text-indigo-400" />
                <span>{isExpired ? "مكتمل المدة" : `المتبقي: ${formatDuration(minutesLeft)}`}</span>
              </div>
            </div>

            {/* Behind warning alert */}
            {isBehind && (
              <div className="relative z-10 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs">
                <Zap size={14} className="animate-pulse shrink-0" />
                <span>خصمك يتقدم عليك بـ <strong className="font-bold font-mono">{behindDiff}</strong> دقيقة! شدّ الهمّة البطل 🚀</span>
              </div>
            )}

            {/* Combatants VS Side metrics */}
            <div className="grid grid-cols-7 gap-2 items-center text-center my-2 relative z-10">
              {/* My Side */}
              <div className="col-span-3 flex flex-col justify-center">
                <div className="flex flex-col items-center justify-center">
                  {myPhoto ? (
                    <img
                      src={myPhoto}
                      alt={myName}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover border-2 border-indigo-500/40 mb-1.5"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-black text-sm mb-1.5">
                      {myInitial}
                    </div>
                  )}
                  <div className="text-[10px] text-indigo-300 font-semibold tracking-wide uppercase truncate max-w-full">أنت (البطل)</div>
                  <div className="text-3xl font-black text-white mt-1.5 tracking-tight font-mono">{myXp} د</div>
                  {myLead && (
                    <span className="mt-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full flex items-center gap-0.5">
                      متقدم ↑
                    </span>
                  )}
                </div>
              </div>

              {/* VS Icon */}
              <div className="col-span-1 flex justify-center">
                <div className="w-10 h-10 rounded-full bg-[#131526] border border-white/10 flex items-center justify-center text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.15)] group-hover:scale-110 transition-transform">
                  <Swords size={16} />
                </div>
              </div>

              {/* Opponent Side */}
              <div className="col-span-3 flex flex-col justify-center">
                <div className="flex flex-col items-center justify-center">
                  {oppPhoto ? (
                    <img
                      src={oppPhoto}
                      alt={opponentName}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover border-2 border-fuchsia-500/40 mb-1.5"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-fuchsia-500/20 border border-fuchsia-500/40 flex items-center justify-center text-fuchsia-300 font-black text-sm mb-1.5">
                      {oppInitial}
                    </div>
                  )}
                  <div className="text-[10px] text-fuchsia-300 font-semibold tracking-wide uppercase truncate max-w-full">{opponentName}</div>
                  <div className="text-3xl font-black text-white mt-1.5 tracking-tight font-mono">{oppXp} د</div>
                  {oppLead && (
                    <span className="mt-1 text-[10px] font-bold text-fuchsia-400 bg-fuchsia-500/10 px-2.5 py-0.5 rounded-full flex items-center gap-0.5">
                      متقدم ↑
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Custom Battle Progress Bar Indicator */}
            <div className="space-y-2 relative z-10">
              <div className="h-2 rounded-full bg-white/[0.04] flex overflow-hidden border border-white/5">
                <div
                  style={{ width: `${myPercent}%` }}
                  className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-full transition-all duration-700 ease-out"
                />
                <div
                  style={{ width: `${oppPercent}%` }}
                  className="bg-gradient-to-r from-purple-400 to-fuchsia-400 h-full transition-all duration-700 ease-out"
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono font-bold text-gray-500">
                <span className="text-indigo-300/80">أنت: {myXp} د</span>
                <span className="text-fuchsia-300/80">الخصم: {oppXp} د</span>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="flex items-center gap-3 relative z-10 mt-auto">
              {!isExpired ? (
                <p className="flex-1 text-center py-[11px] text-[11px] font-bold text-indigo-300/80 bg-indigo-500/5 border border-indigo-500/20 rounded-xl">
                  ⏱️ كل جلسات تركيزك العادية تتحول تلقائياً لنقاط بهذا السباق
                </p>
              ) : null}

              <button
                onClick={() => handleFinishChallengeEarly(challenge)}
                className={`py-[11px] px-4 font-bold text-xs transition-all border rounded-xl cursor-pointer ${
                  isExpired 
                    ? "flex-1 bg-gradient-to-l from-amber-500 to-orange-600 border-amber-500/30 text-white shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-[pulse_2s_infinite] hover:brightness-110 active:scale-95" 
                    : "bg-white/5 hover:bg-white/10 border-white/5 text-gray-300 active:scale-95"
                }`}
              >
                {isExpired ? "🏆 احتساب النتائج وحصد الجوائز" : "إنهاء واحتساب"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

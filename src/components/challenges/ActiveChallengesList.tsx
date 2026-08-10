import React from "react";
import { Swords, Timer, Trophy, Zap, Flame, Skull } from "lucide-react";
import { Challenge, UserData } from "../../shared";
import { db } from "../../firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { motion } from "motion/react";
import { showToast } from "../../lib/cosmicUI";

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
      showToast("هذا النزال لم يبدأ بعد أو تم احتسابه سابقاً.", "warning");
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
      <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-space-dark/30 backdrop-blur-md p-12 text-center max-w-2xl mx-auto">
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 mb-6 shadow-[0_0_30px_rgba(244,63,94,0.15)]">
          <Swords size={26} className="animate-pulse" />
        </div>
        <h3 className="text-xl font-black text-white mb-3">الساحة خالية — لا توجد نزالات نشطة</h3>
        <p className="text-gray-400 text-sm max-w-md mx-auto mb-8 leading-relaxed">
          استدعِ رفيقك وافتح نزال تركيز: كل دقيقة دراسة عادية تتحول لنقطة، وأكثرهم
          تركيزاً عند نهاية المدة يرفع راية الفوز.
        </p>
        <div className="flex flex-wrap lg:flex-nowrap justify-center gap-3">
          <button
            onClick={onStartChallengeClick}
            className="px-5 py-2.5 bg-gradient-to-l from-rose-500 to-amber-600 hover:from-rose-600 hover:to-amber-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 transform active:scale-95"
          >
            <Swords size={13} />
            <span>إطلاق نزال تركيز</span>
          </button>
          <button
            onClick={onInviteFriendClick}
            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-200 border border-white/5 rounded-xl font-bold text-xs transition-all transform active:scale-95"
          >
            استدعاء رائد فضاء جديد
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
          <motion.div
            key={challenge.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="group relative overflow-hidden rounded-3xl border border-white/6 bg-gradient-to-br from-[#100f1e] to-[#0a0912] shadow-2xl transition-all duration-300 hover:border-rose-500/30 hover:shadow-[0_14px_45px_rgba(244,63,94,0.18)] flex flex-col gap-5 p-6"
          >
            {/* خط طاقة علوي */}
            <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${
              isExpired ? "from-amber-500 via-orange-400 to-amber-500" : "from-rose-500 via-fuchsia-400 to-rose-500"
            }`} />

            {/* توهجات خلفية */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-amber-500/6 blur-3xl pointer-events-none" />

            {/* Header: Status */}
            <div className="flex items-center justify-between z-10 relative">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isExpired ? "bg-amber-400" : "bg-emerald-400"}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isExpired ? "bg-amber-500" : "bg-emerald-500"}`}></span>
                </span>
                <span className={`text-[11px] font-bold ${isExpired ? "text-amber-400" : "text-rose-400"} tracking-wide px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/5 flex items-center gap-1`}>
                  {isExpired ? (
                    <>
                      <Skull size={11} />
                      نزال منتهٍ — بانتظار التحكيم
                    </>
                  ) : (
                    <>
                      <Flame size={11} className="animate-pulse" />
                      نزال مشتعل
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/5 text-gray-300 text-xs font-mono">
                <Timer size={12} className="text-amber-400" />
                <span>{isExpired ? "انتهى الوقت" : `المتبقي: ${formatDuration(minutesLeft)}`}</span>
              </div>
            </div>

            {/* Behind warning alert */}
            {isBehind && (
              <div className="relative z-10 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-400/10 border border-amber-400/25 text-amber-400 text-xs animate-pulse">
                <Zap size={14} className="animate-pulse shrink-0" />
                <span>خصمك يتقدم عليك بـ <strong className="font-bold font-mono">{behindDiff}</strong> دقيقة! شدة تزيد، البطولة ما بتتنازل 🚀</span>
              </div>
            )}

            {/* Combatants VS */}
            <div className="grid grid-cols-7 gap-2 items-center text-center my-2 relative z-10">
              {/* My Side */}
              <div className="col-span-3 flex flex-col justify-center">
                <div className="flex flex-col items-center justify-center">
                  {myPhoto ? (
                    <img
                      src={myPhoto}
                      alt={myName}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.25)] mb-2 group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border-2 border-rose-500/50 flex items-center justify-center text-rose-300 font-black text-base mb-2 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
                      {myInitial}
                    </div>
                  )}
                  <div className="text-[10px] text-rose-300 font-semibold tracking-wide uppercase truncate max-w-full">
                    أنت {myLead && "· متقدم ↑"}
                  </div>
                  <div className="text-3xl font-black text-white mt-1 tracking-tight font-mono drop-shadow-[0_0_12px_rgba(244,63,94,0.35)]">
                    {myXp} <span className="text-sm font-bold text-rose-400/80">د</span>
                  </div>
                </div>
              </div>

              {/* VS Icon */}
              <div className="col-span-1 flex flex-col items-center justify-center gap-1">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.3)] group-hover:scale-110 group-hover:rotate-12 transition-transform">
                  <Swords size={17} />
                </div>
                <span className="text-[9px] font-black text-gray-500 tracking-widest">VS</span>
              </div>

              {/* Opponent Side */}
              <div className="col-span-3 flex flex-col justify-center">
                <div className="flex flex-col items-center justify-center">
                  {oppPhoto ? (
                    <img
                      src={oppPhoto}
                      alt={opponentName}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-fuchsia-500/50 shadow-[0_0_20px_rgba(217,70,239,0.25)] mb-2 group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/20 border-2 border-fuchsia-500/50 flex items-center justify-center text-fuchsia-300 font-black text-base mb-2 shadow-[0_0_20px_rgba(217,70,239,0.2)]">
                      {oppInitial}
                    </div>
                  )}
                  <div className="text-[10px] text-fuchsia-300 font-semibold tracking-wide uppercase truncate max-w-full">
                    {opponentName} {oppLead && "· متقدم ↑"}
                  </div>
                  <div className="text-3xl font-black text-white mt-1 tracking-tight font-mono drop-shadow-[0_0_12px_rgba(217,70,239,0.35)]">
                    {oppXp} <span className="text-sm font-bold text-fuchsia-400/80">د</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Battle Progress Bar Indicator */}
            <div className="space-y-2 relative z-10">
              <div className="h-2.5 rounded-full bg-white/[0.04] flex overflow-hidden border border-white/6">
                <div
                  style={{ width: `${myPercent}%` }}
                  className="bg-gradient-to-r from-rose-500 to-rose-400 h-full transition-all duration-700 ease-out"
                />
                <div
                  style={{ width: `${oppPercent}%` }}
                  className="bg-gradient-to-r from-fuchsia-400 to-fuchsia-300 h-full transition-all duration-700 ease-out"
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono font-bold text-gray-500">
                <span className="text-rose-300/80">أنت: {myXp} د</span>
                <span className="text-fuchsia-300/80">الخصم: {oppXp} د</span>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="flex items-center gap-3 relative z-10 mt-auto">
              {!isExpired ? (
                <p className="flex-1 text-center py-[11px] text-[11px] font-bold text-rose-300/80 bg-rose-500/5 border border-rose-500/20 rounded-xl">
                  ⚡ كل جلسات تركيزك العادية تتحول تلقائياً لنقاط بهذا النزال
                </p>
              ) : null}

              <button
                onClick={() => handleFinishChallengeEarly(challenge)}
                className={`py-[11px] px-4 font-bold text-xs transition-all border rounded-xl cursor-pointer ${
                  isExpired 
                    ? "flex-1 bg-gradient-to-l from-amber-500 to-orange-600 border-amber-500/30 text-white shadow-[0_0_18px_rgba(245,158,11,0.25)] animate-[pulse_2s_infinite] hover:brightness-110 active:scale-95 flex items-center justify-center gap-1.5" 
                    : "bg-white/5 hover:bg-white/10 border-white/5 text-gray-300 active:scale-95 flex items-center justify-center gap-1.5"
                }`}
              >
                {isExpired ? (
                  <>
                    <Trophy size={13} />
                    احتساب النتائج وحصد الجوائز
                  </>
                ) : (
                  <>
                    <Skull size={13} className="text-rose-400" />
                    إنهاء النزال الآن
                  </>
                )}
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

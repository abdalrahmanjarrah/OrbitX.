import React from "react";
import { Swords, Timer, Trophy, Zap, PlayCircle, Loader2 } from "lucide-react";
import { Challenge, UserData } from "../../shared";
import { db } from "../../firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc, writeBatch, increment } from "firebase/firestore";
import { motion } from "motion/react";

interface ActiveChallengesListProps {
  challenges: Challenge[];
  currentUser: UserData;
  onEnterStation: (stationId: string) => void;
  onRefresh: () => void;
  onStartChallengeClick: () => void;
  onInviteFriendClick: () => void;
}

export const ActiveChallengesList: React.FC<ActiveChallengesListProps> = ({
  challenges,
  currentUser,
  onEnterStation,
  onRefresh,
  onStartChallengeClick,
  onInviteFriendClick,
}) => {
  const [loadingChallengeId, setLoadingChallengeId] = React.useState<string | null>(null);

  const handleJoinOrCreateChallengeRoom = async (challenge: Challenge) => {
    setLoadingChallengeId(challenge.id);
    try {
      // 1. Search if a room with this challengeId already exists to avoid duplication
      const roomsRef = collection(db, "rooms");
      const q = query(roomsRef, where("challengeId", "==", challenge.id), where("isChallenge", "==", true));
      const querySnap = await getDocs(q);

      if (!querySnap.empty) {
        // Enforce entry to existing room
        const existingRoomId = querySnap.docs[0].id;
        onEnterStation(existingRoomId);
        return;
      }

      // 2. Identify Challenger vs Challenged to build room details
      const opponentId = challenge.challengerId === currentUser.uid ? challenge.challengedId : challenge.challengerId;
      const opponentName = challenge.challengerId === currentUser.uid ? challenge.challengedName : challenge.challengerName;

      // 3. Create a unified, secure challenge study room
      const roomData = {
        name: `مبارزة: ${currentUser.displayName} ضد ${opponentName} ⚔️`,
        task: "Deep Galactic Focus Battle",
        creatorId: currentUser.uid,
        creatorName: currentUser.displayName,
        participants: [currentUser.uid, opponentId],
        maxParticipants: 2,
        timerStatus: "idle",
        timerDuration: challenge.durationMinutes || 60,
        breakDuration: 5,
        createdAt: serverTimestamp(),
        isChallenge: true,
        challengeId: challenge.id,
        challengeDurationMinutes: challenge.durationMinutes || 60,
      };

      const newRoomRef = await addDoc(collection(db, "rooms"), roomData);
      onEnterStation(newRoomRef.id);
    } catch (e) {
      console.error("Error joining or launching battle room:", e);
    } finally {
      setLoadingChallengeId(null);
    }
  };

  const handleFinishChallengeEarly = async (challenge: Challenge) => {
    // Prevent double-claim: only an active battle can be settled
    if (challenge.status !== "active") {
      alert("هذا النزال تم احتسابه سابقاً أو لم يبدأ بعد.");
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

    // Real duel only counts if both players actually entered the battle room
    const bothEntered = !!(challenge as any).p1EnteredAt && !!(challenge as any).p2EnteredAt;

    try {
      await updateDoc(doc(db, "challenges", challenge.id), {
        status: "completed",
        winnerId,
        completedAt: Date.now()
      });

      // Award the winner — full rewards only for a real duel (both entered)
      if (winnerId !== "draw" && winnerId !== "tie" && winnerId !== "") {
        const uRef = doc(db, "users", winnerId);
        const pRef = doc(db, "profiles", winnerId);
        const { arrayUnion } = await import("firebase/firestore");

        if (bothEntered) {
          await updateDoc(uRef, {
            coins: increment(50),
            badges: arrayUnion("challenge_champ"),
            challengeChampExpiry: Date.now() + 7 * 24 * 60 * 60 * 1000,
            xp: increment(100)
          });

          await updateDoc(pRef, {
            badges: arrayUnion("challenge_champ"),
            challengeChampExpiry: Date.now() + 7 * 24 * 60 * 60 * 1000,
            xp: increment(100)
          });

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
            content: `⚔️ انتهى النزال! فاز ${winnerId === challenge.challengerId ? challenge.challengerName : challenge.challengedName} بـ ${Math.max(score1, score2)} دقيقة مقابل ${Math.min(score1, score2)} دقيقة لك. حظاً أوفر المرة القادمة!`,
            read: false,
            timestamp: serverTimestamp(),
          });
        } else {
          // Default win: opponent never entered — no big rewards
          await addDoc(collection(db, "users", winnerId, "notifications"), {
            type: "challenge_completed",
            content: `⚔️ انتهى النزال بانتصارك (الخصم لم يدخل القمرة). لم تُمنح جوائز النزال الحقيقي.`,
            read: false,
            timestamp: serverTimestamp(),
          });
        }
      } else {
        // Tie
        const msg = `🤝 انتهى النزال بالتعادل بين ${challenge.challengerName} و ${challenge.challengedName} بـ ${score1} دقيقة تركيز لكل منهما!`;
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

  const activeOnly = challenges.filter(c => c.status === "active" || c.status === "accepted");

  if (activeOnly.length === 0) {
    return (
      <div className="rounded-3xl border border-white/5 bg-[#0b0c16]/30 backdrop-blur-md p-12 text-center max-w-2xl mx-auto">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 shadow-[0_0_30px_rgba(99,102,241,0.05)]">
          🚀
        </div>
        <h3 className="text-xl font-black text-white mb-3">لا توجد نزالات تركيز نشطة حالياً</h3>
        <p className="text-gray-400 text-sm max-w-md mx-auto mb-8 leading-relaxed">
          ابدأ أول مواجهة تركيز مع أصدقائك واختبر من يستطيع الصمود أكثر. النزالات تساهم في تنشيط مهاراتك ومضاعفة مقدار الـ XP الذي تجنيه!
        </p>
        <div className="flex flex-wrap lg:flex-nowrap justify-center gap-3">
          <button
            onClick={onStartChallengeClick}
            className="px-5 py-2.5 bg-gradient-to-l from-indigo-500 to-fuchsia-600 hover:from-indigo-600 hover:to-fuchsia-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 transform active:scale-95"
          >
            <Swords size={13} />
            <span>بدء نزال تركيز</span>
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
        const opponentName = isChallenger ? challenge.challengedName : challenge.challengerName;

        // Progress calc
        const totalXp = (myXp + oppXp) || 1;
        const myPercent = Math.round((myXp / totalXp) * 100);
        const oppPercent = 100 - myPercent;

        // Time calculations — timer only runs once the battle actually started
        const isAccepted = challenge.status === "accepted";
        const start = isAccepted
          ? null
          : (challenge.startTime || challenge.createdAt || Date.now());
        const elapsedMinutes = start ? Math.floor((Date.now() - start) / 60000) : 0;
        const minutesLeft = isAccepted
          ? challenge.durationMinutes || 60
          : Math.max(0, (challenge.durationMinutes || 60) - elapsedMinutes);
        const isExpired = isAccepted ? false : minutesLeft <= 0;

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
                <span className={`text-[11px] font-bold ${isAccepted ? "text-amber-400" : isExpired ? "text-amber-400" : "text-emerald-400"} tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-white/[0.03] border border-white/5`}>
                  {isAccepted ? "بانتظار دخول الطرفين" : isExpired ? "بانتظار الحساب" : "نزال نشط"}
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/5 text-gray-300 text-xs font-mono">
                <Timer size={12} className="text-indigo-400" />
                <span>{isAccepted ? "المؤقت لا يعمل بعد" : isExpired ? "مكتمل المدة" : `المتبقي: ${minutesLeft} د`}</span>
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
                  <div className="text-[10px] text-indigo-300 font-semibold tracking-wide uppercase">أنت (البطل)</div>
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
                <span>قوة البطل: {myPercent}%</span>
                <span>المنافس: {oppPercent}%</span>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="flex items-center gap-3 relative z-10 mt-auto">
              {!isExpired ? (
                <button
                  disabled={loadingChallengeId === challenge.id}
                  onClick={() => handleJoinOrCreateChallengeRoom(challenge)}
                  className="flex-1 py-[11px] bg-indigo-500/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  {loadingChallengeId === challenge.id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <PlayCircle size={14} />
                  )}
                  <span>دخول قمرة المعركة</span>
                </button>
              ) : null}

              {isAccepted ? (
                <p className="flex-1 text-center text-[11px] font-bold text-amber-400/80 py-[11px] bg-amber-400/5 border border-amber-400/20 rounded-xl">
                  ⏳ النزال يبدأ تلقائياً عندما يدخل كلاكما قمرة المعركة
                </p>
              ) : (
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
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

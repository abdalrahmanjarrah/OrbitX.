import React from "react";
import { Swords, Timer, Trophy, Zap, PlayCircle, Loader2 } from "lucide-react";
import { Challenge, UserData } from "../../shared";
import { db } from "../../firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc, writeBatch } from "firebase/firestore";
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
    // Determine winner based on current score
    const score1 = challenge.progressPlayer1 || 0;
    const score2 = challenge.progressPlayer2 || 0;
    let winnerId = "";
    if (score1 > score2) {
      winnerId = challenge.challengerId;
    } else if (score2 > score1) {
      winnerId = challenge.challengedId;
    } else {
      winnerId = "draw"; // It's a draw
    }

    try {
      await updateDoc(doc(db, "challenges", challenge.id), {
        status: "completed",
        winnerId,
        completedAt: Date.now()
      });
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

        // Time calculations
        const elapsedMinutes = Math.floor((Date.now() - (challenge.createdAt || Date.now())) / 60000);
        const minutesLeft = Math.max(0, (challenge.durationMinutes || 60) - elapsedMinutes);
        const isExpired = minutesLeft <= 0;

        return (
          <div
            key={challenge.id}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-[#111329] to-[#0d0e1b] p-6 shadow-xl transition-all hover:border-indigo-500/30 hover:shadow-[0_8px_32px_rgba(99,102,241,0.1)]"
          >
            {/* Header telemetry info */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-[ping_2s_infinite]" />
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  نزال نشط الآن
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono">
                <Timer size={13} className="text-indigo-400" />
                <span>المتبقي: {isExpired ? "الانتهاء بانتظار الاحتساب" : `${minutesLeft} دقيقة`}</span>
              </div>
            </div>

            {/* Combatants Comparison VS Display */}
            <div className="grid grid-cols-7 gap-2 items-center text-center my-6">
              {/* My Side */}
              <div className="col-span-3">
                <div className="text-xs text-indigo-400 font-semibold truncate">أنت (البطل)</div>
                <div className="text-2xl font-black text-white mt-1">{myXp} XP</div>
                <div className="text-[10px] text-gray-500 font-mono">الإنتاجية الخاصة بك</div>
              </div>

              {/* VS Sword Icon Badge */}
              <div className="col-span-1 flex justify-center">
                <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.15)] group-hover:scale-110 transition-transform">
                  <Swords size={16} />
                </div>
              </div>

              {/* Opponent Side */}
              <div className="col-span-3">
                <div className="text-xs text-fuchsia-400 font-semibold truncate">{opponentName}</div>
                <div className="text-2xl font-black text-white mt-1">{oppXp} XP</div>
                <div className="text-[10px] text-gray-500 font-mono">الإنتاجية المحققة لها</div>
              </div>
            </div>

            {/* Custom Battle Progress Bar Indicator */}
            <div className="space-y-2 mb-6">
              <div className="h-2 rounded-full bg-white/5 flex overflow-hidden">
                <div
                  style={{ width: `${myPercent}%` }}
                  className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-full transition-all duration-500"
                />
                <div
                  style={{ width: `${oppPercent}%` }}
                  className="bg-gradient-to-r from-fuchsia-400 to-fuchsia-600 h-full transition-all duration-500"
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono font-bold text-gray-400">
                <span>توزيع القوة: {myPercent}%</span>
                <span>المنافس: {oppPercent}%</span>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="flex items-center gap-3">
              <button
                disabled={loadingChallengeId === challenge.id}
                onClick={() => handleJoinOrCreateChallengeRoom(challenge)}
                className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 disabled:bg-[#15172b] text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                {loadingChallengeId === challenge.id ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <PlayCircle size={14} />
                )}
                <span>دخول قمرة المعركة</span>
              </button>

              <button
                onClick={() => handleFinishChallengeEarly(challenge)}
                className="py-2.5 px-4 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl font-bold text-xs transition-colors border border-white/5"
              >
                إنهاء واحتساب
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { Swords, Mail, Send, CheckCircle, XCircle, Timer, Award, User, Loader2 } from "lucide-react";
import { Challenge, UserData } from "../../shared";
import { db } from "../../firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";

interface ChallengeInvitesProps {
  incomingInvites: Challenge[];
  outgoingInvites: Challenge[];
  currentUser: UserData;
  onRefresh: () => void;
}

export const ChallengeInvites: React.FC<ChallengeInvitesProps> = ({
  incomingInvites,
  outgoingInvites,
  currentUser,
  onRefresh,
}) => {
  const [friends, setFriends] = useState<UserData[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<UserData | null>(null);
  const [duration, setDuration] = useState<number>(30); // default 30 mins
  const [sendingInvite, setSendingInvite] = useState(false);

  // Load user friends on mount/refresh
  useEffect(() => {
    let isMounted = true;
    const fetchFriends = async () => {
      setLoadingFriends(true);
      try {
        const friendsRef = collection(db, "users", currentUser.uid, "friends");
        const snap = await getDocs(friendsRef);
        const friendIds = snap.docs.map(doc => doc.id);

        if (friendIds.length === 0) {
          setFriends([]);
          setLoadingFriends(false);
          return;
        }

        // Chunk if there are too many, but limit(20) handles it safely
        const profilesRef = collection(db, "profiles");
        const q = query(profilesRef, where("uid", "in", friendIds.slice(0, 10)));
        const profilesSnap = await getDocs(q);

        if (isMounted) {
          const fetched = profilesSnap.docs.map(doc => doc.data() as UserData);
          setFriends(fetched);
        }
      } catch (err) {
        console.warn("Failed fetching friends for quick invite:", err);
      } finally {
        if (isMounted) setLoadingFriends(false);
      }
    };

    fetchFriends();
    return () => {
      isMounted = false;
    };
  }, [currentUser.uid]);

  const handleAcceptInvite = async (challenge: Challenge) => {
    try {
      await updateDoc(doc(db, "challenges", challenge.id), {
        status: "active",
        startTime: Date.now(),
        createdAt: Date.now()
      });
      onRefresh();
    } catch (err) {
      console.error("Failed accepting challenge:", err);
    }
  };

  const handleDeclineInvite = async (challenge: Challenge) => {
    try {
      await updateDoc(doc(db, "challenges", challenge.id), {
        status: "declined"
      });
      onRefresh();
    } catch (err) {
      console.error("Failed declining challenge:", err);
    }
  };

  const handleSendChallenge = async () => {
    if (!selectedFriend) return;
    setSendingInvite(true);
    try {
      // Create new challenge entry in DB
      const challengeData = {
        challengerId: currentUser.uid,
        challengerName: currentUser.displayName,
        challengedId: selectedFriend.uid,
        challengedName: selectedFriend.displayName || "صديق",
        status: "pending",
        createdAt: Date.now(),
        durationMinutes: duration,
        progressPlayer1: 0,
        progressPlayer2: 0,
        rewardsClaimed: []
      };

      const docRef = await addDoc(collection(db, "challenges"), challengeData);

      // Create a push notification
      await addDoc(collection(db, "users", selectedFriend.uid, "notifications"), {
        type: "challenge",
        content: `دعاك ${currentUser.displayName} لتحدي تركيز درامي مدته ${duration} دقيقة! ⚔️`,
        read: false,
        timestamp: serverTimestamp(),
      });

      setSelectedFriend(null);
      onRefresh();
    } catch (err) {
      console.error("Error creating manual challenge:", err);
    } finally {
      setSendingInvite(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Quick Invite Form */}
      <div className="lg:col-span-5 p-6 rounded-3xl border border-white/5 bg-[#0b0c16]/50 backdrop-blur-md">
        <h3 className="text-md font-bold text-white flex items-center gap-2 mb-4">
          <Swords size={16} className="text-indigo-400" />
          <span>مبارزة سريعة جديدة</span>
        </h3>
        
        <p className="text-xs text-gray-400 leading-relaxed mb-6">
          حدد زميلاً دراسياً، اختر زمن المعركة المرغوب، وادعه لخوض جولة من التركيز الصارم. الفائز سيتصدر قائمة المتحدين!
        </p>

        {loadingFriends ? (
          <div className="flex justify-center py-6">
            <Loader2 size={20} className="text-indigo-400 animate-spin" />
          </div>
        ) : friends.length === 0 ? (
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center text-xs text-gray-500">
            لا توجد حسابات زملاء حالية. انتقل لقسم "البث والاستكشاف" لإضافة مرافقين في رحلتك!
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-300 font-semibold block mb-2">اختر الصديق المراد تحديه</label>
              <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-[160px] pr-1">
                {friends.map((friend) => {
                  const isSelected = selectedFriend?.uid === friend.uid;
                  return (
                    <button
                      key={friend.uid}
                      type="button"
                      onClick={() => setSelectedFriend(friend)}
                      className={`p-2.5 rounded-xl border text-right transition-all flex items-center gap-2 ${
                        isSelected
                          ? "bg-indigo-500/10 border-indigo-500 text-white shadow-[0_4px_12px_rgba(99,102,241,0.15)]"
                          : "bg-white/[0.01] border-white/5 text-gray-400 hover:border-white/10 hover:text-white"
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-indigo-500/15 flex items-center justify-center shrink-0">
                        {friend.photoURL ? (
                          <img src={friend.photoURL} alt={friend.displayName} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <User size={12} className="text-indigo-400" />
                        )}
                      </div>
                      <span className="text-xs font-bold truncate">{friend.displayName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedFriend && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-3 pt-2"
              >
                <div>
                  <label className="text-xs text-gray-300 font-semibold block mb-2">المدة الكلية للنزال</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[60, 120, 180, 300].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setDuration(mins)}
                        className={`py-1.5 px-1 rounded-lg border font-mono text-[11px] font-bold transition-all ${
                          duration === mins
                            ? "bg-fuchsia-500/10 border-fuchsia-500 text-fuchsia-400"
                            : "bg-white/[0.01] border-white/5 text-gray-400 hover:border-white/10"
                        }`}
                      >
                        {mins >= 60 ? `${mins / 60} ساعات` : `${mins} د`}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={sendingInvite}
                  onClick={handleSendChallenge}
                  className="w-full py-2.5 bg-gradient-to-l from-indigo-500 to-fuchsia-500 hover:from-indigo-600 hover:to-fuchsia-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(99,102,241,0.2)] disabled:opacity-50 mt-4"
                >
                  {sendingInvite ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Send size={13} />
                  )}
                  <span>إرسال دعوة النزال</span>
                </button>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Invites Lists View */}
      <div className="lg:col-span-7 space-y-6">
        {/* Incoming challenges */}
        <div className="p-6 rounded-3xl border border-white/5 bg-[#0b0c16]/30">
          <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <Mail size={15} className="text-fuchsia-400" />
            <span>الدعوات الواردة ({incomingInvites.length})</span>
          </h4>

          {incomingInvites.length === 0 ? (
            <div className="text-center py-6 text-xs text-gray-500">
              لا توجد طلبات تحدي مرسلة لك حالياً.
            </div>
          ) : (
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {incomingInvites.map((challenge) => (
                <div
                  key={challenge.id}
                  className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between transition-hover hover:border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-fuchsia-500/15 flex items-center justify-center text-fuchsia-400 text-xs font-black">
                      {challenge.challengerName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{challenge.challengerName}</div>
                      <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                        <Timer size={10} />
                        <span>مدة التحدي: {challenge.durationMinutes} دقيقة</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAcceptInvite(challenge)}
                      className="px-3.5 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <CheckCircle size={12} />
                      <span>قبول</span>
                    </button>
                    
                    <button
                      onClick={() => handleDeclineInvite(challenge)}
                      className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold rounded-lg transition-colors"
                    >
                      <XCircle size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Outgoing challenges */}
        <div className="p-6 rounded-3xl border border-white/5 bg-[#0b0c16]/30">
          <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <Send size={15} className="text-indigo-400" />
            <span>الدعوات المرسلة المعلقة ({outgoingInvites.length})</span>
          </h4>

          {outgoingInvites.length === 0 ? (
            <div className="text-center py-6 text-xs text-gray-500">
              لم تقم بإرسال أي دعوات معلقة بعد.
            </div>
          ) : (
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {outgoingInvites.map((challenge) => (
                <div
                  key={challenge.id}
                  className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/15 flex items-center justify-center text-indigo-400 text-xs font-black">
                      {challenge.challengedName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{challenge.challengedName}</div>
                      <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                        <Timer size={10} />
                        <span>مدة الجولة: {challenge.durationMinutes} دقيقة</span>
                      </div>
                    </div>
                  </div>

                  <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[10px] text-gray-400">
                    بانتظار الموافقة...
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

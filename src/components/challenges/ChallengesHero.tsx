import React from "react";
import { Swords, Users } from "lucide-react";
import { motion } from "motion/react";

interface ChallengesHeroProps {
  onStartChallengeClick: () => void;
  onInviteFriendClick: () => void;
  friendsCount: number;
}

export const ChallengesHero: React.FC<ChallengesHeroProps> = ({
  onStartChallengeClick,
  onInviteFriendClick,
  friendsCount,
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-[#0e0f1e] to-[#070812] p-6 md:p-8 shadow-xl">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300 text-xs font-semibold mb-3 border border-indigo-500/20"
          >
            <Swords size={12} />
            <span>نزالات الرواد ⚔️</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl md:text-3xl font-black text-white tracking-tight"
          >
            مبارزات الإنتاجية الجماعية
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-2 text-gray-400 text-xs md:text-sm max-w-xl leading-relaxed"
          >
            تحدَّ رفاقك في جلسات تركيز مشتركة لتبادل التحفيز ومضاعفة نقاط الخبرة (XP).
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-3"
        >
          <button
            onClick={onStartChallengeClick}
            className="px-5 py-3 bg-gradient-to-l from-indigo-500 to-fuchsia-600 hover:from-indigo-600 hover:to-fuchsia-700 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-2 transform active:scale-95 shadow-md"
          >
            <Swords size={14} />
            <span>تحدي رائد فضاء</span>
          </button>

          <button
            onClick={onInviteFriendClick}
            className="px-5 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-200 rounded-xl font-bold text-xs transition-all flex items-center gap-2 transform active:scale-95"
          >
            <Users size={14} />
            <span>البحث عن زملاء ({friendsCount})</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
};


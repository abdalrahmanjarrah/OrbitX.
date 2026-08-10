import React from "react";
import { Swords, Users, Rocket } from "lucide-react";
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
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-space-dark p-8 shadow-xl">
      {/* نجوم الخلفية */}
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-indigo-400 opacity-30 animate-pulse"
          style={{
            width: `${Math.random() * 2 + 1}px`,
            height: `${Math.random() * 2 + 1}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 4}s`,
            animationDuration: `${2 + Math.random() * 4}s`,
          }}
        />
      ))}

      {/* توهجات الخلفية */}
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 left-5 w-48 h-48 rounded-full bg-purple-500/8 blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/12 text-indigo-400 text-xs font-medium mb-4 border border-indigo-500/25 tracking-wide"
        >
          <Swords size={12} />
          سباقات الرواد · OrbitX
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl font-black text-white tracking-tight mb-2"
        >
          ساحة{" "}
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            سباقات التركيز
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-400 text-sm leading-relaxed max-w-lg mb-5"
        >
          تحدَّ رفاقك وارفع راية الأكثر تركيزاً. كل دقيقة دراسة حقيقية تجمعها بأي
          محطة تتحول لنقطة — ومين يجمع أكتر دقائق خلال المدة المحددة يحرز الجوائز.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6 max-w-2xl"
        >
          {[
            { icon: "👋", step: "اختر زميلاً" },
            { icon: "⏱️", step: "حدد مدة السباق" },
            { icon: "📚", step: "ادرس عادي وجمّع دقائقك" },
            { icon: "🏆", step: "الأكثر تركيزاً يفوز" },
          ].map((s) => (
            <div
              key={s.step}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] font-bold text-gray-300"
            >
              <span className="text-sm">{s.icon}</span>
              {s.step}
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-3"
        >
          <button
            onClick={onStartChallengeClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/35 text-indigo-400 text-sm font-medium hover:bg-indigo-500/25 hover:border-indigo-500/55 transition-all active:scale-95 cursor-pointer"
          >
            <Rocket size={14} />
            إطلاق سباق جديد
          </button>
          <button
            onClick={onInviteFriendClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm font-medium hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
          >
            <Users size={14} />
            البحث عن زملاء ({friendsCount})
          </button>
        </motion.div>
      </div>
    </div>
  );
};

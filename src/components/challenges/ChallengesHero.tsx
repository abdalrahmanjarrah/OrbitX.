import React from "react";
import { Swords, Users, Rocket, Flame } from "lucide-react";
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
    <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-space-dark p-8 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
      {/* خلفية متوهجة - طاقة ساحة النزال */}
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-rose-600/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] rounded-full bg-indigo-600/5 blur-3xl pointer-events-none" />

      {/* أعمدة الضوء */}
      <div className="absolute inset-0 pointer-events-none opacity-60">
        <div className="absolute -top-24 left-[18%] w-px h-64 bg-gradient-to-b from-rose-400/50 via-rose-400/10 to-transparent" />
        <div className="absolute -top-24 left-[46%] w-px h-64 bg-gradient-to-b from-amber-300/50 via-amber-300/10 to-transparent" />
        <div className="absolute -top-24 left-[72%] w-px h-64 bg-gradient-to-b from-rose-400/50 via-rose-400/10 to-transparent" />
      </div>

      {/* شرارات حية */}
      {Array.from({ length: 34 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-rose-300 opacity-25 animate-pulse"
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

      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/12 text-rose-400 text-xs font-medium mb-4 border border-rose-500/25 tracking-wide"
        >
          <Swords size={12} className="animate-pulse" />
          ساحة النزالات · OrbitX
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2"
        >
          ساحة{" "}
          <span className="bg-gradient-to-r from-rose-400 via-amber-300 to-rose-400 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(244,63,94,0.35)]">
            نزالات التركيز
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-400 text-sm leading-relaxed max-w-lg mb-5"
        >
          خصمك بانتظارك في قلب الحلبة. كل دقيقة تركيز حقيقية تجمعها بأي محطة
          تتحول لنقطة في نزالك — ومين يجمع أكتر دقائق قبل نهاية المدة، يفوز
          بالنزال ويحصد الجوائز.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6 max-w-2xl"
        >
          {[
            { icon: "⚔️", step: "استدعِ خصماً" },
            { icon: "⏱️", step: "حدد مدة النزال" },
            { icon: "📚", step: "ادرس عادي وجمّع نقاطك" },
            { icon: "🏆", step: "الأكثر تركيزاً يحرز الكأس" },
          ].map((s, idx) => (
            <motion.div
              key={s.step}
              whileHover={{ y: -2, scale: 1.02 }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] font-bold text-gray-300 transition-colors hover:border-rose-500/30"
            >
              <span className="text-sm">{s.icon}</span>
              {s.step}
            </motion.div>
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-l from-rose-500 to-amber-600 border border-rose-400/40 text-white text-sm font-medium shadow-[0_0_25px_rgba(244,63,94,0.3)] hover:from-rose-500/90 hover:to-amber-500/90 hover:shadow-[0_0_35px_rgba(244,63,94,0.45)] transition-all active:scale-95 cursor-pointer"
          >
            <Rocket size={14} />
            إطلاق نزال جديد
          </button>
          <button
            onClick={onInviteFriendClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm font-medium hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
          >
            <Users size={14} />
            استدعاء مقاتل ({friendsCount})
          </button>
        </motion.div>

        {/* شريط "المجد" السفلي */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-2 mt-6 pt-4 border-t border-white/5 text-[10px] text-gray-500"
        >
          <Flame size={11} className="text-amber-400/70" />
          <span>الفائز يرفع راية النزال، يكسب شارة البطل الأسبوعية، ويغادر الحلبة أقوى.</span>
        </motion.div>
      </div>
    </div>
  );
};

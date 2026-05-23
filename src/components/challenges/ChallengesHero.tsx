import React from "react";
import { Swords, Users, Shield, Zap, Sparkles } from "lucide-react";
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
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0f1122] via-[#0b0c16] to-[#080914] p-8 md:p-12 shadow-[0_24px_64px_rgba(0,0,0,0.6)]">
      {/* Immersive Space Radar Background Accent */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 w-[400px] h-[400px] rounded-full border border-indigo-500/10 pointer-events-none flex items-center justify-center animate-[pulse_6s_ease-in-out_infinite]">
        <div className="w-[300px] h-[300px] rounded-full border border-indigo-400/5 flex items-center justify-center">
          <div className="w-[160px] h-[160px] rounded-full border border-fuchsia-500/5" />
        </div>
      </div>

      <div className="relative z-10 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-4 tracking-wide uppercase"
        >
          <Swords size={12} className="animate-pulse" />
          <span>مركز قيادة النزالات والأساطيل</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight"
        >
          صراع التركيز الرقمي <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-l from-indigo-400 via-fuchsia-400 to-cyan-400">
            أثبت جدارتك في فضاء الإنتاجية
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-4 text-gray-300 text-sm md:text-base leading-relaxed"
        >
          لا تدرس وحدك في ظلام الفضاء السحيق! تحدَّ أصدقاءك في مبارزات تركيز حقيقية (Battle Focus) تعتمد على تجميع نقاط الخبرة (XP) الحقيقية ومراقبة الخصم في الوقت الفعلي والسيطرة على السجل العام. الفائز ينال المجد والترقية العسكرية!
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 flex flex-wrap gap-4"
        >
          <button
            onClick={onStartChallengeClick}
            className="px-6 py-3.5 bg-gradient-to-l from-indigo-500 to-fuchsia-600 hover:from-indigo-600 hover:to-fuchsia-700 text-white rounded-2xl font-bold text-sm shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all flex items-center gap-2 group transform active:scale-95"
          >
            <Swords size={16} className="group-hover:rotate-12 transition-transform" />
            <span>بدء مبارزة جديدة</span>
          </button>

          <button
            onClick={onInviteFriendClick}
            className="px-6 py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-100 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 transform active:scale-95"
          >
            <Users size={16} />
            <span>دعوة رائد فضاء جديد</span>
          </button>
        </motion.div>
      </div>

      {/* Side Quick Stats Dashboard inside Hero */}
      <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-400 border border-indigo-500/10">
            <Users size={18} />
          </div>
          <div>
            <div className="text-xs text-gray-400">الزملاء المتوفرين</div>
            <div className="text-sm font-black text-white">{friendsCount} رواد فضاء</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-fuchsia-500/15 flex items-center justify-center text-fuchsia-400 border border-fuchsia-500/10">
            <Zap size={18} />
          </div>
          <div>
            <div className="text-xs text-gray-400">صناعة الحافز</div>
            <div className="text-sm font-black text-white">متفاعل بالخصومة ⚔️</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-400 border border-cyan-500/10">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="text-xs text-gray-400">عائد الـ XP</div>
            <div className="text-sm font-black text-white">مضاعف 2x للنزال</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 border border-emerald-500/10">
            <Shield size={18} />
          </div>
          <div>
            <div className="text-xs text-gray-400">الحماية الأمنية</div>
            <div className="text-sm font-black text-white">نظام كشف الخمول 🛡️</div>
          </div>
        </div>
      </div>
    </div>
  );
};

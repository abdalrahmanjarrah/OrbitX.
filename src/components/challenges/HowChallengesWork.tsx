import React from "react";
import { Zap, Swords, Trophy } from "lucide-react";

export const HowChallengesWork: React.FC = () => {
  return (
    <div className="p-4 rounded-xl border border-white/5 bg-[#0b0c16]/30 text-center max-w-xl mx-auto">
      <p className="text-xs text-gray-400 leading-relaxed flex flex-col items-center gap-2">
        <span className="inline-flex items-center gap-1 text-indigo-300 font-bold">
          <Zap size={14} className="text-indigo-400" />
          معلومة سريعة
        </span>
        أرسل دعوة لأي زميل، وعندما يقبلها، ادخلا معاً لقاعة التركيز لتكسبا نقاط خبرة (XP) إضافية وتتصدرا تصنيف المجرة 🏆.
      </p>
    </div>
  );
};


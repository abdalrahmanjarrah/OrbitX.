import React from "react";
import { UserPlus, Swords, Play, Zap, Trophy, HelpCircle } from "lucide-react";

export const HowChallengesWork: React.FC = () => {
  const steps = [
    {
      icon: <UserPlus className="text-cyan-400" size={20} />,
      title: "1. المرافقة والمصادقة",
      description: "أضف رفيقا دراسيا عبر قسم 'البث والاستكشاف' بالبحث عن بريده الإلكتروني أو اسمه لتجتمعا في أوربت واحد.",
    },
    {
      icon: <Swords className="text-indigo-400" size={20} />,
      title: "2. إطلاق دعوة النزال",
      description: "حدد الرفيق في لوحة التحكم هنا، حدد وقت الموقعة (من 15 إلى 60 دقيقة) وأرسل له شارة الهجوم.",
    },
    {
      icon: <Play className="text-fuchsia-400" size={20} />,
      title: "3. دخول الغرفة المشتركة",
      description: "بمجرد قبول صديقك، اضغط 'دخول القمرة' لتنضما سوياً لقاعة تركيز خاصة ومؤمنة تماماً.",
    },
    {
      icon: <Zap className="text-amber-400" size={20} />,
      title: "4. حشد الإنتاجية والـ XP",
      description: "ابدأ العداد وتجنب أي خمول أو ملهيات. كل دقيقة تركيز مكتملة تضخ نقاط XP مباشرة لصالح قوتك.",
    },
    {
      icon: <Trophy className="text-emerald-400" size={20} />,
      title: "5. احتساب بطل المجرة",
      description: "فور اكتمال العداد، يتحدد المنتصر تلقائياً ويحصل على نقاط مجد إضافية ومكانة متميزة في التصنيفات!",
    },
  ];

  return (
    <div className="p-6 md:p-8 rounded-3xl border border-white/5 bg-[#0b0c16]/30">
      <div className="flex items-center gap-2 mb-6">
        <HelpCircle size={18} className="text-indigo-400 animate-pulse" />
        <h3 className="text-sm font-bold text-white">كيف تعمل مبارزات التركيز؟</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {steps.map((step, idx) => (
          <div key={idx} className="relative flex flex-col items-start p-4 rounded-2xl bg-white/[0.01] border border-white/[0.03] hover:border-white/10 transition-colors">
            {/* Connection dashes for visual flow */}
            {idx < 4 && (
              <div className="hidden md:block absolute top-10 -left-6 w-12 border-t border-dashed border-indigo-500/10 z-0" />
            )}

            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 border border-white/5 relative z-10 shadow-md">
              {step.icon}
            </div>

            <h4 className="text-xs font-bold text-white mb-2 relative z-10">{step.title}</h4>
            <p className="text-[11px] text-gray-400 leading-relaxed relative z-10">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

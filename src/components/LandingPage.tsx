import React, { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Rocket, Target, Flame, Trophy, Play, CheckCircle2, ChevronLeft } from "lucide-react";
import StarBackground from "./StarBackground";

function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const dur = 1800;
      let startTimestamp: number;
      const step = (ts: number) => {
        if (!startTimestamp) startTimestamp = ts;
        const p = Math.min((ts - startTimestamp) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setCount(Math.floor(ease * target));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  }, [isInView, target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

const steps = [
  {
    num: "01",
    title: "اختر مادتك وابدأ جلسة",
    desc: "حدد المادة، اختر مدة الجلسة (25 أو 50 دقيقة)، واضغط كزر الانطلاق. التايمر بيشتغل والـ XP بيبدأ يحسب.",
    visual: (
      <div className="flex flex-col items-center gap-4 w-full w-max-md">
        <div className="text-xs text-gray-400 mb-1">بدء جلسة جديدة</div>
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-6 text-center w-full">
          <div className="text-5xl font-black font-mono text-white leading-none">
            25:00
          </div>
          <div className="text-sm text-gray-400 mt-2">رياضيات · تركيز عميق</div>
          <div className="mt-4 flex gap-2 justify-center">
            <span className="text-xs px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300">
              رياضيات
            </span>
            <span className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400">
              فيزياء
            </span>
          </div>
          <div className="mt-4 bg-violet-600 rounded-xl p-3 text-sm font-bold text-white shadow-lg shadow-violet-600/30">
            ▶ إطلاق الجلسة · +75 XP
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <div className="text-xs text-gray-400">نوع الجلسة</div>
            <div className="text-sm font-bold text-white mt-1">تركيز 🎯</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <div className="text-xs text-gray-400">XP المتوقع</div>
            <div className="text-sm font-bold text-violet-400 mt-1">
              +75 XP
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    num: "02",
    title: "اكسب XP وحافظ على الستريك",
    desc: "كل جلسة تعطيك XP بيُضاف لترتيبك. إذا درست كل يوم، الستريك بيكبر والـ XP المكتسب بيتضاعف.",
    visual: (
      <div className="flex flex-col items-center gap-4 w-full">
        <div className="text-xs text-gray-400 mb-1">اكتملت الجلسة!</div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center w-full">
          <div className="text-4xl mb-2 flex justify-center">🎉</div>
          <div className="text-xl font-bold font-display text-white">
            +75 XP مكتسب!
          </div>
          <div className="text-xs text-gray-400 mt-2">
            رياضيات · 25 دقيقة
          </div>
          <div className="mt-4 bg-white/5 rounded-xl p-3 text-right" dir="rtl">
            <div className="text-xs text-gray-400 mb-2">تقدم الرتبة</div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="w-[68%] h-full bg-violet-600 rounded-full" />
            </div>
            <div className="flex justify-between text-[11px] text-gray-400 mt-2">
              <span>مستكشف المدارات</span>
              <span className="text-violet-400">3,120 / 5,000 XP</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-start gap-3 bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 w-full text-right" dir="rtl">
          <span className="text-2xl">🔥</span>
          <div>
            <div className="text-sm font-bold text-white">
              ستريك 13 يوم!
            </div>
            <div className="text-xs text-gray-400">درست البارحة أيضاً</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    num: "03",
    title: "تنافس وارتقِ في الرانكات",
    desc: "شوف موقعك على المتصدرين، تحدى أصحابك، وارتقِ من مستكشف إلى سيّد المجرة.",
    visual: (
      <div className="flex flex-col w-full text-right" dir="rtl">
        <div className="text-xs text-gray-400 mb-2 text-center">أهم المتصدرين هذا الأسبوع</div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <span className="text-sm font-bold text-amber-500 w-4 text-center">1</span>
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-500 shrink-0">SA</div>
            <span className="flex-1 text-sm text-gray-300">سارة ك.</span>
            <span className="text-xs font-bold text-amber-500">4,890 XP</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-violet-600/10 border border-violet-600/30 rounded-xl">
            <span className="text-sm font-bold text-violet-400 w-4 text-center">4</span>
            <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center text-xs font-bold text-violet-400 shrink-0">YO</div>
            <span className="flex-1 text-sm font-bold text-violet-400">أنت</span>
            <span className="text-xs font-bold text-violet-400">3,120 XP</span>
          </div>
          <div className="text-xs text-gray-400 p-2 bg-white/5 rounded-xl text-center mt-1">
            240 XP للوصول للمركز الثالث — ابدأ جلسة 🚀
          </div>
          <div className="flex gap-2 flex-wrap mt-2">
            <span className="text-[11px] px-3 py-1 rounded-full bg-violet-600/10 border border-violet-600/30 text-violet-400">
              ⬡ مستكشف المدارات
            </span>
            <span className="text-[11px] px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400">
              → ملاّح النجوم
            </span>
          </div>
        </div>
      </div>
    ),
  },
  {
    num: "04",
    title: "حلل تقدمك وتحسّن",
    desc: "شوف heatmap أسبوعك، افهم أي وقت تركيزك أفضل، وعدّل عاداتك بناءً على بيانات حقيقية.",
    visual: (
      <div className="flex flex-col w-full text-right" dir="rtl">
        <div className="text-xs text-gray-400 mb-2 text-center">خريطة تركيز الأسبوع</div>
        <div className="grid grid-cols-7 gap-1 flex-1 mb-4">
          <div className="text-center text-[10px] text-gray-500 mb-1">أ</div>
          <div className="text-center text-[10px] text-gray-500 mb-1">إ</div>
          <div className="text-center text-[10px] text-gray-500 mb-1">ث</div>
          <div className="text-center text-[10px] text-gray-500 mb-1">أ</div>
          <div className="text-center text-[10px] text-gray-500 mb-1">خ</div>
          <div className="text-center text-[10px] text-gray-500 mb-1">ج</div>
          <div className="text-center text-[10px] text-gray-500 mb-1">س</div>
          
          <div className="h-10 rounded bg-violet-600/70" />
          <div className="h-10 rounded bg-violet-600/40" />
          <div className="h-10 rounded bg-violet-600/90" />
          <div className="h-10 rounded bg-violet-600/20" />
          <div className="h-10 rounded bg-violet-600/60" />
          <div className="h-10 rounded bg-violet-600/80" />
          <div className="h-10 rounded bg-white/5" />
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <div className="flex justify-between text-[11px] text-gray-400 mb-1 w-full">
              <span>رياضيات</span>
              <span className="text-blue-400">42%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full w-full">
              <div className="h-full bg-blue-500 rounded-full w-[42%]" />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[11px] text-gray-400 mb-1 w-full">
              <span>فيزياء</span>
              <span className="text-violet-400">35%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full w-full">
              <div className="h-full bg-violet-600 rounded-full w-[35%]" />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[11px] text-gray-400 mb-1 w-full">
              <span>كيمياء</span>
              <span className="text-emerald-400">23%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full w-full">
              <div className="h-full bg-emerald-500 rounded-full w-[23%]" />
            </div>
          </div>
        </div>
        <div className="bg-violet-600/10 border border-violet-600/20 rounded-xl p-2 text-xs text-gray-400 text-center mt-3">
          💡 أفضل أوقات التركيز: <span className="text-white">8–10 مساءً</span>
        </div>
      </div>
    ),
  },
];

export default function LandingPage({ onLogin }: { onLogin: () => void }) {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="min-h-screen bg-[#06060f] text-[#f0eeff] font-sans selection:bg-violet-500/30 overflow-x-hidden relative" dir="ltr">
      <StarBackground />
      
      {/* NavBar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-xl bg-[#06060f]/60 border-b border-white/5 text-left">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-8 h-8">
            <div className="absolute inset-0 border-2 border-indigo-500/30 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-transparent border-t-indigo-400 border-l-fuchsia-400 rounded-full animate-[spin_4s_linear_infinite]"></div>
            <div className="absolute inset-1 border-2 border-transparent border-b-cyan-400 border-r-indigo-400 rounded-full animate-[spin_3s_linear_infinite_reverse]"></div>
            <div className="absolute w-2 h-2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] z-10" />
          </div>
          <div className="font-display font-black tracking-widest text-[22px]">
            ORBIT<span className="text-fuchsia-400">X</span>
          </div>
        </div>
        <ul className="hidden md:flex gap-8 text-[13px] text-[#5c5a72]" dir="rtl">
          <li><a href="#features" className="hover:text-white transition-colors">المميزات</a></li>
          <li><a href="#how" className="hover:text-white transition-colors">كيف يعمل</a></li>
        </ul>
        <button
          onClick={onLogin}
          className="bg-violet-600 hover:bg-violet-500 px-6 py-2.5 rounded-xl text-[13px] font-bold transition-all shadow-lg shadow-violet-600/20 hover:-translate-y-0.5"
        >
          ابدأ الرحلة
        </button>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center text-center px-6 pt-32 pb-20 overflow-hidden z-10">
        {/* Animated Blobs */}
        <div className="absolute w-[600px] h-[600px] bg-violet-600/20 blur-[100px] rounded-full top-[-100px] left-1/2 -translate-x-1/2 opacity-70 animate-pulse pointer-events-none" style={{ animationDuration: '4s' }} />
        <div className="absolute w-[400px] h-[400px] bg-fuchsia-400/10 blur-[100px] rounded-full bottom-0 right-[10%] opacity-70 pointer-events-none" />
        <div className="absolute w-[300px] h-[300px] bg-indigo-500/10 blur-[100px] rounded-full bottom-[10%] left-[5%] opacity-70 pointer-events-none" />
        
        {/* Orbit Rings Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-[500px] h-[500px] rounded-full border border-violet-500/10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          <div className="w-[720px] h-[720px] rounded-full border border-violet-500/5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          <div className="w-[960px] h-[960px] rounded-full border border-violet-500/5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="relative z-10 max-w-[860px] flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-violet-600/10 border border-violet-600/30 rounded-full px-4 py-1.5 text-xs text-violet-300 font-bold tracking-widest mb-8"
          >
            <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse shadow-[0_0_8px_theme(colors.violet.400)]" />
            منصة الدراسة التفاعلية
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-[clamp(48px,8vw,96px)] font-black font-display leading-[1.05] tracking-tight mb-8"
          >
            <span className="block text-white">ادرس بشغف،</span>
            <span className="block bg-gradient-to-br from-violet-300 to-fuchsia-400 text-transparent bg-clip-text">
              كأنك خُلقت لهذا.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-[#5c5a72] max-w-[560px] leading-relaxed mb-12"
            dir="rtl"
          >
            حوّل كل جلسة دراسية إلى <strong>نقاط خبرة، رتب، وسلاسل متتالية.</strong> تنافس مع الطلاب حول العالم. ابنِ عادة التركيز التي تدوم فعلاً.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-4 flex-wrap justify-center"
            dir="rtl"
          >
            <button
              onClick={onLogin}
              className="bg-violet-600 hover:bg-violet-500 rounded-2xl px-10 py-4 text-[15px] font-bold text-white shadow-[0_0_40px_rgba(124,58,237,0.4)] hover:shadow-[0_0_60px_rgba(124,58,237,0.6)] transition-all hover:-translate-y-0.5"
            >
              ابدأ رحلتك — مجاناً
            </button>
            <button
              onClick={() => {
                 document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-transparent border border-white/10 hover:border-white/20 rounded-2xl px-8 py-4 text-[15px] text-gray-400 hover:text-white transition-all flex items-center gap-2"
            >
              <Play className="w-4 h-4" /> جولة سريعة
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex items-center justify-center gap-6 md:gap-12 mt-20"
            dir="rtl"
          >
            <div className="text-center">
              <div className="text-3xl font-display font-bold text-white"><CountUp target={48} suffix="K+" /></div>
              <div className="text-xs text-[#5c5a72] mt-1 tracking-wider uppercase">طالب نشط</div>
            </div>
            <div className="w-px h-10 bg-white/5" />
            <div className="text-center">
              <div className="text-3xl font-display font-bold text-white"><CountUp target={2.1} suffix="M" /></div>
              <div className="text-xs text-[#5c5a72] mt-1 tracking-wider uppercase">ساعة تركيز</div>
            </div>
            <div className="w-px h-10 bg-white/5 hidden sm:block" />
            <div className="text-center hidden sm:block">
              <div className="text-3xl font-display font-bold text-white"><CountUp target={94} suffix="%" /></div>
              <div className="text-xs text-[#5c5a72] mt-1 tracking-wider uppercase">تحسن بالاستمرارية</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mock Thumbnail */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="relative z-10 px-6 pb-24 flex justify-center -mt-10"
      >
        <div className="absolute top-[-60px] left-1/2 -translate-x-1/2 w-[800px] h-[200px] bg-violet-600/20 blur-[100px] pointer-events-none rounded-[100%]" />
        
        <div className="w-full max-w-[900px] bg-[#0b0b1a]/80 border border-violet-600/20 rounded-3xl backdrop-blur-2xl shadow-2xl relative overflow-hidden" dir="rtl">
          {/* Header */}
          <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5 bg-white/5" dir="ltr">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <div className="flex-1 text-center bg-white/5 border border-white/10 rounded-md py-1 text-[11px] text-[#5c5a72] mx-4 font-mono">
              app.orbitx.study — Dashboard
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-5 min-h-[260px]">
            {/* Sidebar */}
            <div className="hidden md:flex flex-col gap-2 bg-white/5 border border-white/5 rounded-xl p-4 text-right">
              <div className="font-display font-black tracking-widest text-[14px] mb-3 text-violet-300 px-3" dir="ltr">
                ORBIT<span className="text-fuchsia-400">X</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-600/15 border-r-2 border-violet-600 text-[11px] text-violet-300 font-bold">
                اللوحة الرئيسية
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] text-[#5c5a72]">
                التركيز المباشر
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] text-[#5c5a72]">
                المتصدرون
              </div>
              <div className="flex-1" />
              <div className="bg-violet-600/10 border border-violet-600/20 rounded-xl p-3">
                <div className="text-[9px] text-[#5c5a72]">الرتبة الحالية</div>
                <div className="text-[11px] text-violet-300 font-bold mt-1">⬡ مستكشف المدارات</div>
              </div>
            </div>
            
            {/* Main */}
            <div className="flex flex-col gap-4 text-right">
              <div className="bg-violet-600/10 border border-violet-600/20 rounded-xl px-5 py-4 flex justify-between items-center">
                <div>
                  <div className="text-[13px] font-bold text-white mb-1">142 XP للوصول إلى ملاّح النجوم</div>
                  <div className="text-[10px] text-gray-400">🔥 ستريك 12 يوم — حافظ عليه</div>
                </div>
                <div className="bg-violet-600 rounded-lg px-4 py-2 text-[11px] font-bold text-white shadow-lg shadow-violet-600/20">
                  ابدأ الجلسة ←
                </div>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                  <div className="text-[16px] font-bold text-white">1س 24د</div>
                  <div className="text-[9px] text-gray-400 mt-1">تركيز اليوم</div>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                  <div className="text-[16px] font-bold text-violet-400">680 XP</div>
                  <div className="text-[9px] text-gray-400 mt-1">مكتسب اليوم</div>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                  <div className="text-[16px] font-bold text-orange-400">🔥 12</div>
                  <div className="text-[9px] text-gray-400 mt-1">يوم ستريك</div>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                  <div className="text-[16px] font-bold text-white">#4</div>
                  <div className="text-[9px] text-gray-400 mt-1">الترتيب العالمي</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center min-h-[140px]">
                  <div className="text-[13px] text-gray-400 mb-4">مؤقت التركيز النشط</div>
                  <div className="relative w-16 h-16">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                      <circle cx="32" cy="32" r="28" fill="none" stroke="#7c3aed" strokeWidth="4" strokeDasharray="175.9" strokeDashoffset="50" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white" dir="ltr">25:00</div>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                  <div className="text-[11px] text-gray-400 mb-3"> المتصدرون الأسبوعي</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="text-[10px] text-gray-500 w-6">4.8K</div>
                      <div className="flex-1 h-1 bg-white/5 rounded-full"><div className="w-[100%] h-full bg-amber-500 rounded-full float-right" /></div>
                      <div className="w-8 text-[10px] text-amber-500 font-bold truncate text-left" dir="ltr">Sara</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-[10px] text-gray-500 w-6">4.0K</div>
                      <div className="flex-1 h-1 bg-white/5 rounded-full"><div className="w-[82%] h-full bg-slate-400 rounded-full float-right" /></div>
                      <div className="w-8 text-[10px] text-slate-400 font-bold truncate text-left" dir="ltr">Mo</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-[10px] text-violet-400 w-6">3.1K</div>
                      <div className="flex-1 h-1 bg-white/5 rounded-full"><div className="w-[64%] h-full bg-violet-600 rounded-full float-right" /></div>
                      <div className="w-8 text-[10px] text-violet-400 font-bold truncate text-left" dir="ltr">أنت</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Features */}
      <section id="features" className="py-24 px-6 relative z-10 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-14 text-right flex flex-col items-center"
          dir="rtl"
        >
          <div className="inline-flex items-center gap-2 font-bold text-[11px] text-violet-400 tracking-[0.12em] mb-4">
            <div className="w-6 h-px bg-violet-400" />
            لماذا OrbitX
          </div>
          <h2 className="text-[clamp(32px,5vw,56px)] font-black font-display leading-[1.05] tracking-tight mb-4 text-center">
            كل شيء مصمم <span className="bg-gradient-to-r from-violet-300 to-fuchsia-400 text-transparent bg-clip-text">لتبقيك في المدار.</span>
          </h2>
          <p className="text-[#5c5a72] text-[17px] leading-relaxed text-center">
            ستة أنظمة تعمل معاً حتى لا تفقد زخمك، حتى في أسوأ أيامك الدراسية.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border border-white/5 rounded-3xl overflow-hidden bg-[#0b0b1a]/60 backdrop-blur-sm" dir="rtl">
          {[
             { title: "نظام XP", desc: "كل دقيقة تدرسها = XP حقيقي. تقدمك مرئي، ملموس، وما بيكذب.", icon: "⚡", tag: "تطور يومي", color: "text-violet-400", bg: "bg-violet-500/10", border: 'border-white/5 border-b border-l' },
             { title: "جلسات التركيز", desc: "Pomodoro مع موسيقى تركيز، بدون إشعارات، وبتاخذ XP مضاعف.", icon: "🎯", tag: "عمل عميق", color: "text-fuchsia-400", bg: "bg-fuchsia-400/10", border: 'border-white/5 border-b border-l' },
             { title: "محرك الستريك", desc: "كل يوم بتدرس يعزز الستريك. خسارة الستريك تحرك الناس أكثر من أي مكافأة.", icon: "🔥", tag: "استمرارية", color: "text-orange-400", bg: "bg-orange-500/10", border: 'border-white/5 border-b lg:border-l-0 border-l' },
             { title: "المتصدرون", desc: "تنافس مع طلاب من نفس مدرستك أو حول العالم. الأرقام ما بتكذب.", icon: "🏆", tag: "منافسة أسبوعية", color: "text-amber-500", bg: "bg-amber-500/10", border: 'border-white/5 lg:border-b-0 border-b border-l' },
             { title: "تحليل التقدم", desc: "Heatmap أسبوعي، توزيع المواد، أفضل أوقات تركيزك — كل شيء واضح.", icon: "📊", tag: "إحصائيات دقيقة", color: "text-emerald-500", bg: "bg-emerald-500/10", border: 'border-white/5 border-b-0 border-l' },
             { title: "المجموعات الدراسية", desc: "أنشئ مجموعة مع أصحابك. XP جماعي، تحديات مشتركة، تقدم مرئي للكل.", icon: "👥", tag: "قريباً", color: "text-indigo-400", bg: "bg-indigo-500/10", border: 'border-transparent' },
          ].map((f, i) => (
             <motion.div
               key={i}
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: i * 0.1 }}
               className={`p-10 relative group hover:bg-violet-600/5 transition-colors ${f.border}`}
             >
               <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-5 ${f.bg}`}>{f.icon}</div>
               <h3 className="font-display font-bold text-[18px] text-white mb-2">{f.title}</h3>
               <p className="text-[14px] text-[#5c5a72] leading-relaxed mb-6">{f.desc}</p>
               <span className={`inline-block text-[11px] px-3 py-1 rounded-full border border-current bg-opacity-10 ${f.color} shadow-sm`}>{f.tag}</span>
             </motion.div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section id="how" className="py-24 px-6 relative z-10 max-w-6xl mx-auto" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 font-bold text-[11px] text-violet-400 tracking-[0.12em] mb-4">
            <div className="w-6 h-px bg-violet-400" />
            كيف يعمل
          </div>
          <h2 className="text-[clamp(32px,5vw,56px)] font-black font-display leading-[1.05] tracking-tight mb-14">
            من الجلسة الأولى<br />
            <span className="bg-gradient-to-l from-violet-300 to-fuchsia-400 text-transparent bg-clip-text">لأول رانك.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-start">
          <div className="flex flex-col">
            {steps.map((step, i) => (
              <div
                key={i}
                onClick={() => setActiveStep(i)}
                className={`flex gap-6 py-7 border-b border-white/5 cursor-pointer transition-all group ${activeStep === i ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}
              >
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full border flex items-center justify-center font-display font-bold text-[13px] transition-all ${
                    activeStep === i 
                      ? 'bg-violet-600 border-violet-600 text-white shadow-[0_0_20px_rgba(124,58,237,0.5)]' 
                      : 'border-white/10 text-gray-500'
                  }`}>
                    {step.num}
                  </div>
                  {i < steps.length - 1 && <div className="w-px h-full bg-white/5 my-2 min-h-[30px]" />}
                </div>
                <div className="pt-1.5 flex-1 text-right">
                  <h3 className={`font-display font-bold text-[16px] mb-2 ${activeStep === i ? 'text-white' : 'text-gray-400'}`}>
                    {step.title}
                  </h3>
                  <div 
                    className={`text-[14px] text-[#5c5a72] leading-relaxed overflow-hidden transition-all duration-400 ${
                      activeStep === i ? 'max-h-32 opacity-100 mt-2' : 'max-h-0 opacity-0'
                    }`}
                  >
                    {step.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden lg:flex items-center justify-center bg-[#0b0b1a]/80 border border-violet-600/20 rounded-3xl min-h-[380px] p-8 overflow-hidden sticky top-32">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full flex justify-center"
            >
              {steps[activeStep].visual}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 relative z-10 max-w-6xl mx-auto" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-14 flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 font-bold text-[11px] text-violet-400 tracking-[0.12em] mb-4">
            <div className="w-6 h-px bg-violet-400" />
            أصوات الطلاب
          </div>
          <h2 className="text-[clamp(32px,5vw,56px)] font-black font-display leading-[1.05] tracking-tight">
            طلاب غيّروا<br />
            <span className="bg-gradient-to-r from-violet-300 to-fuchsia-400 text-transparent bg-clip-text">روتينهم للأبد.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
             { text: "كنت ما أقدر أركز أكثر من 20 دقيقة. بعد أسبوع على OrbitX صار عندي ستريك 19 يوم وما صدقت حالي.", name: "سارة الأحمد", meta: "طالبة طب · السنة الثانية", rank: "⭐ ملاّح النجوم", av: "سا", color: "text-violet-400", bg: "bg-violet-600/15", border: "border-violet-600/30" },
             { text: "المنافسة مع أصحابي على المتصدرين خلّتني أدرس ضعف ما كنت أدرس. والـ XP system ذكي جداً.", name: "محمد الزهراني", meta: "طالب هندسة · السنة الثالثة", rank: "🏆 الأول بالمدرسة", av: "مح", color: "text-amber-500", bg: "bg-amber-500/15", border: "border-amber-500/30" },
             { text: "أخيراً تطبيق بيفهم إن الطالب محتاج motivation مو بس reminder. الـ streak system غيّر حياتي.", name: "لانا المصري", meta: "طالبة علوم حاسوب", rank: "🌟 عالمة كونية", av: "لا", color: "text-fuchsia-400", bg: "bg-fuchsia-400/15", border: "border-fuchsia-400/30" },
          ].map((t, i) => (
             <motion.div
               key={i}
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: i * 0.1 }}
               className={`bg-[#0b0b1a]/70 border border-white/5 rounded-2xl p-8 relative overflow-hidden group hover:${t.border} hover:-translate-y-1 transition-all text-right`}
             >
               <div className="absolute top-2 right-4 text-6xl font-display font-black text-violet-600/10 leading-none">"</div>
               <div className="text-amber-500 text-[13px] mb-4 tracking-widest text-left" dir="ltr">★★★★★</div>
               <p className="text-[14px] text-gray-300 leading-relaxed mb-6 relative z-10">{t.text}</p>
               <div className="flex items-center gap-3">
                 <div className={`w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-xs shrink-0 ${t.bg} ${t.color}`}>{t.av}</div>
                 <div>
                   <div className="font-bold text-[13px] text-white">{t.name}</div>
                   <div className="text-[11px] text-gray-500 mt-1">{t.meta}</div>
                 </div>
               </div>
               <div className={`absolute bottom-6 left-6 text-[11px] px-3 py-1 rounded-full bg-opacity-10 shadow-sm border border-current ${t.bg} ${t.color} whitespace-nowrap`}>
                 {t.rank}
               </div>
             </motion.div>
          ))}
        </div>
      </section>

      {/* CTA section */}
      <section className="py-32 px-6 relative z-10 text-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-violet-600/15 blur-[100px] pointer-events-none rounded-[100%]" />
        
        <div className="max-w-[760px] mx-auto bg-[#0b0b1a]/90 border border-violet-600/20 rounded-[32px] p-12 md:p-20 relative overflow-hidden shadow-2xl backdrop-blur-xl" dir="rtl">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-transparent pointer-events-none" />
          
          <div className="inline-flex items-center justify-center gap-2 font-bold text-[11px] text-violet-400 tracking-[0.12em] uppercase mb-6">
            <div className="w-6 h-px bg-violet-400" />
            جاهز للانطلاق؟
          </div>
          
          <h2 className="text-[clamp(32px,5vw,56px)] font-black font-display leading-[1.05] tracking-tight mb-6">
            مدارك بانتظارك.<br />
            <span className="bg-gradient-to-r from-violet-300 to-fuchsia-400 text-transparent bg-clip-text">ابدأ اليوم مجاناً.</span>
          </h2>
          
          <p className="text-[17px] text-[#5c5a72] leading-relaxed mb-10 max-w-lg mx-auto">
            انضم لـ 48,000+ طالب بيبنوا عادات دراسة حقيقية — يوم ورا يوم.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onLogin}
              className="bg-violet-600 hover:bg-violet-500 rounded-2xl px-12 py-5 text-[16px] font-bold text-white shadow-[0_0_40px_rgba(124,58,237,0.4)] hover:shadow-[0_0_60px_rgba(124,58,237,0.6)] transition-all hover:-translate-y-0.5 w-full sm:w-auto"
            >
              ابدأ رحلتك الفضائية
            </button>
          </div>
          
          <div className="text-[12px] text-[#5c5a72] mt-8">
            مجاني 100% · لا يتطلب بطاقة ائتمان · جاهز خلال 30 ثانية
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10 font-sans" dir="rtl">
        <div className="font-display font-black tracking-widest text-[16px] text-left" dir="ltr">
          ORBIT<span className="text-fuchsia-400">X</span>
        </div>
        <div className="flex gap-6 text-[13px] text-[#5c5a72]">
          <a href="#" className="hover:text-white transition-colors">المميزات</a>
          <a href="#" className="hover:text-white transition-colors">عن المنصة</a>
          <a href="#" className="hover:text-white transition-colors">الدعم الفني</a>
        </div>
        <div className="text-[12px] text-[#5c5a72]">
          © 2026 OrbitX. بُنيت للطلاب الذين يدرسون بصدق.
        </div>
      </footer>
    </div>
  );
}

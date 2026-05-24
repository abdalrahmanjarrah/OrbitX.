import React, { useState, useEffect, useRef } from "react";
import { motion, useInView } from "motion/react";
import { Play, Shield, Globe, Award, Target, Zap, Activity, Rocket, Clock } from "lucide-react";
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
    title: "اختر كوكبك وابدأ الجلسة",
    desc: "حدد المادة وكأنك تختار وجهتك في الفضاء. اضبط التايمر، وانطلق. كل دقيقة تُحسب كطاقة لمحرك مركبتك.",
    visual: (
      <div className="flex flex-col items-center gap-4 w-full w-max-md">
        <div className="text-xs text-indigo-300/70 mb-1 tracking-widest font-mono">SYSTEM READY</div>
        <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-3xl p-6 text-center w-full backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 text-6xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-br from-white to-indigo-300 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
            25:00
          </div>
          <div className="text-sm text-indigo-200/60 mt-3 font-mono tracking-widest uppercase">Target: Mathematics</div>
          <div className="mt-5 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl p-3 text-sm font-bold text-white shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:shadow-[0_0_40px_rgba(79,70,229,0.5)] transition-all cursor-pointer">
            🚀 إطلاق المركبة (Start Session)
          </div>
        </div>
      </div>
    ),
  },
  {
    num: "02",
    title: "اجمع الموارد والـ XP",
    desc: "كل جلسة ناجحة تضيف XP لرصيدك. ركز بانتظام لترقية رتبتك وفتح شارات الملاحة الفضائية النادرة.",
    visual: (
      <div className="flex flex-col items-center gap-4 w-full">
        <div className="text-xs text-emerald-400/70 mb-1 font-mono tracking-widest">MISSION ACCOMPLISHED</div>
        <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-3xl p-6 text-center w-full backdrop-blur-xl">
          <div className="text-5xl mb-3 drop-shadow-[0_0_20px_rgba(52,211,153,0.5)]">⚡</div>
          <div className="text-2xl font-bold font-display text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">
            +150 XP
          </div>
          <div className="mt-5 bg-black/40 rounded-xl p-4 border border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent" />
            <div className="relative z-10 flex justify-between text-xs text-gray-400 mb-2">
              <span className="text-emerald-300 font-bold">مستكشف المدارات</span>
              <span className="font-mono">85%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="w-[85%] h-full bg-emerald-500 rounded-full shadow-[0_0_10px_theme(colors.emerald.400)]" />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-start gap-4 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-4 w-full backdrop-blur-xl">
          <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-2xl animate-pulse">🚀</div>
          <div className="text-right flex-1">
            <div className="text-lg font-bold text-indigo-400">ساعات التركيز المعتمدة</div>
            <div className="text-xs text-indigo-200/50">تطور مستمر نحو نجوم المدار</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    num: "03",
    title: "تفوّق في مجرة المتصدرين",
    desc: "أين موقعك في الكون؟ تنافس مع رواد الفضاء الآخرين، واصعد في الرتب حتى تصبح سيّد المجرة.",
    visual: (
      <div className="flex flex-col w-full" dir="rtl">
        <div className="text-xs text-amber-300/70 mb-3 text-center font-mono tracking-widest">GLOBAL LEADERBOARD</div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 p-4 bg-amber-950/40 border border-amber-500/30 rounded-2xl relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
            <span className="text-lg font-black text-amber-500 w-6 text-center drop-shadow-[0_0_10px_theme(colors.amber.500)]">1</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-sm font-bold text-amber-400 border border-amber-500/30">SA</div>
            <span className="flex-1 text-sm font-bold text-gray-200">سارة الأحمد</span>
            <span className="text-sm font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg">4,890 XP</span>
          </div>
          <div className="flex items-center gap-3 p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl relative">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
            <span className="text-lg font-black text-indigo-400 w-6 text-center">4</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-300 border border-indigo-500/30">أنت</div>
            <span className="flex-1 text-sm font-bold text-indigo-300">أنت</span>
            <span className="text-sm font-mono font-bold text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded-lg">3,120 XP</span>
          </div>
        </div>
      </div>
    ),
  },
];

export default function LandingPage({ onLogin }: { onLogin: () => void }) {
  const [activeStep, setActiveStep] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 40,
        y: (e.clientY / window.innerHeight - 0.5) * 40,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-[#05050A] text-[#f0eeff] font-sans selection:bg-indigo-500/30 overflow-x-hidden relative" dir="ltr">
      <StarBackground />
      
      {/* NavBar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5 backdrop-blur-xl bg-[#05050A]/40 border-b border-white/5 disabled-shadow transition-all">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8">
            <div className="absolute inset-0 border-[1.5px] border-indigo-500/30 rounded-full"></div>
            <div className="absolute inset-0 border-[1.5px] border-transparent border-t-indigo-400 border-l-fuchsia-400 rounded-full animate-[spin_3s_linear_infinite]"></div>
            <div className="absolute inset-1 border-[1.5px] border-transparent border-b-cyan-400 border-r-indigo-400 rounded-full animate-[spin_2s_linear_infinite_reverse]"></div>
            <div className="absolute w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,1)] z-10" />
          </div>
          <div className="font-display font-black tracking-[0.2em] text-[20px] text-white">
            ORBIT<span className="text-indigo-400">X</span>
          </div>
        </div>
        <ul className="hidden md:flex gap-10 text-[13px] font-medium tracking-wide text-gray-400" dir="rtl">
          <li><a href="#features" className="hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all">المميزات</a></li>
          <li><a href="#how" className="hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all">كيف العمل</a></li>
        </ul>
        <button
          onClick={onLogin}
          className="relative group bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md px-6 py-2.5 rounded-full text-[13px] font-bold transition-all overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-fuchsia-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute -inset-[100%] group-hover:animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_50%,#8b5cf6_100%)] opacity-0 group-hover:opacity-30 pointer-events-none" />
          <span className="relative z-10">إطلاق النظام</span>
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center text-center px-4 pt-32 pb-20 z-10 overflow-hidden perspective-[1000px]">
        {/* Animated Orbits and Planets */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-1000 ease-out"
          style={{ transform: `translate(calc(-50% + ${mousePos.x * 0.5}px), calc(-50% + ${mousePos.y * 0.5}px)) rotateX(60deg)` }}
        >
          {/* Inner Orbit (Focus) */}
          <div className="w-[500px] sm:w-[600px] h-[500px] sm:h-[600px] rounded-full border border-indigo-500/20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[spin_40s_linear_infinite] shadow-[inset_0_0_40px_rgba(99,102,241,0.05)]">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                <div className="w-16 h-16 bg-indigo-500/10 rounded-full blur-md absolute" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-blue-600 shadow-[0_0_30px_theme(colors.indigo.500)] flex items-center justify-center animate-[spin_5s_linear_infinite_reverse]">
                   <Target size={12} className="text-white/80" />
                </div>
             </div>
          </div>
          {/* Middle Orbit (Focus Time) */}
          <div className="w-[750px] sm:w-[900px] h-[750px] sm:h-[900px] rounded-full border border-cyan-500/10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[spin_60s_linear_infinite_reverse]">
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 flex items-center justify-center">
                <div className="w-20 h-20 bg-cyan-500/10 rounded-full blur-md absolute" />
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-600 shadow-[0_0_40px_theme(colors.cyan.500)] flex items-center justify-center animate-[spin_10s_linear_infinite_reverse]">
                   <Zap size={16} className="text-white/80" />
                </div>
             </div>
          </div>
          {/* Outer Orbit (XP/Leaderboard) */}
          <div className="w-[1000px] sm:w-[1300px] h-[1000px] sm:h-[1300px] rounded-full border border-fuchsia-500/5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[spin_90s_linear_infinite]">
             <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                <div className="w-24 h-24 bg-fuchsia-500/10 rounded-full blur-md absolute" />
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-fuchsia-400 to-purple-700 shadow-[0_0_50px_theme(colors.fuchsia.500)] flex items-center justify-center animate-[spin_15s_linear_infinite]">
                   <Award size={20} className="text-white/80" />
                </div>
             </div>
          </div>
        </div>

        <div 
          className="relative z-10 max-w-[900px] mx-auto flex flex-col items-center transition-transform duration-1000 ease-out"
          style={{ transform: `translate(${-mousePos.x}px, ${-mousePos.y}px)` }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="inline-flex items-center gap-2 bg-[#0a0f25]/80 backdrop-blur-md border border-indigo-500/30 rounded-full px-5 py-2 text-xs text-indigo-300 font-bold tracking-widest mb-10 shadow-[0_0_30px_rgba(99,102,241,0.2)]"
            dir="rtl"
          >
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse shadow-[0_0_10px_theme(colors.indigo.400)]" />
            مركبتك جاهزة للإقلاع
            <div className="w-px h-4 bg-white/10 mx-2" />
            <span className="text-gray-400 font-mono">v2.0</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="text-[clamp(40px,7vw,85px)] font-black font-display leading-[1.1] tracking-tight mb-8 drop-shadow-2xl"
          >
            <span className="block text-white mb-2">ليست منصة دراسة...</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-rose-400 animate-[gradient_8s_ease_infinite] bg-[length:200%_200%]">
              بل نظام تشغيل للتركيز.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-gray-400 max-w-[650px] leading-relaxed mb-14 drop-shadow-lg"
            dir="rtl"
          >
            حوّل جلساتك الدراسية إلى رحلة فضائية غامرة. راكم ساعات التركيز الفعلي، وارتقِ بمستواك وعزز انضباطك المداري مع زملائك في الزمن الحقيقي.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center gap-5 justify-center w-full sm:w-auto"
            dir="rtl"
          >
            <button
              onClick={onLogin}
              className="group relative w-full sm:w-auto overflow-hidden bg-gradient-to-r from-indigo-600 to-fuchsia-600 rounded-full px-10 py-4 md:py-5 text-[16px] md:text-[18px] font-bold text-white shadow-[0_0_40px_rgba(99,102,241,0.5)] transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(99,102,241,0.7)]"
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10 flex items-center justify-center gap-3">
                <Rocket className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                ابدأ رحلتك الآن
              </span>
            </button>
            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto bg-[#0a0f25]/50 backdrop-blur-md border border-white/10 hover:border-white/30 rounded-full px-8 py-4 md:py-5 text-[16px] text-gray-300 hover:text-white transition-all flex items-center justify-center gap-2 group"
            >
              <Play className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300 transition-colors" /> استكشف النظام
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-20 md:mt-32 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 border-t border-white/10 pt-10"
            dir="rtl"
          >
            <div className="text-center group">
              <div className="text-3xl md:text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 group-hover:from-indigo-400 group-hover:to-fuchsia-400 transition-all">
                <CountUp target={48} suffix="K+" />
              </div>
              <div className="text-[10px] md:text-xs text-indigo-300/70 mt-2 font-mono tracking-widest">رواد نشطون</div>
            </div>
            <div className="text-center group">
              <div className="text-3xl md:text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 group-hover:from-indigo-400 group-hover:to-fuchsia-400 transition-all">
                <CountUp target={2.1} suffix="M" />
              </div>
              <div className="text-[10px] md:text-xs text-indigo-300/70 mt-2 font-mono tracking-widest">ساعات طيران</div>
            </div>
            <div className="text-center group">
              <div className="text-3xl md:text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 group-hover:from-indigo-400 group-hover:to-fuchsia-400 transition-all">
                <CountUp target={94} suffix="%" />
              </div>
              <div className="text-[10px] md:text-xs text-indigo-300/70 mt-2 font-mono tracking-widest">تحسن بالاستمرارية</div>
            </div>
            <div className="text-center group">
              <div className="text-3xl md:text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 group-hover:from-indigo-400 group-hover:to-fuchsia-400 transition-all">
                <CountUp target={12} suffix="" />
              </div>
              <div className="text-[10px] md:text-xs text-indigo-300/70 mt-2 font-mono tracking-widest">رتبة استكشافية</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 relative z-10 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center max-w-3xl mx-auto mb-20 text-right flex flex-col items-center"
          dir="rtl"
        >
          <div className="inline-flex items-center gap-3 font-mono text-[12px] text-indigo-400 tracking-[0.2em] mb-6 uppercase">
            <span className="w-8 h-px bg-indigo-500/50" />
            أنظمة المركبة
            <span className="w-8 h-px bg-indigo-500/50" />
          </div>
          <h2 className="text-[clamp(32px,4vw,48px)] font-black font-display leading-[1.1] tracking-tight mb-6 text-center">
            توقف عن الدراسة بالطريقة التقليدية.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">ادخل عصر الدراسة المعززة.</span>
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed text-center max-w-2xl">
            كل نظام في OrbitX مصمم لجعلك مدمناً على الإنجاز. لا مجال للتشتت حين تطلق العنان لقواك المدارية وتراكم ساعات تركيزك الفعلي.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" dir="rtl">
          {[
            { title: "نظام XP المتقدم", desc: "حول تركيزك لنقاط خبرة ملموسة تُحدث فرقاً في مستواك المجري.", icon: <Award className="w-6 h-6"/>, tag: "ترقية مستمرة", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
            { title: "ساعات التركيز المعتمدة", desc: "راكم ساعات طيران مخصصة للدراسة. الدقائق تترجم مباشرة لتقدم مستدام في رصيدك.", icon: <Clock className="w-6 h-6"/>, tag: "أثر مستدام", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
            { title: "تحديات المدار", desc: "مهام يومية وأسبوعية تفتح لك شارات خاصة وأندر الإنجازات.", icon: <Target className="w-6 h-6"/>, tag: "مكافآت حصرية", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
            { title: "المتصدرون (Leaderboards)", desc: "تنافس مع صفوة العقول في المجرة. أثبت أنك الأكثر تركيزاً وإنتاجية.", icon: <Globe className="w-6 h-6"/>, tag: "منافسة شرسة", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
            { title: "ردار التحليلات", desc: "خريطة حرارية (Heatmap) توضح أفضل أوقات تركيزك وتوزيع جهدك.", icon: <Activity className="w-6 h-6"/>, tag: "بيانات حقيقية", color: "text-fuchsia-400", bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/20" },
            { title: "حماية ضد التشتت", desc: "تصميم داكن عالي التباين، بدون إعلانات، وبيئة تجبرك على التركيز العميق.", icon: <Shield className="w-6 h-6"/>, tag: "Focus Mode", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`p-8 rounded-3xl bg-[#0a0f25]/40 backdrop-blur-xl border border-white/5 hover:${f.border} hover:bg-[#0a0f25]/80 transition-all group overflow-hidden relative`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700 ease-out" />
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${f.bg} ${f.color} group-hover:scale-110 transition-transform duration-500`}>
                {f.icon}
              </div>
              <h3 className="font-display font-black text-[22px] text-white mb-3 tracking-tight">{f.title}</h3>
              <p className="text-gray-400 leading-relaxed mb-6">{f.desc}</p>
              <span className={`inline-flex items-center text-[11px] font-mono tracking-wider uppercase px-3 py-1.5 rounded-full border ${f.bg} ${f.border} ${f.color}`}>
                __{f.tag}
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it Works / Interactive Demo */}
      <section id="how" className="py-32 px-6 relative z-10 max-w-7xl mx-auto" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-right"
        >
          <div className="inline-flex items-center gap-3 font-mono text-[12px] text-fuchsia-400 tracking-[0.2em] mb-4 uppercase">
            <span className="w-8 h-px bg-fuchsia-500/50" />
            بروتوكول التشغيل
          </div>
          <h2 className="text-[clamp(32px,5vw,56px)] font-black font-display leading-[1.05] tracking-tight mb-16">
            من الجلسة الأولى<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-fuchsia-400 to-rose-400">لأعلى رتبة فضائية.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-12 lg:gap-20 items-center">
          <div className="flex flex-col gap-2">
            {steps.map((step, i) => (
              <div
                key={i}
                onMouseEnter={() => setActiveStep(i)}
                onClick={() => setActiveStep(i)}
                className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 border-l-[3px] ${
                  activeStep === i 
                    ? 'bg-[#0a0f25]/80 border-indigo-500 shadow-xl' 
                    : 'bg-transparent border-transparent hover:bg-white/5 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className={`font-mono text-xl font-bold ${activeStep === i ? 'text-indigo-400' : 'text-gray-600'}`}>
                    {step.num}
                  </div>
                  <h3 className={`font-display font-bold text-[18px] ${activeStep === i ? 'text-white' : 'text-gray-400'}`}>
                    {step.title}
                  </h3>
                </div>
                <div 
                  className={`text-[15px] text-gray-400 leading-relaxed overflow-hidden transition-all duration-500 pr-12 ${
                    activeStep === i ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  {step.desc}
                </div>
              </div>
            ))}
          </div>

          <div className="relative flex items-center justify-center p-8 bg-[#05050A]/50 border border-white/10 rounded-[3rem] min-h-[500px] overflow-hidden backdrop-blur-3xl shadow-2xl">
            {/* Ambient inner glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-fuchsia-500/5" />
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="w-full max-w-md relative z-10"
            >
              {steps[activeStep].visual}
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-32 px-6 relative z-10 text-center overflow-hidden h-screen flex items-center justify-center">
        {/* Massive dramatic glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-b from-indigo-600/20 to-fuchsia-600/20 blur-[150px] pointer-events-none rounded-full" />
        
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-[800px] mx-auto relative z-10" 
          dir="rtl"
        >
          <div className="inline-flex items-center justify-center gap-3 font-mono text-[12px] text-white tracking-[0.3em] uppercase mb-8">
            <span className="w-12 h-px bg-white/30" />
            استعد للإقلاع
            <span className="w-12 h-px bg-white/30" />
          </div>
          
          <h2 className="text-[clamp(40px,7vw,80px)] font-black font-display leading-[1.1] tracking-tight mb-8">
            جاهز لترك المجرة القديمة؟<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-white">ابنِ إمبراطوريتك الدراسية.</span>
          </h2>
          
          <p className="text-[18px] md:text-[22px] text-gray-300 leading-relaxed mb-12 max-w-2xl mx-auto">
            انضم لآلاف الرواد الذين غيروا مفهوم الإنتاجية للأبد. مجاني، خالي من التشتت، ومليء بالتطور.
          </p>
          
          <button
            onClick={onLogin}
            className="group relative overflow-hidden bg-white rounded-full px-12 py-5 text-[18px] font-black text-black shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(255,255,255,0.6)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative z-10 flex items-center justify-center gap-3">
              <Rocket className="w-6 h-6 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
              ابدأ الآن — إنها مجانية
            </span>
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10 bg-black/50 backdrop-blur-lg" dir="rtl">
        <div className="font-display font-black tracking-[0.2em] text-[18px] text-white text-left" dir="ltr">
          ORBIT<span className="text-indigo-400">X</span>
        </div>
        <div className="text-[13px] text-gray-500 font-mono">
          OrbitX Space Protocol © 2026. Made for focused minds.
        </div>
      </footer>
    </div>
  );
}

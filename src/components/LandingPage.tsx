import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "motion/react";
import {
  Play,
  Shield,
  Globe,
  Award,
  Target,
  Zap,
  Activity,
  Rocket,
  Clock,
  Volume2,
  VolumeX,
  X,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Eye,
  Users,
  AlertTriangle,
  Atom,
  Flame,
  HelpCircle,
  BookOpen,
  Compass,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import StarBackground from "./StarBackground";
import HeroSolarSystem from "./HeroSolarSystem";
import InteractiveSecretGlobe from "./InteractiveSecretGlobe";
import { useLanguage } from "../context/LanguageContext";

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

// Optimized CountUp Component using easing for zero frame drops with cleanup
function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      let active = true;
      const dur = 2000;
      let startTimestamp: number;
      const step = (ts: number) => {
        if (!active) return;
        if (!startTimestamp) startTimestamp = ts;
        const p = Math.min((ts - startTimestamp) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 4); // Quartic ease out
        setCount(Math.floor(ease * target));
        if (p < 1) {
          requestAnimationFrame(step);
        }
      };
      requestAnimationFrame(step);
      return () => {
        active = false;
      };
    }
  }, [isInView, target]);

  return (
    <span ref={ref} className="font-mono">
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function LandingPage({ onLogin }: { onLogin: () => void }) {
  const { lang, isAr, t, toggleLanguage } = useLanguage();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [oscillators, setOscillators] = useState<any[]>([]);

  // Sound Synth matching the theme rules
  const toggleAmbientSound = () => {
    if (isSoundOn) {
      oscillators.forEach((osc) => {
        try {
          osc.stop();
        } catch (e) {}
      });
      setOscillators([]);
      setIsSoundOn(false);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().then(() => {
          audioCtxRef.current = null;
        });
      }
    } else {
      try {
        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc1.type = "sine";
        osc1.frequency.setValueAtTime(75, ctx.currentTime);

        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(76.5, ctx.currentTime);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(120, ctx.currentTime);

        gain.gain.setValueAtTime(0.05, ctx.currentTime);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();

        setOscillators([osc1, osc2]);
        setIsSoundOn(true);
      } catch (e) {
        console.error("Audio Context initialization blocked", e);
      }
    }
  };

  useEffect(() => {
    return () => {
      oscillators.forEach((osc) => {
        try {
          osc.stop();
        } catch (e) {}
      });
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [oscillators]);

  // Handle subtle mouse movements for beautiful depth effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 35,
        y: (e.clientY / window.innerHeight - 0.5) * 35,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // -------------------------------------------------------------
  // SIMULATOR STATE ENGINE (Section 3: Live interactive cockpit simulator)
  // -------------------------------------------------------------
  const [simActive, setSimActive] = useState(false);
  const [simTime, setSimTime] = useState(1500); // 25:00
  const [simXp, setSimXp] = useState(350);
  const [floatingXps, setFloatingXps] = useState<{ id: number; y: number }[]>(
    [],
  );
  const [simAlertActive, setSimAlertActive] = useState(false);
  const [simAlertCountdown, setSimAlertCountdown] = useState(15);
  const [selectedSimStation, setSelectedSimStation] =
    useState("سديم نبتون الهادئ");
  const [simSuccess, setSimSuccess] = useState(false);

  // Auto incremental XP & Ticking timer Simulator loop when active
  useEffect(() => {
    let timerId: any = null;
    if (simActive && simTime > 0 && !simAlertActive) {
      timerId = setInterval(() => {
        setSimTime((prev) => {
          if (prev <= 1) {
            setSimActive(false);
            setSimSuccess(true);
            return 0;
          }
          return prev - 1;
        });

        // Randomly add some XP to show active progression
        if (Math.random() < 0.25) {
          const newId = Date.now();
          setSimXp((prev) => prev + 15);
          setFloatingXps((prev) => [...prev, { id: newId, y: 0 }]);
          setTimeout(() => {
            setFloatingXps((prev) => prev.filter((x) => x.id !== newId));
          }, 1500);
        }
      }, 1000);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [simActive, simTime, simAlertActive]);

  // Siren alert warning timer (Simulation step)
  useEffect(() => {
    let alertTimer: any = null;
    if (simAlertActive) {
      alertTimer = setInterval(() => {
        setSimAlertCountdown((prev) => {
          if (prev <= 1) {
            // Deduct XP to simulate fail penalization
            setSimXp((curr) => Math.max(0, curr - 50));
            setSimAlertActive(false);
            setSimActive(false);
            return 15;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (alertTimer) clearInterval(alertTimer);
    };
  }, [simAlertActive]);

  const toggleSim = () => {
    if (simSuccess) {
      setSimSuccess(false);
      setSimTime(1500);
      setSimXp(350);
    }
    setSimActive(!simActive);
    setSimAlertActive(false);
  };

  const triggerMockDistraction = () => {
    if (!simActive) {
      setSimActive(true);
    }
    setSimAlertCountdown(15);
    setSimAlertActive(true);
  };

  const cancelMockDistraction = () => {
    setSimAlertActive(false);
    setSimAlertCountdown(15);
  };

  const formatSimTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`;
  };

  // -------------------------------------------------------------
  // TIMELINE STEP ENGINE (Section 2)
  // -------------------------------------------------------------
  const [activeTimelineStep, setActiveTimelineStep] = useState(0);
  const timelineSteps = isAr
    ? [
        {
          title: "الحصول على رتبة أول خطوة",
          phase: "البداية الكونية",
          desc: "تقوم بإنشاء حسابك الفضائي الملحمي والتحليق بمقود مركبتك الخالية تماماً من المشتتات والبدء بالتركيز فورياً لتحصيل رتبة أول خطوة.",
          detail: "قفل المشتتات بالكامل وتهيئة رادار التايمر المستدام",
        },
        {
          title: "استكشاف الجولة الفضائية",
          phase: "جولة الاستكشاف",
          desc: "تدخل لتستكشف زوايا النظام الشمسي والمحطات الحية، وتتحكم بترددات التركيز والتفاعل لتدير محركات الإنتاجية بذكاء.",
          detail: "توجيه خطوط الطيران الفعلي ومراقبة الوجود",
        },
        {
          title: "مشاركة المجتمع ومساعدة بعضنا",
          phase: "الاتصال الكوني",
          desc: "تشوف المجتمع وتتعرف على الزملاء والمستشكفين في الأساطيل المتنوعة لتتعاونوا مع بعض لمساعدة بعضكم وكسر حواجز الكسل.",
          detail: "تبادل همم الطيران، تأسيس تحالفات، وتنافس جماعي دافئ",
        },
        {
          title: "تحدي الثقب الأسود والجوائز",
          phase: "البلورة والجوائز",
          desc: "تنضم لتحدي الثقب الأسود لجمع أثمن الساعات والمحافظة على الانضباط لتكسبوا أنبل المكافآت الأسبوعية القيمة.",
          detail:
            "أقوى الجوائز الاستثنائية والقلائد لرواد الفضاء بنهاية كل أسبوع",
        },
      ]
    : [
        {
          title: "Earn Orbit rank 'First Step'",
          phase: "Cosmic Initiation",
          desc: "Create your epic space coordinates, mount the cockpit fully isolated from any distractions, and initiate focusing to unlock your first rank.",
          detail: "Zero-noise environment and steady timer initialization.",
        },
        {
          title: "Explore Active Space Chambers",
          phase: "Voyage & Explore",
          desc: "Descend into solar stations and active chambers, manage focus frequencies, and interact with live cockpit instruments to boost productivity.",
          detail: "Visualize active flights and coordinate live presence.",
        },
        {
          title: "Cosmic Union & Peer Collaboration",
          phase: "Stellar Tether",
          desc: "Meet researchers, designers and students across active fleets, helping one another to shatter procrastination barriers.",
          detail:
            "Exchange energy packets, form persistent alliances, and duel in real-time.",
        },
        {
          title: "Conquer Black Hole Quests & Rewards",
          phase: "Settlement & Crystals",
          desc: "Venture into extreme black hole focus events to retrieve valuable items, maintain absolute discipline, and pull valuable weekly rewards.",
          detail:
            "Weekly black-hole gravity loops, token distributions, and leaderboard titles.",
        },
      ];

  return (
    <div
      className="min-h-screen bg-[#030308] text-[#f1f3fd] font-sans selection:bg-indigo-600/50 overflow-x-hidden relative"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Star Field Background Rendering Layer */}
      <StarBackground />

      {/* Embedded Futuristic Ambient Sound / Particle Animations */}
      <style>{`
        @keyframes subtle-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
        }
        @keyframes cosmic-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.08); }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes aura-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes warning-breathe {
          0%, 100% { background-color: rgba(239, 68, 68, 0.05); border-color: rgba(239, 68, 68, 0.2); }
          50% { background-color: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.5); }
        }
        .animate-subtle-float {
          animation: subtle-float 8s ease-in-out infinite;
        }
        .animate-cosmic-pulse {
          animation: cosmic-pulse 5s ease-in-out infinite;
        }
        .animate-warning-breathe {
          animation: warning-breathe 2s ease-in-out infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.3);
          border-radius: 9px;
        }
      `}</style>

      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[#030308]/60 border-b border-indigo-500/10 transition-all select-none">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo Brand with animated ring */}
          <div className="flex items-center gap-3" dir="ltr">
            <div className="relative flex items-center justify-center w-9 h-9">
              <div className="absolute inset-0 border-[1.5px] border-indigo-500/30 rounded-full" />
              <div className="absolute inset-0 border-[1.5px] border-transparent border-t-indigo-500 border-l-fuchsia-500 rounded-full animate-[spin_4s_linear_infinite]" />
              <div className="absolute inset-1 border-[1.5px] border-transparent border-b-cyan-400 border-r-indigo-400 rounded-full animate-[spin_2.5s_linear_infinite_reverse]" />
              <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,1)] z-10" />
            </div>
            <div className="font-display font-black tracking-[0.2em] text-[19px] text-white">
              ORBIT
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                X
              </span>
            </div>
          </div>

          {/* Nav links */}
          <nav className="hidden lg:flex items-center gap-10">
            {[
              {
                label: isAr ? "بروتوكول العمل" : "Workflow",
                href: "#how-it-works",
              },
              {
                label: isAr ? "عرض المحاكي الحي" : "Interactive Cockpit",
                href: "#simulate-cockpit",
              },
              {
                label: isAr ? "درع الأمن الفضائي" : "Defense Firewall",
                href: "#anti-cheat",
              },
              {
                label: isAr ? "مستودع الوعي" : "Awareness Repository",
                href: "#awareness",
              },
              {
                label: isAr ? "لوحة الضمان" : "Dashboard Metrics",
                href: "#metrics",
              },
            ].map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                className="text-xs font-bold text-gray-400 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-all tracking-wide"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Access Button and Volume Trigger */}
          <div className="flex items-center gap-4">
            {/* Language Selection Button */}
            <button
              onClick={toggleLanguage}
              className="p-2.5 rounded-xl border bg-white/5 border-white/5 text-gray-400 hover:text-white hover:text-indigo-400 transition-all hover:scale-105 flex items-center justify-center gap-1.5"
              title={isAr ? "Switch to English" : "التحويل للعربية"}
            >
              <Globe className="w-4 h-4" />
              <span className="text-[10px] font-mono font-bold leading-none hidden sm:inline">
                {lang === "ar" ? "EN" : "AR"}
              </span>
            </button>

            <button
              onClick={toggleAmbientSound}
              className={cn(
                "p-2.5 rounded-xl border transition-all hover:scale-105",
                isSoundOn
                  ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                  : "bg-white/5 border-white/5 text-gray-400 hover:text-white",
              )}
              title={
                isAr ? "مولد الترددات الكونية" : "Cosmic Frequency Soundwave"
              }
            >
              {isSoundOn ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => setShowLoginModal(true)}
              className="relative group bg-white hover:bg-white/95 text-black font-black px-6 py-2.5 rounded-xl text-xs tracking-wide transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)] flex items-center gap-2 font-sans"
            >
              <Rocket className="w-4 h-4 stroke-[2.5]" />
              <span>{t("common.login", "تسجيل دخول")}</span>
            </button>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------
          SECTION 1: HERO SOLAR SYSTEM SECTION
         ------------------------------------------------------------- */}
      <section className="relative min-h-screen flex items-center justify-center p-6 pt-32 pb-24 z-10 overflow-hidden">
        {/* Absolute Background Planets and Orbits Component */}
        <HeroSolarSystem mousePos={mousePos} />

        {/* Ambient Top Bottom vignette gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030308] via-transparent to-[#030308]/50 pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center text-center">
          {/* Tag status with pilot info */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="inline-flex items-center gap-2.5 bg-indigo-950/40 backdrop-blur-xl border border-indigo-500/30 rounded-full px-5 py-2.5 text-xs text-indigo-300 font-bold tracking-widest mb-8 shadow-[0_0_40px_rgba(99,102,241,0.2)]"
          >
            <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-pulse shadow-[0_0_12px_#6366f1]" />
            {isAr
              ? "بروتوكول البث المداري نشط ومكتمل"
              : "Orbital Broadcast Protocol Active & Synced"}
            <span className="w-px h-4 bg-white/10 mx-1.5" />
            <span className="text-gray-400 font-mono tracking-wider">
              v2.5_SYS_STABLE
            </span>
          </motion.div>

          {/* Gigantic Cinematic Title with smooth split animation */}
          <h1 className="text-[clamp(36px,6.5vw,80px)] font-black leading-[1.1] tracking-tight mb-8 drop-shadow-2xl">
            <span className="block text-white mb-3">
              {isAr
                ? "ليست مجرّد منصة دراسة..."
                : "Not Just Another Focus App..."}
            </span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-l from-indigo-400 via-fuchsia-400 to-cyan-400 drop-shadow-[0_0_30px_rgba(99,102,241,0.1)]">
              {isAr
                ? "بل نظام تشغيل متكامل للإنتاجية العميقة."
                : "An Immersive OS for Deep Intelligence."}
            </span>
          </h1>

          {/* Epic descriptive passage */}
          <p
            className="text-base md:text-xl text-gray-400 max-w-4xl leading-relaxed mb-12"
            dir={isAr ? "rtl" : "ltr"}
          >
            {isAr
              ? "تخلّص من فوضى التشتت والمنصات التقليدية الباهتة. انضم لنظام تشغيل حركي حسي يحوّل ساعات التزامك الفعلي إلى وقود يحرك مجرتك، معزز بحماية نشطة للوجود البشري، مزارع موارد فضائية وسباقات مجتمعية حية."
              : "Banish scattered friction and beige focus checklists. Engage inside a stylized, full-sensory environment that transforms focused hours into warp-speed celestial fuel—complete with real-time active telemetry checks, virtual resource harvesting, and live multiplayer study arena matches."}
          </p>

          {/* Action launcher buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-5 justify-center w-full sm:w-auto relative z-10">
            <button
              onClick={() => setShowLoginModal(true)}
              className="group relative w-full sm:w-auto overflow-hidden bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-600 rounded-2xl px-12 py-4.5 text-sm font-black text-white shadow-[0_0_50px_rgba(99,102,241,0.45)] hover:shadow-[0_0_70px_rgba(99,102,241,0.65)] transition-all hover:scale-[1.03]"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute -inset-[100%] group-hover:animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_50%,#c084fc_100%)] opacity-0 group-hover:opacity-25 pointer-events-none" />
              <span className="relative z-10 flex items-center justify-center gap-3">
                <Rocket className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                {isAr
                  ? "أطلق المركبة وابدأ العمل"
                  : "Ignite Engine & Focus Now"}
              </span>
            </button>

            <button
              onClick={() =>
                document
                  .getElementById("simulate-cockpit")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="w-full sm:w-auto bg-black/40 backdrop-blur-xl border border-white/5 hover:border-white/10 rounded-2xl px-10 py-4.5 text-sm font-bold text-gray-300 hover:text-white transition-all hover:scale-[1.01] flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 text-cyan-400" />
              <span>
                {isAr ? "تجربة وحدة المحاكي الحي" : "Interactive Cockpit Demo"}
              </span>
            </button>
          </div>

          {/* Beautiful mini inline tags */}
          <div className="mt-16 text-[10px] md:text-xs font-mono tracking-widest text-[#a5b4fc]/40 uppercase flex items-center gap-4 flex-wrap justify-center">
            <span>🛡️ NO ADS IN CABIN</span>
            <span className="w-1.5 h-1.5 bg-indigo-500/20 rounded-full" />
            <span>🌌 REALTIME MULTIPLAYER</span>
            <span className="w-1.5 h-1.5 bg-indigo-500/20 rounded-full" />
            <span>🛸 RESOURCE HARVESTING</span>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          SECTION 2: PATH SYSTEM & TIMELINE
         ------------------------------------------------------------- */}
      <section
        id="how-it-works"
        className="py-28 px-6 relative z-10 border-t border-white/5 bg-gradient-to-b from-[#030308] to-[#040410]"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-4">
            <div>
              <div className="inline-flex items-center gap-2.5 font-mono text-xs text-fuchsia-400 tracking-[0.2em] mb-4 uppercase">
                <span className="w-8 h-px bg-fuchsia-500/50" />
                بروتوكول تحصيل رتب الملاحة
              </div>
              <h2 className="text-[clamp(30px,4vw,48px)] font-black leading-tight">
                مسيرتك المهنية <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-fuchsia-400 via-rose-400 to-indigo-400">
                  كمستكشف في خادم المدار.
                </span>
              </h2>
            </div>
            <p className="text-gray-400 text-sm max-w-lg leading-relaxed text-right md:text-left">
              من مرحلة الإطلاق بمستوى مبدئي إلى درجة سيادة وتحالف كامل، هكذا
              يقوم OrbitX بهيكلة إنتاجيتك وصناعة نظام يعزز التركيز بمرور الوقت.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Steps Navigation UI */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {timelineSteps.map((step, idx) => {
                const isActive = activeTimelineStep === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => setActiveTimelineStep(idx)}
                    className={cn(
                      "p-6 rounded-2xl cursor-pointer text-right transition-all duration-300 border-r-4",
                      isActive
                        ? "bg-[#0b0c1c]/80 border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.15)] scale-[1.01]"
                        : "bg-transparent border-transparent hover:bg-white/5 opacity-50 hover:opacity-100",
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono tracking-wider text-indigo-400 font-bold bg-indigo-500/10 px-2.5 py-0.5 rounded-full uppercase">
                        {step.phase}
                      </span>
                      <span className="font-mono text-xs text-gray-400/50 font-black">
                        STEP_0{idx + 1}
                      </span>
                    </div>
                    <h3
                      className={cn(
                        "text-base font-black mb-2 transition-colors",
                        isActive ? "text-white" : "text-gray-400",
                      )}
                    >
                      {step.title}
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed pr-0">
                      {step.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Right Rich Visual Space Node Representation */}
            <div className="lg:col-span-7 bg-[#060713]/80 border border-indigo-500/10 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden min-h-[420px] flex items-center justify-center">
              {/* Animated cyber nodes in backup */}
              <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-500/5 via-indigo-500/5 to-cyan-500/5" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/5 rounded-full filter blur-[100px] animate-pulse" />

              <div className="relative z-10 w-full text-center">
                {/* Simulated Diagnostic Dashboard Graphics */}
                <div className="w-full flex justify-between text-[10px] font-mono text-gray-500 mb-6 border-b border-white/5 pb-3">
                  <span>NODE: 0x89C_SEC</span>
                  <span>SYS_STAGE: READY</span>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTimelineStep}
                    initial={{ opacity: 0, x: -20, filter: "blur(5px)" }}
                    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, x: 20, filter: "blur(5px)" }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-20 h-20 rounded-2xl bg-indigo-950/50 border-2 border-indigo-400/40 flex items-center justify-center text-4xl mb-6 shadow-[0_0_30px_rgba(99,102,241,0.2)] animate-subtle-float">
                      {activeTimelineStep === 0 && "👨‍🚀"}
                      {activeTimelineStep === 1 && "🥕"}
                      {activeTimelineStep === 2 && "⚡"}
                      {activeTimelineStep === 3 && "🚀"}
                    </div>

                    <h4 className="text-xl font-bold font-sans text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200 mb-4 text-center">
                      {timelineSteps[activeTimelineStep].title}
                    </h4>

                    {/* Step Visual interactive blueprint element */}
                    <div className="bg-black/40 border border-white/5 p-4.5 rounded-2xl text-right max-w-md w-full relative">
                      <div className="absolute top-2.5 left-3 text-[8px] font-mono text-indigo-400/60 font-bold uppercase">
                        Active Telemetry
                      </div>
                      <div className="text-[11px] text-gray-400 leading-relaxed mb-3">
                        {timelineSteps[activeTimelineStep].desc}
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-indigo-950/20 border border-indigo-500/10 text-[10px] text-indigo-300 font-mono">
                        <CheckCircle2
                          size={12}
                          className="shrink-0 text-indigo-400"
                        />
                        <span>{timelineSteps[activeTimelineStep].detail}</span>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Simulated Grid Connector */}
                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-4">
                  {timelineSteps.map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        activeTimelineStep === i
                          ? "w-8 bg-gradient-to-r from-indigo-500 to-fuchsia-500"
                          : "w-2.5 bg-white/10",
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          SECTION 3: LIVE STATIONS SIMULATION
         ------------------------------------------------------------- */}
      <section
        id="simulate-cockpit"
        className="py-28 px-6 relative z-10 bg-gradient-to-b from-[#040410] to-[#030308]"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 font-mono text-xs text-cyan-400 tracking-[0.2em] mb-4 uppercase">
              <span className="w-6 h-px bg-cyan-500/50" />
              تفاعل حي مباشر
            </div>
            <h2 className="text-[clamp(32px,5vw,52px)] font-black leading-tight mb-4">
              جرّب كبينة القيادة الآن 🛸
            </h2>
            <p className="text-gray-400 text-sm md:text-base leading-relaxed">
              هذه محاكاة حية لوحدة التحكم التي ستختبر تقدمك فيها عند تسجيل
              دخولك. اختبر تشغيل المحرك، راقب زيادة الـ XP، أو كبسة محاكاة
              التشتت لتري كيف يحميك الرادار.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            {/* Control Pad Left */}
            <div className="lg:col-span-4 flex flex-col gap-5 justify-between bg-[#060712]/90 border border-white/5 p-6 md:p-8 rounded-[2rem] text-right">
              <div>
                <h3 className="text-lg font-black text-white mb-2">
                  لوحة تفعيل المدارات
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-6">
                  اختر المحطة الصوتية والهيكلية التي تريد الطفو بداخلها. كل محطة
                  تدعم ترددات عزل وموسيقى فريدة.
                </p>

                {/* Pill selection */}
                <div className="space-y-2.5 dropdown-list">
                  {[
                    {
                      name: "سديم نبتون الهادئ",
                      label: "🌌 سديم نبتون الهادئ (Cosmic Lofi)",
                      bg: "from-blue-500/10 to-transparent",
                      desc: "ترددات كونية هادئة مهدئة للأعصاب لعمق التركيز",
                    },
                    {
                      name: "مكة المكرمة",
                      label: "🕌 رحاب مكة المكرمة (قراءة خاشعة)",
                      bg: "from-emerald-500/10 to-transparent",
                      desc: "تلاوات قرآنية عذبة ترتقي بروحك",
                    },
                  ].map((station) => (
                    <button
                      key={station.name}
                      onClick={() => {
                        setSelectedSimStation(station.name);
                        if (station.name === "مكة المكرمة") {
                          setSimTime(1800); // 30 mins
                        } else {
                          setSimTime(1500); // 25 mins
                        }
                        setSimSuccess(false);
                      }}
                      className={cn(
                        "w-full text-right p-4 rounded-xl border text-xs font-bold transition-all flex flex-col gap-1",
                        selectedSimStation === station.name
                          ? "bg-indigo-500/10 border-indigo-500/40 text-white shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                          : "bg-black/40 border-white/5 text-gray-400 hover:text-white",
                      )}
                    >
                      <span>{station.label}</span>
                      <span className="text-[10px] text-gray-500 font-normal">
                        {station.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Live instructions alert */}
              <div className="border border-indigo-500/10 bg-indigo-950/10 p-4.5 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 bottom-0 left-0 w-1 bg-indigo-500" />
                <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 mb-1.5">
                  <Activity size={13} />
                  <span>بروتوكول تحصيل الـ XP بالتجريب</span>
                </h4>
                <p className="text-[11px] text-indigo-200/50 leading-relaxed">
                  عند تشغيل الجلساء، يزداد مخزون طاقة القيادة تلقائياً. المدار
                  يضمن التزام الكابتن وعدم هجر الشاشة.
                </p>
              </div>
            </div>

            {/* Interactive Cabin Dashboard Center-Right */}
            <div className="lg:col-span-8 bg-[#04040a] border-2 border-indigo-500/15 rounded-[2.5rem] p-6 md:p-10 relative overflow-hidden flex flex-col justify-between shadow-[0_0_60px_rgba(99,102,241,0.1)]">
              {/* Hologram scanline */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] pointer-events-none opacity-30" />

              {/* Alert Mode active background effect */}
              {simAlertActive && (
                <div className="absolute inset-0 bg-red-950/20 z-0 animate-warning-breathe pointer-events-none" />
              )}

              {/* Station Simulator Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4.5 mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Atom className="w-5 h-5 animate-[spin_6s_linear_infinite]" />
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-mono text-cyan-400 font-bold tracking-widest block uppercase">
                      ACTIVE SIMULATED SECTOR
                    </span>
                    <span className="text-sm font-black text-white">
                      محطة: {selectedSimStation}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] text-gray-400 font-mono">
                    1,480 PILOTS ONLINE
                  </span>
                </div>
              </div>

              {/* Primary Content Container */}
              <div className="relative z-10 my-auto text-center py-6">
                {/* Float XP Numbers animation inside simulator */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-20 w-40 pointer-events-none">
                  {floatingXps.map((fx) => (
                    <motion.div
                      key={fx.id}
                      initial={{ opacity: 1, y: 15 }}
                      animate={{ opacity: 0, y: -45 }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className="absolute left-1/2 -translate-x-1/2 text-emerald-400 text-xs font-mono font-black"
                    >
                      +15 XP ⚡ CAPTURED
                    </motion.div>
                  ))}
                </div>

                {/* Simulated Timer Counter */}
                <div className="text-[clamp(45px,6vw,70px)] font-mono font-black tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-b from-white via-indigo-200 to-indigo-400 mb-2 drop-shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                  {formatSimTime(simTime)}
                </div>

                <div className="text-xs text-gray-400/70 font-mono tracking-widest uppercase mb-8">
                  CHRONONOMETER: REGISTRY ON TRACK
                </div>

                {/* Active XP Energy Display */}
                <div className="inline-flex items-center gap-6 bg-black/40 border border-white/5 p-4 rounded-2xl mb-8">
                  <div className="text-right">
                    <div className="text-[9px] text-[#818cf8] font-mono leading-none mb-1">
                      XP ENERGY BANK
                    </div>
                    <div className="text-lg font-black font-mono text-emerald-400">
                      {simXp} XP
                    </div>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-right">
                    <div className="text-[9px] text-[#818cf8] font-mono leading-none mb-1">
                      XP MULTIPLIER
                    </div>
                    <div className="text-sm font-bold font-mono text-white">
                      1.0x NORMAL
                    </div>
                  </div>
                </div>

                {/* Simulate interactive Alert Warnings message */}
                <AnimatePresence>
                  {simAlertActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="max-w-md mx-auto p-4 border border-red-500/30 bg-red-950/20 rounded-xl text-right mb-8"
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5 animate-bounce" />
                        <div>
                          <h4 className="text-xs font-black text-red-300">
                            خرق الحضور! غادرت كبينة القيادة 🚨
                          </h4>
                          <p className="text-[11px] text-red-200/50 leading-relaxed mt-1">
                            رصد النظام تشتتاً أو تغييراً في النشاط. العودة
                            الفورية مطلوبة في غضون{" "}
                            <b className="text-white font-mono text-xs">
                              {simAlertCountdown}ث
                            </b>{" "}
                            لتجنب سحب كتل طاقة الـ XP.
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2 justify-end">
                        <button
                          onClick={cancelMockDistraction}
                          className="bg-red-500 hover:bg-red-600 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition-colors"
                        >
                          تأكيد الحضور (إلغاء الإنذار)
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {simSuccess && (
                  <div className="max-w-md mx-auto p-4 border border-emerald-500/30 bg-emerald-950/10 rounded-xl text-center mb-8">
                    <h4 className="text-xs font-black text-emerald-400">
                      انتهت الرحلة المدارية بنجاح! 🎉
                    </h4>
                    <p className="text-[11px] text-emerald-200/50 mt-1">
                      اكتملت جلسة التركيز المفعمة بالنشاط وحصدت محاصيل إضافية.
                      مستعد للمزيد؟
                    </p>
                  </div>
                )}
              </div>

              {/* Action Board controls in Simulator */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-6 relative z-10 select-none">
                <button
                  onClick={toggleSim}
                  className={cn(
                    "flex-1 min-w-[150px] font-black rounded-xl py-3.5 text-xs transition-all flex items-center justify-center gap-2",
                    simActive
                      ? "bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                      : "bg-indigo-500 hover:bg-indigo-600 text-white",
                  )}
                >
                  <Rocket className="w-4 h-4" />
                  <span>
                    {simActive
                      ? "إيقاف الجلسة التفاعلية"
                      : "إطلاق جلسة المحاكاة"}
                  </span>
                </button>

                <button
                  onClick={triggerMockDistraction}
                  disabled={simAlertActive}
                  className="bg-black/40 hover:bg-white/5 border border-white/10 hover:border-red-500/40 text-xs font-bold font-sans text-gray-400 hover:text-red-400 rounded-xl px-5 py-3.5 transition-all text-center flex items-center justify-center gap-2 disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
                  <span>محاكاة alert الوجود التشتيتي</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          SECTION 4: DISTRACTION SECURITY SHIELD
         ------------------------------------------------------------- */}
      <section
        id="anti-cheat"
        className="py-24 px-6 relative z-10 bg-gradient-to-b from-[#030308] to-[#010105] border-t border-white/5"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content Description info */}
            <div className={cn("lg:col-span-6", isAr ? "text-right" : "text-left")} dir={isAr ? "rtl" : "ltr"}>
              <div className="inline-flex items-center gap-2 font-mono text-xs text-rose-500 tracking-[0.2em] mb-4 uppercase">
                <span className="w-6 h-px bg-rose-500/50" />
                {isAr ? "نظام الرادار اللصيق" : "Anti-Distraction Radar"}
              </div>
              <h3 className="text-[clamp(28px,4vw,44px)] font-black leading-tight mb-6">
                {isAr ? "درع حماية الوجود البشري" : "Human Presence Protection Shield"} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-rose-400 to-amber-400">
                  {isAr ? "ومكافحة التحايل والشرود." : "Combatting evasions & screen straying."}
                </span>
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                {isAr
                  ? "في خادم OrbitX، لا نزاحمك بتايمر زائف يمكنك إغلاق عينيك عنه والذهاب. النظام مصمم لضمان تفويض الوجود الكامل باستخدام آليات تتبع التفاعل اللحظية:"
                  : "Inside OrbitX cockpit, we don't bother you with artificial loops. Our framework ensures absolute focus via active viewport interaction checks:"}
              </p>

              {/* Core shield lists */}
              <div className="space-y-4">
                {[
                  {
                    title: isAr ? "رادار الحضور التلقائي" : "Automatic Presence Radar",
                    desc: isAr
                      ? "ينذرك النظام بمجرد هجرك للتبويب أو قفل الشاشة، ويفتح عداد مهلة العودة ل cockpit خلال ثوانٍ معدودة."
                      : "Triggers when you leave the active browser tab or lock your focus, starting a cockpit countdown standby timer.",
                  },
                  {
                    title: isAr ? "خصم كتل الـ XP عند الاستهتار" : "Active XP Penalty Protocol",
                    desc: isAr
                      ? "في حال تكرار خرق المدار، يقوم الرادار بتشغيل بروتوكول خصم نقاط الخبرة (XP) لمنع اللامبالاة والتأكيد على الانضباط."
                      : "Repeated orbit breaches activate our XP reduction sequence, enforcing deep discipline across sessions.",
                  },
                  {
                    title: isAr ? "حظر التحايل الميكانيكي" : "Mechanical Cheat Prevention",
                    desc: isAr
                      ? "رصد كامل لحركات الفأرة الوهمية أو نقرات الـ Auto-Clicker منعا للغش في معارك المتصدرين."
                      : "Tracks and isolates synthetic cursor ticks or auto-clicker loops to assure scoreboard integrity.",
                  },
                ].map((sh, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0 text-xs text-rose-400 mt-1 font-bold">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">
                        {sh.title}
                      </h4>
                      <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                        {sh.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Tech visual UI representing the Shields status */}
            <div className="lg:col-span-6 bg-[#090508]/80 border border-rose-500/20 rounded-[2.5rem] p-8 relative overflow-hidden flex flex-col justify-between shadow-[0_0_60px_rgba(239,68,68,0.06)] min-h-[380px]">
              {/* Matrix glow line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent animate-pulse" />

              <div
                className="flex items-center justify-between border-b border-rose-500/10 pb-4 mb-6"
                dir="ltr"
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                  <span className="font-mono text-[10px] text-rose-400 font-bold tracking-widest uppercase">
                    ANTI_DISTRACTION_SHIELD
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">
                  STATUS: ARMED
                </span>
              </div>

              {/* Graphics representing checking guards */}
              <div className="space-y-4 text-right">
                {[
                  {
                    label: "BIOMETRIC PRESENCE PROXY",
                    percent: "99.8%",
                    color: "text-emerald-400",
                    status: "STABLE",
                  },
                  {
                    label: "WINDOW FOCUS GUARANTOR",
                    percent: "ACTIVE",
                    color: "text-rose-500 animate-pulse",
                    status: "LOCKDOWN",
                  },
                  {
                    label: "MECHANICAL CLICK DETECTOR",
                    percent: "100%",
                    color: "text-indigo-400",
                    status: "ARMED",
                  },
                ].map((guard, idx) => (
                  <div
                    key={idx}
                    className="bg-black/40 border border-white/5 p-4 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 font-mono text-[10px]">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded border border-white/5 inline-block text-[9px] uppercase",
                          guard.color,
                        )}
                      >
                        {guard.status}
                      </span>
                      <span className="text-gray-400 font-bold">
                        {guard.percent}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-white block font-bold">
                        {guard.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-[10px] text-rose-400 font-mono tracking-wide uppercase">
                ⚠️ PENALTY OF ESCAPING THE CABIN: -50 XP PER LEAVE INTRUSION
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          SECTION 5: BLACK HOLE MODE ACCRETION SOUND
         ------------------------------------------------------------- */}
      <section className="py-28 px-6 relative z-10 overflow-hidden bg-black flex items-center justify-center">
        {/* Accretion Disk CSS Rotation Backdrop. Ultra optimized, pure GPU layered CSS transform */}
        <div className="absolute inset-0 z-0 pointer-events-none w-full h-full flex items-center justify-center">
          <div className="absolute w-[800px] h-[800px] rounded-full border border-fuchsia-600/10 bg-gradient-to-tr from-[#9d174d]/15 via-transparent to-[#1e1b4b]/20 filter blur-[90px] animate-cosmic-pulse" />

          {/* Black hole Accretion Disk spinning elements */}
          <div
            className="absolute w-[450px] h-[450px] rounded-full border-[10px] border-amber-500/10 border-t-amber-400/50 border-b-indigo-500/40"
            style={{
              filter: "blur(18px)",
              animation: "aura-rotate 16s linear infinite",
            }}
          />
          <div
            className="absolute w-[470px] h-[470px] rounded-full border-[2px] border-dashed border-rose-500/20"
            style={{
              filter: "blur(4px)",
              animation: "aura-rotate 28s linear infinite reverse",
            }}
          />

          {/* Core Singularity Void sphere */}
          <div className="absolute w-52 h-52 rounded-full bg-black shadow-[0_0_120px_rgba(244,63,94,0.35),0_0_40px_rgba(0,0,0,1)] z-10" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto text-center py-10 px-4">
          <div className="inline-flex items-center gap-2 bg-[#1c0812]/50 border border-rose-500/30 rounded-full px-4 py-1.5 text-[10px] text-rose-300 font-bold tracking-widest mb-8">
            <Flame className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
            {isAr ? "بروتوكول التركيز الأقصى والأكثر شراسة" : "Supreme Concentration & Aggressive Protocol"}
          </div>

          <h3 className="text-[clamp(32px,5vw,60px)] font-black leading-tight mb-8">
            {isAr ? "وضع الثقب الأسود" : "Black Hole Multiplayers"} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-amber-400 to-indigo-500">
              {isAr ? "تجمع الساعات وجوائز نهاية الأسبوع!" : "Conquer gravity and claim weekend bounties!"}
            </span>
          </h3>

          <p
            className="text-gray-300 text-sm md:text-base leading-relaxed mb-12 max-w-2xl mx-auto"
            dir={isAr ? "rtl" : "ltr"}
          >
            {isAr
              ? "وضع الثقب الأسود هو التحدي الأقوى لرجال الفضاء والملتزمين؛ حيث يتعاون الجميع لجمع ساعات تركيز خارقة والتغلب على الجاذبية. وإذا أكملتم وإنجزتم مهمة الثقب الأسود بنجاح قبل انقضاء الأسبوع، تفوزون بالكامل بجائزة قيّمة ومكافأة استثنائية فريدة في نهاية كل أسبوع!"
              : "The Black Hole is the ultimate trial for elite astronauts; everyone joins forces to pool deep focus hours and defeat gravity. Succeed in completing the weekly orbital trial before Friday to pull open stellar rewards!"}
          </p>

          <button
            onClick={() => setShowLoginModal(true)}
            className="group relative overflow-hidden bg-[#2d020c] hover:bg-[#470313] border border-rose-500/50 rounded-2xl px-12 py-4.5 text-xs font-black text-rose-200 shadow-[0_0_35px_rgba(239,68,68,0.25)] hover:shadow-[0_0_55px_rgba(239,68,68,0.45)] transition-all"
          >
            <span className="relative z-10">{isAr ? "إخضاع الجاذبية وتجربتها الآن" : "Defy gravity & Enter Simulator"}</span>
          </button>
        </div>
      </section>

      {/* -------------------------------------------------------------
          SECTION 6: AWARENESS / MINDSET SECTION
         ------------------------------------------------------------- */}
      <section
        id="awareness"
        className="py-24 px-6 relative z-10 bg-[#020207] border-t border-white/5"
      >
        <div className="max-w-7xl mx-auto">
          <div className={cn("mb-16", isAr ? "text-right" : "text-left")} dir={isAr ? "rtl" : "ltr"}>
            <div className="inline-flex items-center gap-2 font-mono text-xs text-purple-400 tracking-[0.2em] mb-4 uppercase">
              <span className="w-6 h-px bg-purple-500/50" />
              {isAr ? "معهد غسل التشتت والـ Mindset" : "Mindset & Distraction Resolution Institute"}
            </div>
            <h3 className="text-[clamp(28px,4vw,42px)] font-black leading-tight">
              {isAr ? "الوعي المداري للإنتاجية" : "Orbital Productivity Consciousness"} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-purple-400 via-indigo-400 to-cyan-400">
                {isAr ? "بناء عقلية الكائن الملتزم." : "Engineering a Highly Disciplined Mind."}
              </span>
            </h3>
            <p className="text-gray-400 text-sm max-w-2xl mt-4 leading-relaxed">
              {isAr
                ? "التركيز ليس ميكانيكياً فحسب، بل هو وعي سلوكي. يقدم لك مستودع الوعي في OrbitX مقالات، خلاصات إرشادية وتدريبات مبنية لتغيير نظرتك للتشتت المعاصر."
                : "Deep focus is not merely mechanical; it is a behavioral craft. OrbitX Mindset Hub supplies guidelines, cognitive exercises, and research made to reconstruct your resistance against contemporary distraction loops."}
            </p>
          </div>

          {/* Interactive Secure Mini Globe for Classified Intelligence */}
          <InteractiveSecretGlobe />
        </div>
      </section>

      {/* -------------------------------------------------------------
          SECTION 7: LIVE COGNITIVE STATS
         ------------------------------------------------------------- */}
      <section
        id="metrics"
        className="py-20 px-6 relative z-10 bg-gradient-to-b from-[#010105] to-[#040410]"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 border border-indigo-500/10 rounded-[2.5rem] p-8 md:p-14 bg-[#050510]/80 backdrop-blur-3xl text-center shadow-[0_0_50px_rgba(99,102,241,0.1)]">
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-4xl font-mono font-black text-white leading-none tracking-tight">
                <CountUp target={14298} />
              </div>
              <span className="text-[10px] text-indigo-300/60 font-mono tracking-widest mt-2 block uppercase">
                EXPLORERS ONBOARD
              </span>
            </div>

            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 mb-4 shadow-[0_0_15px_rgba(240,70,240,0.1)]">
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-4xl font-mono font-black text-white leading-none tracking-tight">
                <CountUp target={329481} suffix=" H" />
              </div>
              <span className="text-[10px] text-fuchsia-300/60 font-mono tracking-widest mt-2 block uppercase">
                TOTAL FLIGHT TIMERS
              </span>
            </div>

            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                <Zap className="w-5 h-5 animate-pulse" />
              </div>
              <div className="text-4xl font-mono font-black text-white leading-none tracking-tight">
                <CountUp target={429} suffix="M+" />
              </div>
              <span className="text-[10px] text-cyan-300/60 font-mono tracking-widest mt-2 block uppercase">
                TOTAL HARVESTED XP
              </span>
            </div>

            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                <Rocket className="w-5 h-5" />
              </div>
              <div className="text-4xl font-mono font-black text-white leading-none tracking-tight">
                <CountUp target={89} suffix=" F" />
              </div>
              <span className="text-[10px] text-rose-300/60 font-mono tracking-widest mt-2 block uppercase">
                SQUADRON SQUAD FLEETS
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          SECTION 9: SYSTEM FOOTER OS THEME
         ------------------------------------------------------------- */}
      <footer className={cn("bg-[#020205] border-t border-white/5 pt-20 pb-12 px-6 relative z-10", isAr ? "text-right" : "text-left")}>
        <div
          className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 mb-16"
          dir={isAr ? "rtl" : "ltr"}
        >
          {/* Column Brand */}
          <div className="md:col-span-5">
            <div className={cn("flex items-center gap-3 mb-6", isAr ? "" : "flex-row-reverse")}>
              <div className="relative flex items-center justify-center w-8 h-8">
                <div className="absolute inset-0 border-2 border-indigo-500 rounded-full" />
                <div className="absolute w-2.5 h-2.5 bg-indigo-400 rounded-full" />
              </div>
              <div className="font-display font-black tracking-[0.2em] text-[18px] text-white">
                ORBIT<span className="text-indigo-400">X</span>
              </div>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed max-w-sm mb-6">
              "OrbitX isn’t a timer. It’s an operating system for focus."
            </p>
            <p className="text-xs text-gray-500">
              {isAr
                ? "نظام تشغيل حشد التركيز وإدارة الأداء البشري دون تشتيت. صُمم للمصممين، المهندسين، وصناع العلوم الكونية الاستكشافية."
                : "A focus mobilization and human performance management system without distractions. Built for designers, developers, and explorers of cosmic sciences."}
            </p>
          </div>

          {/* Links 1 */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-black text-white font-sans tracking-wide uppercase mb-5">
              {isAr ? "وحدات النظام" : "System Modules"}
            </h4>
            <ul className="space-y-3 text-[11px] text-gray-400">
              <li>
                <a
                  href="#how-it-works"
                  className="hover:text-indigo-400 transition-colors"
                >
                  {isAr ? "مخطط السفر" : "Flight Architecture"}
                </a>
              </li>
              <li>
                <a
                  href="#simulate-cockpit"
                  className="hover:text-indigo-400 transition-colors"
                >
                  {isAr ? "قمرة الاستكشاف" : "Exploration Cockpit"}
                </a>
              </li>
              <li>
                <a
                  href="#anti-cheat"
                  className="hover:text-indigo-400 transition-colors"
                >
                  {isAr ? "حظر التشتيت والوجود" : "System Shield & Anti-Cheat"}
                </a>
              </li>
              <li>
                <a
                  href="#awareness"
                  className="hover:text-indigo-400 transition-colors"
                >
                  {isAr ? "منشورات الوعي المنهجي" : "Cognitive Awareness Hub"}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="md:col-span-4">
            <h4 className="text-xs font-black text-white font-sans tracking-wide uppercase mb-5">
              {isAr ? "مركز الإرشاد الكوني DSupport" : "DSupport Cosmic Command"}
            </h4>
            <p className="text-[11px] text-gray-400 leading-relaxed mb-4">
              {isAr
                ? "للاستشارات، الإبلاغ عن اختلالات تواصل مع القيادة:"
                : "For questions, troubleshooting, or anomalies, please contact base camp:"}
            </p>
            <div
              className="bg-black/40 border border-white/5 p-4 rounded-xl text-left font-mono text-[10px]"
              dir="ltr"
            >
              <span className="text-[#a5b4fc] block font-bold mb-1">
                PROPRIETARY OS TERMINAL
              </span>
              <span className="text-gray-400">
                Email: abdalrahmanjarrah1@gmail.com
              </span>
              <span className="text-gray-500 block mt-1">
                Creator: abdalrahman nabeel Al jarrah
              </span>
            </div>
          </div>
        </div>

        {/* Bottom copyright banner */}
        <div
          className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-gray-400 font-mono"
          dir={isAr ? "rtl" : "ltr"}
        >
          <div>
            ORBITX SPACE PROTOCOL © 2026. Developed and Crafted by{" "}
            <span className="text-indigo-400 font-bold font-sans">
              abdalrahman nabeel Al jarrah
            </span>
            .
          </div>
          <div className="flex items-center gap-1.5" dir="ltr">
            <span>Ground Support Email:</span>
            <a
              href="mailto:abdalrahmanjarrah1@gmail.com"
              className="text-cyan-400 hover:underline"
            >
              abdalrahmanjarrah1@gmail.com
            </a>
          </div>
        </div>
      </footer>

      {/* Futuristic Cosmic Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Ambient Animated Blurred Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoginModal(false)}
              className="absolute inset-0 bg-[#020205]/90 backdrop-blur-xl"
            />

            {/* Glowing Space Dashboard Card */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className={cn("relative bg-[#070814]/95 border border-indigo-500/40 rounded-[2.5rem] p-6 md:p-10 w-full max-w-lg shadow-[0_0_100px_rgba(99,102,241,0.25)] overflow-hidden", isAr ? "text-right" : "text-left")}
              dir={isAr ? "rtl" : "ltr"}
            >
              {/* Absolute Cosmic Flares */}
              <div className="absolute -top-20 -left-20 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Header */}
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5 relative z-10">
                <div className={cn("flex items-center gap-3", isAr ? "" : "flex-row-reverse")}>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Rocket className="w-5 h-5" />
                  </div>
                  <div className={isAr ? "text-right" : "text-left"}>
                    <h2 className="text-xl font-black text-white font-sans">
                      {isAr ? "بصمة العبور للـ OrbitX" : "OrbitX Transit Signature"}
                    </h2>
                    <p className="text-[11px] text-indigo-300/60 font-mono tracking-wider mt-0.5">
                      LAUNCH_CONTROL_GATEWAY
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="p-2 border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 text-gray-400 hover:text-white rounded-xl transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Inside the modal: Profile Image & Info Card */}
              <div className={cn("relative border border-white/5 bg-[#0a0b16]/70 rounded-2.5xl p-5 flex items-center gap-4 mb-6 overflow-hidden group", isAr ? "" : "flex-row-reverse")}>
                {/* Simulated Holographic Scan line */}
                <motion.div
                  animate={{ y: [0, 80, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 4,
                    ease: "easeInOut",
                  }}
                  className="absolute left-0 right-0 h-[1.5px] bg-indigo-500/30 pointer-events-none"
                />

                <div className="w-14 h-14 rounded-2xl border border-indigo-500/30 bg-indigo-950/40 flex items-center justify-center overflow-hidden shrink-0">
                  <Rocket className="w-7 h-7 text-indigo-400 animate-pulse" />
                </div>
                <div className={cn("flex-1", isAr ? "text-right" : "text-left")}>
                  <div className="text-[10px] text-indigo-400 font-mono tracking-widest leading-none mb-1 uppercase">
                    PILOT REGISTER STATUS
                  </div>
                  <div className="text-sm font-bold text-white">
                    {isAr ? "رائد فضاء مستكشف" : "Exploring Astronaut"}
                  </div>
                  <div className="text-xs text-indigo-200/50 mt-1">
                    {isAr ? "المدار: بانتظار الترشيح الشخصي" : "Orbit: Awaiting deployment status"}
                  </div>
                </div>
                <div className={cn("font-mono text-[9px] text-indigo-400/40 flex flex-col shrink-0 select-none", isAr ? "text-left items-end" : "text-right items-start")}>
                  <div>SYS: ON</div>
                  <div>SEC: SECURE</div>
                  <div>DB: READY</div>
                </div>
              </div>

              {/* Onboarding info points */}
              <div className={cn("space-y-3 mb-8 text-xs text-gray-400 bg-black/40 p-5 rounded-2xl border border-white/5 font-sans leading-relaxed", isAr ? "text-right" : "text-left")}>
                <div className="font-black text-gray-200 text-sm mb-2">
                  {isAr ? "رحلتك الإنجازية اليوم تشمل:" : "Your achievement journey today includes:"}
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-indigo-400">🌌</span>
                  <span>
                    <strong>{isAr ? "غرف دراسة حية (Study Rooms)" : "Live Study Rooms"}</strong> {isAr ? "بلا تشتت أو مقاطعات إعلانية." : "without distractions or advertisement loops."}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-indigo-400">⚡</span>
                  <span>
                    {isAr ? "كسب نقاط الغطس (XP)، وترقية الشارات الفضائية المخصصة." : "Earning Deep-dive Points (XP) and upgrading custom space badges."}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-indigo-400">🐾</span>
                  <span>
                    {isAr ? "رعاية مواشيك الفضائية وحصاد نتاج المعرفة بالمزرعة." : "Raising your celestial creatures and harvesting scientific yields at the Orbit Farm."}
                  </span>
                </div>
              </div>

              {/* Google OAuth Launcher control with spectacular shadow */}
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  onLogin();
                }}
                className="relative w-full group overflow-hidden bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-600 rounded-2xl py-4.5 text-[16px] font-black text-white shadow-[0_0_35px_rgba(99,102,241,0.35)] hover:shadow-[0_0_55px_rgba(99,102,241,0.55)] transition-all hover:scale-[1.01] flex items-center justify-center gap-3"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <svg
                  className="w-5 h-5 fill-white shrink-0"
                  viewBox="0 0 24 24"
                >
                  <path d="M12.24 10.285V13.4h6.86c-.277 1.56-1.602 4.585-6.86 4.585-4.54 0-8.24-3.765-8.24-8.4s3.7-8.4 8.24-8.4c2.58 0 4.307 1.095 5.298 2.045l2.465-2.37C18.435 1.21 15.62 0 12.24 0 5.58 0 0 5.37 0 12s5.58 12 12.24 12c6.96 0 11.57-4.89 11.57-11.79 0-.795-.085-1.4-.195-1.925H12.24z" />
                </svg>
                <span>{isAr ? "التحليق الفوري الآمن باستخدام Google" : "Fly securely using Google"}</span>
              </button>

              <div className="text-center text-[10px] text-gray-500 font-mono tracking-wide mt-5 uppercase">
                SECURITY CLEARED BY ORBITX SPACE COMMAND PROTOCOL
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

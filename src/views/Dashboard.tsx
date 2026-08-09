import { Joyride } from "react-joyride";
import { playSound } from "../lib/sound";
import { useRenderLog } from "../firebaseDebug";
import Markdown from "react-markdown";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Globe from "react-globe.gl";
import React, { useState, useEffect, useRef, Component } from "react";
import {
  Leaf,
  Swords,
  ChevronLeft,
  Rocket,
  Timer,
  Users,
  Zap,
  Star,
  LogOut,
  LayoutDashboard,
  MessageSquare,
  User as UserIcon,
  Heart,
  ShieldAlert,
  AlertTriangle,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Lock,
  Send,
  Image as ImageIcon,
  Plus,
  X,
  MessageCircle,
  Calendar,
  Shield,
  Trash2,
  Music,
  CloudRain,
  Flame,
  Wind,
  Bird,
  ChevronDown,
  PlayCircle,
  PauseCircle,
  CheckCircle,
  Info,
  Keyboard,
  Waves,
  TrainFront,
  Mic,
  MicOff,
  Headphones,
  Settings,
  Radio,
  Trophy,
  Menu,
  Square,
  Store,
  BookOpen,
  Target,
  Telescope,
  Award,
  Activity,
  Eye,
  Terminal as TerminalIcon,
  Cpu,
  CheckSquare,
  Bell,
  BarChart3,
  Search, Globe2, UserCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import StarBackground from "../components/StarBackground";

import { cn } from "../lib/utils";
import {
  auth,
  db,
  signInWithGoogle,
  logout,
  handleFirestoreError,
  OperationType,
} from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot as originalOnSnapshot,
  query,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  where,
  deleteDoc,
  deleteField,
  writeBatch,
} from "firebase/firestore";
import { FirestoreError } from 'firebase/firestore';

function onSnapshot(...args: any[]) {
    // We try to catch uncaught snapshot errors
    if (args.length === 2 && typeof args[1] === 'function') {
        return originalOnSnapshot(args[0], args[1], (e: any) => {
            console.error('Intercepted onSnapshot error', e, args[0]);
            handleFirestoreError(e, OperationType.GET, 'snapshot_unknown');
        });
    }
    if (args.length === 3 && typeof args[1] === 'function' && typeof args[2] === 'function') {
        const originalError = args[2];
        args[2] = (e: any) => {
            console.error('Intercepted onSnapshot error', e, args[0]);
            originalError(e);
        };
        return originalOnSnapshot(args[0], args[1], args[2]);
    }
    return (originalOnSnapshot as any)(...args);
}


import { SURAHS, getAstronautRank, BADGES, MeteorEffect, RECITERS, UserData, Fleet, Discussion, Reply, ScheduleItem, Room, Challenge, AwarenessSignal, Message, getTourSteps } from '../shared';
import NotificationsDropdown from './NotificationsDropdown';
import NavPill from './NavPill';
import MobileNavPill from './MobileNavPill';
import DockButton from './DockButton';
import ChallengeModal from './ChallengeModal';
import ArticleModal from './ArticleModal';
import StationCard from './StationCard';
import UserModal from './UserModal';
import NavLink from './NavLink';
import { useLanguage } from "../context/LanguageContext";

// Lazy-Loaded Cinematic Sector Components (Code-Splitting)
const HomeView = React.lazy(() => import('./HomeView'));
const ExhibitionGallery = React.lazy(() => import('./ExhibitionGallery'));
const QuranPlayer = React.lazy(() => import('./QuranPlayer'));
const PersonalTasks = React.lazy(() => import('./PersonalTasks'));
const StudyRoomView = React.lazy(() => import('./StudyRoomView'));
const LeaderboardView = React.lazy(() => import('./LeaderboardView'));
const FocusHeatmap = React.lazy(() => import('./FocusHeatmap'));
const ProfileView = React.lazy(() => import('./ProfileView'));
const DiscussionsView = React.lazy(() => import('./DiscussionsView'));
const ScheduleView = React.lazy(() => import('./ScheduleView'));
const AdminView = React.lazy(() => import('./AdminView'));
const SupportView = React.lazy(() => import('./SupportView'));
const BadgeCard = React.lazy(() => import('./BadgeCard'));
const CosmicDiary = React.lazy(() => import('./CosmicDiary'));
const FarmDisplay = React.lazy(() => import('./FarmDisplay'));
const BlackHolesView = React.lazy(() => import('./BlackHolesView'));
const AwarenessView = React.lazy(() => import('./AwarenessView'));
const ChallengesHubView = React.lazy(() => import('./ChallengesHubView'));
const AnalyticsView = React.lazy(() => import('./AnalyticsView'));
const FleetsView = React.lazy(() => import('./FleetsView'));
const UserSearchView = React.lazy(() => import('../components/UserSearchView').then((m) => ({ default: m.UserSearchView })));

export default function Dashboard({
  user,
  onLogout,
}: {
  user: UserData | null;
  onLogout: () => void;
}) {
  const { lang, isAr, t, toggleLanguage } = useLanguage();
  useRenderLog("Dashboard", { userEmail: user?.email });
  const [activeTab, setActiveTab] = useState<
    | "home"
    | "chat"
    | "search"
    | "profile"
    | "discussions"
    | "schedule"
    | "admin"
    | "leaderboard"
    | "awareness"
    | "blackholes"
    | "fleets"
    | "farm"
    | "support"
    | "challenges"
  >("home");
  const [activeStation, setActiveStation] = useState<string | null>(null);

  // Automatically pull the user back into their active station if they are already in one (e.g., opened in a new tab or recovered session)
  useEffect(() => {
    if (!user?.uid) return;

    try {
      const q = query(
        collection(db, "rooms"),
        where("participants", "array-contains", user.uid)
      );

      getDocs(q).then((snap) => {
        if (!snap.empty) {
          const activeRoom = snap.docs[0];
          console.log("[Dashboard] Auto-loaded active station:", activeRoom.id);
          setActiveStation(activeRoom.id);
        }
      }).catch((err) => {
        console.warn("[Dashboard] Error looking up active user stations on mount:", err);
      });
    } catch (e) {
      console.warn("[Dashboard] Error in active station lookup effect:", e);
    }
  }, [user?.uid]);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(
    !user?.missionRole && !localStorage.getItem("hasSkippedRoleModal"),
  );
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [dailyFocusTarget, setDailyFocusTarget] = useState("2 ساعتان");
  const [customRole, setCustomRole] = useState("");
  const [runTour, setRunTour] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const activityTimeoutRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Removed automatically forced onboarding tutorial round/flow.
  // Optional button in top bar triggers tour manually.

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    if (["finished", "skipped"].includes(status)) {
      setRunTour(false);
      localStorage.setItem("hasSeenTour_v3", "true");
    }
  };

  if (!user) return null;

  const handleSelectRole = async (roleObjOrString: string) => {
    let roleTitle = roleObjOrString;
    if (!roleTitle.trim()) return;

    try {
      await updateDoc(doc(db, "users", user.uid), {
        missionRole: roleTitle.trim(),
      });
      setShowRoleModal(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleSkipRole = () => {
    localStorage.setItem("hasSkippedRoleModal", "true");
    setShowRoleModal(false);
  };

  if (activeStation) {
    return (
      <React.Suspense fallback={
        <div className="min-h-screen bg-[#03040B] flex flex-col items-center justify-center relative">
          <Rocket className="w-12 h-12 text-indigo-400 animate-bounce" />
          <p className="text-xs text-indigo-300 font-mono tracking-widest mt-4 animate-pulse">
            {isAr ? "بروتوكول تهيئة المحطة..." : "INITIALIZING SECTOR PORTAL..."}
          </p>
        </div>
      }>
        <StudyRoomView
          user={user}
          stationId={activeStation}
          onExit={() => setActiveStation(null)}
          onSelectUser={setSelectedUserId}
        />
      </React.Suspense>
    );
  }

  const focusTabs = ["home", "schedule", "challenges", "farm", "blackholes"];
  const communityTabs = [
    "search",
    "discussions",
    "fleets",
    "leaderboard",
    "awareness",
  ];
  const profileTabs = ["profile", "admin", "support"];

  let currentCategory = "focus";
  if (communityTabs.includes(activeTab as string)) currentCategory = "community";
  else if (profileTabs.includes(activeTab as string)) currentCategory = "profile";

  const setCategory = (cat: string) => {
    if (cat === "focus") handleTabChange("home");
    if (cat === "community") handleTabChange("search");
    if (cat === "profile") handleTabChange("profile");
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    let activity = "في لوحة القيادة المركزية";
    if (tab === "profile") activity = "يعاين الهوية الفضائية";
    if (tab === "discussions") activity = "في مجلس الحكماء الفضائي";
    if (tab === "schedule") activity = "يبرمج مسار الرحلة";
    if (tab === "leaderboard") activity = "يراقب التصنيف المجري 🏆";
    if (tab === "admin") activity = "في غرفة القيادة العليا 🛡️";
    if (tab === "awareness") activity = "يستقبل إشارات الوعي 📡";
    if (tab === "challenges") activity = "يستعد لسباقات التركيز";
    if (tab === "farm") activity = "يرعى المزرعة الفضائية 🐓";
    if (tab === "blackholes") activity = "يتفادى الثقوب السوداء 🌌";
    if (tab === "fleets") activity = "يدير الأسطول المجري 🌌";
    if (tab === "support") activity = "يرفع اقتراحات للدعم الفني 📡";
    if (tab === "search") activity = "يستكشف رواد الفضاء الجدد 📡";

    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }
    activityTimeoutRef.current = setTimeout(() => {
      updateDoc(doc(db, "users", user.uid), { currentActivity: activity }).catch(() => {});
    }, 4000);
  };

  return (
    <div className="min-h-screen relative flex flex-col font-sans overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200" dir={isAr ? "rtl" : "ltr"}>
      {/* Background Ambience */}
      <div className="fixed inset-0 bg-[#03040B] z-[-2]" />
      <StarBackground />
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay z-[-1]" />
      
      {/* Cosmic Gradient Overlays */}
      <div className="fixed top-[-10%] -left-64 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen z-[-1]" />
      <div className="fixed top-1/2 -right-64 w-[800px] h-[800px] bg-fuchsia-600/5 rounded-full blur-[150px] pointer-events-none mix-blend-screen z-[-1]" />

      <Joyride
        steps={getTourSteps(window.innerWidth < 1024)}
        run={runTour}
        continuous
        showSkipButton
        showProgress
        callback={handleJoyrideCallback}
        styles={{
           // @ts-ignore
          options: {
            primaryColor: "#6366f1", backgroundColor: "#0b0c16", textColor: "#fff", arrowColor: "#0b0c16", zIndex: 1000,
          },
        }}
        locale={{ back: "السابق", close: "إغلاق", last: "إنهاء", next: "التالي", skip: "تخطي" }}
      />

      <AnimatePresence>
        {showRoleModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#000108]/90 backdrop-blur-xl" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#0b0c16]/95 border border-indigo-500/30 rounded-[2.5rem] p-6 md:p-10 w-full max-w-xl shadow-[0_0_100px_rgba(99,102,241,0.25)] text-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                <Rocket size={240} className="text-indigo-500" />
              </div>

              {/* Progress Bar inside Wizard */}
              <div className="relative z-10 flex items-center justify-center gap-2 mb-8" dir={isAr ? "rtl" : "ltr"}>
                {[0, 1, 2].map((s) => (
                  <div
                    key={s}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      onboardingStep === s ? "w-8 bg-indigo-500" : "w-2 bg-indigo-950/80 border border-white/5"
                    )}
                  />
                ))}
              </div>

              {/* STEP 0: Introduction Card */}
              {onboardingStep === 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="relative z-10 rtl:text-right ltr:text-left"
                  dir={isAr ? "rtl" : "ltr"}
                >
                  <h2 className="text-2xl md:text-3xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-l from-indigo-300 via-cyan-300 to-white leading-tight">
                    {t("onboarding.welcome", "أهلاً بك على متن المدار، يا قائد 🚀")}
                  </h2>
                  <p className="text-sm text-indigo-200/60 mb-6 leading-relaxed">
                    {t("onboarding.desc", "تم رصد تفويضك بنجاح. يستعد البروتوكول المداري لإعداد وحدة التحكم الخاصة بك وعزل المؤثرات الحركية المحيطة لضمان أقصى مستويات التركيز البشري.")}
                  </p>

                  <div className="bg-[#060711] border border-white/5 rounded-2.5xl p-5 mb-8 flex items-center gap-4 relative overflow-hidden">
                    <img 
                      src={user.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} 
                      className="w-16 h-16 rounded-2xl border border-indigo-500/30 object-cover shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 text-right ltr:text-left">
                      <div className="text-[10px] text-indigo-400 font-mono tracking-widest leading-none mb-1">{t("onboarding.identity_id", "ASTRONAUT REGISTRY ID")}</div>
                      <div className="text-base font-bold text-white mb-0.5">{user.displayName || (isAr ? "رائد مستكشف" : "Explorer Scientist")}</div>
                      <div className="text-xs text-indigo-300/60 leading-relaxed font-sans mt-0.5">
                        {t("onboarding.identity_sub", "تبدأ رحلتك الآن بمستوى 1 ومخزون 0 XP. استعد للارتقاء بالرتب والمجموعات المجرية!")}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      playSound("message");
                      setOnboardingStep(1);
                    }}
                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 rounded-2xl font-black text-sm text-white shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all flex items-center justify-center gap-3 group"
                  >
                    <span>{t("onboarding.identity_btn", "لوحة الهوية والبدء بيولوجياً")}</span>
                    <ChevronLeft className={cn("w-4 h-4 transition-transform", isAr ? "group-hover:-translate-x-1" : "group-hover:translate-x-1 rotate-180")} />
                  </button>
                </motion.div>
              )}

              {/* STEP 1: Select/Input Specialist designation */}
              {onboardingStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative z-10 rtl:text-right ltr:text-left"
                  dir={isAr ? "rtl" : "ltr"}
                >
                  <h2 className="text-xl md:text-2xl font-black mb-2 text-white">
                    {t("onboarding.specialty_title", "تحديد التخصص والوظيفة المدارية 🔬")}
                  </h2>
                  <p className="text-xs text-indigo-200/50 mb-6 leading-relaxed">
                    {t("onboarding.specialty_sub", "اختر هويتك العلمية أو الأكاديمية. ستعرض هذه الهوية في الملف التعريفي وقائمة تصنيفات المدار العامة.")}
                  </p>

                  {/* Predefined Beautiful Sector Badges */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {[
                      { label: isAr ? "🔬 باحث ومحلل بيانات" : "🔬 Data Analyst & Researcher", icon: "🔬", value: "🔬 باحث ومحلل بيانات" },
                      { label: isAr ? "💻 مهندس برمجيات مداري" : "💻 Orbital Software Engineer", icon: "💻", value: "💻 مهندس برمجيات مداري" },
                      { label: isAr ? "📚 طالب علم ومعرفة" : "📚 Knowledge Student", icon: "📚", value: "📚 طالب علم ومعرفة" },
                      { label: isAr ? "✍️ منشئ عوالم وصانع محتوى" : "✍️ Content Creator & Designer", icon: "✍️", value: "✍️ منشئ عوالم وصانع محتوى" },
                    ].map((badge) => (
                      <button
                        key={badge.value}
                        onClick={() => {
                          setCustomRole(badge.label);
                          playSound("message");
                        }}
                        className={cn(
                          "p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-3 relative overflow-hidden rtl:text-right ltr:text-left",
                          customRole === badge.label
                            ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                            : "bg-black/20 border-white/5 text-gray-400 hover:text-gray-200 hover:border-white/10"
                        )}
                      >
                        <span className="text-xl">{badge.icon}</span>
                        <span className="text-xs font-bold leading-tight">{badge.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Custom Slot */}
                  <div className="flex w-full gap-2 mb-6">
                    <input
                      type="text"
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                      placeholder={t("onboarding.custom_placeholder", "أو اكتب تخصصاً مخصصاً بنفسك...")}
                      className="flex-1 bg-[#060711] border border-white/10 rounded-2xl px-5 py-4 text-right ltr:text-left focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-white text-xs transition-all"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setOnboardingStep(0)}
                      className="px-6 py-4 bg-white/5 hover:bg-white/10 select-none transition-colors rounded-2xl font-bold text-xs text-gray-400"
                    >
                      {t("onboarding.prev", "السابق")}
                    </button>
                    <button
                      onClick={() => {
                        playSound("message");
                        setOnboardingStep(2);
                      }}
                      disabled={!customRole.trim()}
                      className="flex-1 py-4 bg-indigo-500 hover:bg-indigo-600 disabled:bg-[#131526] disabled:text-gray-500 transition-colors rounded-2xl font-black text-xs text-white shadow-[0_0_20px_rgba(99,102,241,0.15)] disabled:shadow-none"
                    >
                      {isAr ? "وقود والالتزام المداري" : "Fuel & Orbit Commitment"}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Goal target setting */}
              {onboardingStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative z-10 rtl:text-right ltr:text-left"
                  dir={isAr ? "rtl" : "ltr"}
                >
                  <h2 className="text-xl md:text-2xl font-black mb-2 text-white">
                    {t("onboarding.fuel", "كمية شحن مولد الوقود اليومي 🔋")}
                  </h2>
                  <p className="text-xs text-indigo-200/50 mb-6 leading-relaxed">
                    {t("onboarding.commit_sub", "اضبط غايتك اليومية من ساعات العمل والتركيز الفعال. سيعتمد النظام على هذا التارجت لمنحك المكافآت وحصاد المحاصيل.")}
                  </p>

                  <div className="space-y-3 mb-8">
                    {[
                      { 
                        title: isAr ? "⏱️ 1 ساعة: حارس المدار الهادئ (المرحلة الأساسية)" : "⏱️ 1 Hour: Peaceful Orbital Guardian", 
                        rate: "1 ساعة" 
                      },
                      { 
                        title: isAr ? "🚀 2 ساعتان: كابتن الأنظمة وداعم الطاقة" : "🚀 2 Hours: Systems Captain & Energy Booster", 
                        rate: "2 ساعتان" 
                      },
                      { 
                        title: isAr ? "🌌 4 ساعات: بطل المجرة السحيقة والجاذبية المطلقة" : "🌌 4 Hours: Deep Galaxy Hero & Absolute Gravity", 
                        rate: "4 ساعات" 
                      },
                    ].map((target) => (
                      <button
                        key={target.rate}
                        onClick={() => {
                          setDailyFocusTarget(target.rate);
                          playSound("message");
                        }}
                        className={cn(
                          "w-full p-4 rounded-2.5xl border transition-all flex items-center justify-between text-xs font-bold font-sans rtl:text-right ltr:text-left",
                          dailyFocusTarget === target.rate
                            ? "bg-indigo-500/10 border-indigo-500/50 text-white shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                            : "bg-black/20 border-white/5 text-gray-400 hover:text-gray-200"
                        )}
                      >
                        <span>{target.title}</span>
                        {dailyFocusTarget === target.rate ? (
                          <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 font-mono">SELECTED</span>
                        ) : null}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setOnboardingStep(1)}
                      className="px-6 py-4 bg-white/5 hover:bg-white/10 select-none transition-colors rounded-2xl font-bold text-xs text-gray-400"
                    >
                      {t("onboarding.prev", "السابق")}
                    </button>
                    <button
                      onClick={() => {
                        playSound("levelup");
                        handleSelectRole(customRole);
                      }}
                      className="flex-1 py-4 bg-gradient-to-r from-indigo-500 to-fuchsia-600 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all rounded-2xl font-black text-xs text-white"
                    >
                      {t("onboarding.launch", "تفعيل بروتوكول الإقلاع وعزل التشتت 👨‍🚀")}
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {selectedUserId && (
        <UserModal
          userId={selectedUserId}
          currentUserId={user.uid}
          currentUser={user}
          onClose={() => setSelectedUserId(null)}
        />
      )}

      {/* Modern Floating Top Nav */}
      <nav 
        className={cn(
           "fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl rounded-full transition-all duration-500 px-2 py-2 flex items-center justify-between border",
           scrolled 
             ? "bg-[#0b0c16]/80 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] border-white/10"
             : "bg-[#0b0c16]/40 backdrop-blur-md border-transparent shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
        )}
      >
        <div className="flex items-center">
            {/* Desktop Animated Logo */}
            <div className="hidden md:flex items-center gap-2 pr-2 pl-6 cursor-pointer group" onClick={() => handleTabChange("home")}>
              <div className="relative flex items-center justify-center w-8 h-8">
                <div className="absolute inset-0 border-2 border-indigo-500/30 rounded-full"></div>
                <div className="absolute inset-0 border-2 border-transparent border-t-indigo-400 border-l-fuchsia-400 rounded-full animate-[spin_4s_linear_infinite]"></div>
                <div className="absolute inset-1 border-2 border-transparent border-b-cyan-400 border-r-indigo-400 rounded-full animate-[spin_3s_linear_infinite_reverse]"></div>
                <div className="absolute w-2 h-2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] z-10 group-hover:scale-125 transition-transform" />
              </div>
              <span className="font-display font-black text-white text-xl tracking-wider uppercase drop-shadow-md">
                Orbit<span className="text-transparent bg-clip-text bg-gradient-to-l from-indigo-400 to-fuchsia-400">X</span>
              </span>
            </div>

            {/* Contextual Sub-Nav Categories */}
            <div className="hidden md:flex items-center bg-black/40 p-1 rounded-full border border-white/5">
              {currentCategory === "focus" && (
                <>
                  <NavPill icon={<LayoutDashboard size={14} />} label={t("nav.home", "المحطات")} active={activeTab === "home"} onClick={() => handleTabChange("home")} className="tour-step-home" />
                  <NavPill icon={<Calendar size={14} />} label={t("nav.schedule", "الجدول")} active={activeTab === "schedule"} onClick={() => handleTabChange("schedule")} className="tour-step-schedule" />
                  <NavPill icon={<Swords size={14} />} label={t("nav.challenges", "السباقات")} active={activeTab === "challenges"} onClick={() => handleTabChange("challenges")} />
                  <NavPill icon={<Bird size={14} />} label={t("nav.farm", "المزرعة")} active={activeTab === "farm"} onClick={() => handleTabChange("farm")} />
                  <NavPill icon={<Target size={14} />} label={t("nav.blackholes", "الثقوب السوداء")} active={activeTab === "blackholes"} onClick={() => handleTabChange("blackholes")} />
                </>
              )}
              {currentCategory === "community" && (
                <>
                  <NavPill icon={<Search size={14} />} label={t("nav.search", "البث")} active={activeTab === "search"} onClick={() => handleTabChange("search")} />
                  <NavPill icon={<MessageCircle size={14} />} label={t("nav.discussions", "النقاشات")} active={activeTab === "discussions"} onClick={() => handleTabChange("discussions")} className="tour-step-discussions" />
                  <NavPill icon={<Users size={14} />} label={t("nav.fleets", "الأساطيل")} active={activeTab === "fleets"} onClick={() => handleTabChange("fleets")} />
                  <NavPill icon={<Trophy size={14} />} label={t("nav.leaderboard", "التصنيف")} active={activeTab === "leaderboard"} onClick={() => handleTabChange("leaderboard")} className="tour-step-leaderboard" />
                  {/* قسم الوعي (Awareness) مخفي مؤقتاً — يمكن إرجاعه بإزالة التعليق:
                  <NavPill icon={<Radio size={14} />} label={t("nav.awareness", "الوعي")} active={activeTab === "awareness"} onClick={() => handleTabChange("awareness")} className="tour-step-awareness" />
                  */}
                </>
              )}
              {currentCategory === "profile" && (
                <>
                  <NavPill icon={<UserIcon size={14} />} label={t("nav.profile", "الملف")} active={activeTab === "profile"} onClick={() => handleTabChange("profile")} />
                  <NavPill icon={<Info size={14} />} label={t("nav.support", "الدعم والاقتراحات")} active={activeTab === "support"} onClick={() => handleTabChange("support")} />
                  {user.role === "admin" && (
                    <NavPill icon={<Shield size={14} />} label={t("nav.admin", "الإدارة")} active={activeTab === "admin"} onClick={() => handleTabChange("admin")} />
                  )}
                </>
              )}
            </div>

            {/* Mobile Title View */}
            <div className="md:hidden flex items-center gap-2 pr-3">
              <div className="relative flex items-center justify-center w-6 h-6">
                <div className="absolute inset-0 border-2 border-indigo-500/30 rounded-full"></div>
                <div className="absolute inset-0 border-2 border-transparent border-t-indigo-400 border-l-fuchsia-400 rounded-full animate-[spin_4s_linear_infinite]"></div>
                <div className="absolute inset-0.5 border-2 border-transparent border-b-cyan-400 border-r-indigo-400 rounded-full animate-[spin_3s_linear_infinite_reverse]"></div>
                <div className="absolute w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] z-10" />
              </div>
              <span className="font-display font-black text-white text-[16px] drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] tracking-wide uppercase">
                {currentCategory === 'focus' ? <>Orbit<span className="text-transparent bg-clip-text bg-gradient-to-l from-indigo-400 to-fuchsia-400">X</span> Focus</> : (currentCategory === 'community' ? <>Orbit<span className="text-transparent bg-clip-text bg-gradient-to-l from-indigo-400 to-fuchsia-400">X</span> Social</> : <>Orbit<span className="text-transparent bg-clip-text bg-gradient-to-l from-indigo-400 to-fuchsia-400">X</span> Profile</>)}
              </span>
            </div>
        </div>

        <div className="flex items-center justify-end gap-3 pl-1">
          {/* Language Toggle */}
          <button
            onClick={() => {
              toggleLanguage();
              playSound("timer");
            }}
            className="p-2 hover:bg-white/10 text-gray-400 hover:text-indigo-400 rounded-full transition-colors flex items-center justify-center relative group"
            title={lang === "ar" ? "Switch to English" : "العربية"}
          >
            <Globe2 size={18} className={cn(lang === "en" ? "text-indigo-400 animate-pulse" : "text-gray-400")} />
            <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition-all text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800/50 px-2 py-0.5 rounded whitespace-nowrap shadow-xl">
              {lang === "ar" ? "English" : "العربية"}
            </span>
          </button>

          {/* Manual Tour Trigger (Lightweight guidance) */}
          <button
            onClick={() => {
              setRunTour(true);
              playSound("timer");
            }}
            className="p-2 hover:bg-white/10 text-gray-400 hover:text-indigo-400 rounded-full transition-colors flex items-center justify-center relative group"
            title={t("top.tour", "بدء الجولة الإرشادية")}
          >
            <Info size={18} />
            <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition-all text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800/50 px-2 py-0.5 rounded whitespace-nowrap">{t("top.tour_sub", "🧭 جولة سريعة")}</span>
          </button>

          <div className="md:border-l md:border-white/10 md:pl-2">
            <NotificationsDropdown
              userId={user.uid}
              userName={user.displayName}
              userPhoto={user.photoURL}
              onOpenChallenges={() => handleTabChange("challenges")}
            />
          </div>

          {activeTab === "home" && (
            <button
               onClick={() => setShowRoleModal(true)}
               className="hidden md:flex p-2 hover:bg-white/10 rounded-full transition-colors relative group"
               title="تعديل الهوية"
            >
               <Keyboard size={18} className="text-gray-400 group-hover:text-indigo-400 transition-colors" />
            </button>
          )}

          <div
            className="tour-step-stats flex items-center gap-2.5 bg-gradient-to-r from-indigo-500/10 to-transparent hover:bg-indigo-500/20 transition-all border border-indigo-500/20 rounded-full p-1 pl-4 cursor-pointer backdrop-blur-xl group"
            onClick={() => handleTabChange("profile")}
          >
            <div className="hidden md:flex flex-col text-left mr-2">
              <div className="text-xs font-bold text-white flex items-center justify-end gap-1 group-hover:text-indigo-300 transition-colors">
                {user.displayName} {getAstronautRank(user.xp, undefined, lang).icon}
              </div>
              <div className={cn("text-[10px] font-black uppercase tracking-wider", getAstronautRank(user.xp, undefined, lang).color)}>
                {getAstronautRank(user.xp, undefined, lang).title}
              </div>
            </div>
            
            <div className="flex flex-col items-end border-r border-white/10 pr-3 mr-1">
               <div className="flex items-center gap-1.5 text-[10px] font-bold text-cyan-400">
                  <Zap size={10} /> {Math.floor(user.xp || 0).toLocaleString()} XP
               </div>
            </div>

            <div className="relative">
              <div className="w-8 h-8 rounded-full border border-indigo-500/30 overflow-hidden bg-space-dark shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                <img
                  src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
                  alt="avatar"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 px-4 lg:px-8 pt-28 pb-32 z-10 transition-all duration-300">
        <AnimatePresence mode="wait">
          <motion.div
             key={activeTab}
             initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
             animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
             exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
             transition={{ duration: 0.3 }}
             className="h-full"
          >
            <React.Suspense fallback={
              <div className="flex flex-col items-center justify-center min-h-[400px] w-full relative">
                <Rocket className="w-10 h-10 text-indigo-400 animate-bounce" />
                <p className="text-[10px] text-indigo-300 font-mono tracking-widest mt-4 animate-pulse uppercase">
                  {isAr ? "تحميل قطاع المدار الفضائي..." : "CONNECTING TO SECTOR PROTOCOL..."}
                </p>
              </div>
            }>
              {activeTab === "home" && <HomeView user={user} onEnterStation={(id) => setActiveStation(id)} onSelectUser={setSelectedUserId} />}
              {activeTab === "search" && <UserSearchView user={user} onSelectUser={setSelectedUserId} />}
              {activeTab === "profile" && <ProfileView user={user} />}
              {activeTab === "discussions" && <DiscussionsView user={user} />}
              {activeTab === "schedule" && <ScheduleView user={user} />}
              {activeTab === "challenges" && <ChallengesHubView user={user} onSelectUser={setSelectedUserId} />}
              {activeTab === "farm" && (
                <div className="max-w-4xl mx-auto animate-fade-in pb-12">
                  <FarmDisplay user={user} isOwner={true} isStudying={false} />
                </div>
              )}
              {activeTab === "leaderboard" && <LeaderboardView user={user} onSelectUser={setSelectedUserId} />}
              {activeTab === "admin" && <AdminView user={user} />}
              {activeTab === "support" && <SupportView user={user} />}
              {activeTab === "awareness" && <AwarenessView user={user} />}
              {activeTab === "blackholes" && <BlackHolesView user={user} />}
              {activeTab === "fleets" && <FleetsView user={user} />}
            </React.Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Contextual Nav Helper */}
      <div className="md:hidden fixed bottom-[90px] left-1/2 -translate-x-1/2 z-40 w-max pointer-events-none">
          <div className="pointer-events-auto flex gap-2 overflow-x-auto px-4 hide-scrollbar">
            {currentCategory === "focus" && (
                <>
                  <MobileNavPill icon={<LayoutDashboard size={14} />} label={t("nav.home", "المحطات")} active={activeTab === "home"} onClick={() => handleTabChange("home")} />
                  <MobileNavPill icon={<Calendar size={14} />} label={t("nav.schedule", "الجدول")} active={activeTab === "schedule"} onClick={() => handleTabChange("schedule")} />
                  <MobileNavPill icon={<Swords size={14} />} label={t("nav.challenges", "السباقات")} active={activeTab === "challenges"} onClick={() => handleTabChange("challenges")} className="tour-step-challenges-mobile" />
                  <MobileNavPill icon={<Bird size={14} />} label={t("nav.farm", "المزرعة")} active={activeTab === "farm"} onClick={() => handleTabChange("farm")} />
                  <MobileNavPill icon={<Target size={14} />} label={t("nav.blackholes", "الثقوب السوداء")} active={activeTab === "blackholes"} onClick={() => handleTabChange("blackholes")} />
                </>
            )}
            {/* ... Mobile Sub-nav for others ... */}
            {currentCategory === "community" && (
                <>
                  <MobileNavPill icon={<Search size={14} />} label={t("nav.search", "الاستكشاف")} active={activeTab === "search"} onClick={() => handleTabChange("search")} />
                  <MobileNavPill icon={<MessageCircle size={14} />} label={t("nav.discussions", "مجلس الحكماء")} active={activeTab === "discussions"} onClick={() => handleTabChange("discussions")} />
                  <MobileNavPill icon={<Users size={14} />} label={t("nav.fleets", "الأساطيل")} active={activeTab === "fleets"} onClick={() => handleTabChange("fleets")} />
                  <MobileNavPill icon={<Trophy size={14} />} label={t("nav.leaderboard", "المتصدرين")} active={activeTab === "leaderboard"} onClick={() => handleTabChange("leaderboard")} />
                </>
            )}
            {currentCategory === "profile" && (
                <>
                  <MobileNavPill icon={<UserIcon size={14} />} label={t("nav.profile", "الملف")} active={activeTab === "profile"} onClick={() => handleTabChange("profile")} />
                  <MobileNavPill icon={<Info size={14} />} label={t("nav.support", "الدعم والاقتراحات")} active={activeTab === "support"} onClick={() => handleTabChange("support")} />
                  {user.role === "admin" && (
                    <MobileNavPill icon={<Shield size={14} />} label={t("nav.admin", "الإدارة")} active={activeTab === "admin"} onClick={() => handleTabChange("admin")} />
                  )}
                </>
            )}
          </div>
      </div>

      {/* Floating Bottom Dock */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-2 bg-[#060713]/80 backdrop-blur-3xl p-2 rounded-full border border-white/12 shadow-[0_25px_65px_rgba(0,0,0,0.9),0_0_30px_rgba(99,102,241,0.06)] hover:border-white/20 transition-all duration-300 relative isolate before:absolute before:inset-0 before:-z-10 before:rounded-full before:bg-gradient-to-t before:from-white/[0.04] before:to-transparent before:shadow-[inset_y_1px_rgba(255,255,255,0.15)]">
          <DockButton
            icon={<Rocket size={20} />}
            label={t("cat.focus", "التركيز")}
            active={currentCategory === "focus"}
            onClick={() => setCategory("focus")}
            colorClass="from-indigo-600 to-indigo-400"
            glowClass="bg-indigo-500/30"
          />
          <DockButton
            icon={<Globe2 size={20} />}
            label={t("cat.community", "المجرة")}
            active={currentCategory === "community"}
            onClick={() => setCategory("community")}
            colorClass="from-fuchsia-600 to-pink-500"
            glowClass="bg-fuchsia-500/30"
          />
          <DockButton
            icon={<UserCircle size={20} />}
            label={t("cat.profile", "الهوية")}
            active={currentCategory === "profile"}
            onClick={() => setCategory("profile")}
            colorClass="from-cyan-600 to-emerald-400"
            glowClass="bg-cyan-500/30"
          />
        </div>
      </div>
    </div>
  );
}

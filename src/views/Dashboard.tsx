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
import { UserSearchView } from "../components/UserSearchView";

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
import HomeView from './HomeView';
import StationCard from './StationCard';
import ExhibitionGallery from './ExhibitionGallery';
import SuggestionsSection from './SuggestionsSection';
import QuranPlayer from './QuranPlayer';
import PersonalTasks from './PersonalTasks';
import StudyRoomView from './StudyRoomView';
import LeaderboardView from './LeaderboardView';
import ChatView from './ChatView';
import FocusHeatmap from './FocusHeatmap';
import ProfileView from './ProfileView';
import DiscussionsView from './DiscussionsView';
import ScheduleView from './ScheduleView';
import AdminView from './AdminView';
import SupportView from './SupportView';
import BadgeCard from './BadgeCard';
import CosmicDiary from './CosmicDiary';
import FarmDisplay from './FarmDisplay';
import UserModal from './UserModal';
import NavLink from './NavLink';
import BlackHolesView from './BlackHolesView';
import AwarenessView from './AwarenessView';
import ChallengesHubView from './ChallengesHubView';
import AnalyticsView from './AnalyticsView';
import FleetsView from './FleetsView';

export default function Dashboard({
  user,
  onLogout,
}: {
  user: UserData | null;
  onLogout: () => void;
}) {
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
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(
    !user?.missionRole && !localStorage.getItem("hasSkippedRoleModal"),
  );
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
      <StudyRoomView
        user={user}
        stationId={activeStation}
        onExit={() => setActiveStation(null)}
        onSelectUser={setSelectedUserId}
      />
    );
  }

  const focusTabs = ["home", "schedule", "challenges", "farm", "blackholes"];
  const communityTabs = [
    "chat",
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
    if (cat === "community") handleTabChange("chat");
    if (cat === "profile") handleTabChange("profile");
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    let activity = "في لوحة القيادة المركزية";
    if (tab === "chat") activity = "في الإشارات الكونية (الشات)";
    if (tab === "profile") activity = "يعاين الهوية الفضائية";
    if (tab === "discussions") activity = "في مجلس الحكماء الفضائي";
    if (tab === "schedule") activity = "يبرمج مسار الرحلة";
    if (tab === "leaderboard") activity = "يراقب التصنيف المجري 🏆";
    if (tab === "admin") activity = "في غرفة القيادة العليا 🛡️";
    if (tab === "awareness") activity = "يستقبل إشارات الوعي 📡";
    if (tab === "challenges") activity = "يتحضر للمباريات والنزالات ⚔️";
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
    <div className="min-h-screen relative flex flex-col font-sans overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200" dir="rtl">
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
              className="bg-[#0b0c16] border border-indigo-500/30 rounded-[2rem] p-8 w-full max-w-xl shadow-[0_0_80px_rgba(99,102,241,0.2)] text-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <Rocket size={160} className="text-indigo-500" />
              </div>

              <div className="relative z-10">
                <h2 className="text-2xl lg:text-3xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-l from-indigo-300 to-cyan-300">
                  حدد هويتك الفضائية 🚀
                </h2>
                <p className="text-indigo-200/60 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
                  ما هو تخصصك الأكاديمي أو المهني؟ سترافقك هذه الهوية في رحلتك عبر المدار.
                </p>

                <div className="pt-6 border-t border-white/5 flex flex-col items-center gap-4">
                  <div className="flex w-full max-w-sm gap-2">
                    <input
                      type="text"
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                      placeholder="أدخل تخصصك الفضائي..."
                      className="flex-1 bg-[#060711] border border-white/10 rounded-2xl px-5 py-4 text-right focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-white text-sm transition-all"
                    />
                    <button
                      onClick={() => handleSelectRole(customRole)}
                      disabled={!customRole.trim()}
                      className="px-6 py-4 bg-indigo-500 hover:bg-indigo-600 disabled:bg-[#131526] disabled:text-gray-500 transition-colors rounded-2xl font-bold text-sm shadow-[0_0_20px_rgba(99,102,241,0.2)] disabled:shadow-none"
                    >
                      تأكيد
                    </button>
                  </div>
                  <button
                    onClick={handleSkipRole}
                    className="text-xs font-bold text-gray-500 hover:text-indigo-400 transition-colors mt-2"
                  >
                    تجاوز مؤقتاً
                  </button>
                </div>
              </div>
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
                  <NavPill icon={<LayoutDashboard size={14} />} label="المحطات" active={activeTab === "home"} onClick={() => handleTabChange("home")} className="tour-step-home" />
                  <NavPill icon={<Calendar size={14} />} label="الجدول" active={activeTab === "schedule"} onClick={() => handleTabChange("schedule")} className="tour-step-schedule" />
                  <NavPill icon={<Swords size={14} />} label="النزالات ⚔️" active={activeTab === "challenges"} onClick={() => handleTabChange("challenges")} />
                  <NavPill icon={<Bird size={14} />} label="المزرعة" active={activeTab === "farm"} onClick={() => handleTabChange("farm")} />
                  <NavPill icon={<Target size={14} />} label="الثقوب السوداء" active={activeTab === "blackholes"} onClick={() => handleTabChange("blackholes")} />
                </>
              )}
              {currentCategory === "community" && (
                <>
                  <NavPill icon={<MessageSquare size={14} />} label="الشات" active={activeTab === "chat"} onClick={() => handleTabChange("chat")} className="tour-step-chat" />
                  <NavPill icon={<Search size={14} />} label="البث" active={activeTab === "search"} onClick={() => handleTabChange("search")} />
                  <NavPill icon={<MessageCircle size={14} />} label="النقاشات" active={activeTab === "discussions"} onClick={() => handleTabChange("discussions")} className="tour-step-discussions" />
                  <NavPill icon={<Users size={14} />} label="الأساطيل" active={activeTab === "fleets"} onClick={() => handleTabChange("fleets")} />
                  <NavPill icon={<Trophy size={14} />} label="التصنيف" active={activeTab === "leaderboard"} onClick={() => handleTabChange("leaderboard")} className="tour-step-leaderboard" />
                  <NavPill icon={<Radio size={14} />} label="الوعي" active={activeTab === "awareness"} onClick={() => handleTabChange("awareness")} className="tour-step-awareness" />
                </>
              )}
              {currentCategory === "profile" && (
                <>
                  <NavPill icon={<UserIcon size={14} />} label="الملف" active={activeTab === "profile"} onClick={() => handleTabChange("profile")} />
                  <NavPill icon={<Info size={14} />} label="الدعم والاقتراحات" active={activeTab === "support"} onClick={() => handleTabChange("support")} />
                  {user.role === "admin" && (
                    <NavPill icon={<Shield size={14} />} label="الإدارة" active={activeTab === "admin"} onClick={() => handleTabChange("admin")} />
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
          {/* Manual Tour Trigger (Lightweight guidance) */}
          <button
            onClick={() => {
              setRunTour(true);
              playSound("timer");
            }}
            className="p-2 hover:bg-white/10 text-gray-400 hover:text-indigo-400 rounded-full transition-colors flex items-center justify-center relative group"
            title="بدء الجولة الإرشادية"
          >
            <Info size={18} />
            <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition-all text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800/50 px-2 py-0.5 rounded whitespace-nowrap">🧭 جولة سريعة</span>
          </button>

          <div className="md:border-l md:border-white/10 md:pl-2">
            <NotificationsDropdown userId={user.uid} />
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
                {user.displayName} {getAstronautRank(user.xp).icon}
              </div>
              <div className={cn("text-[10px] font-black uppercase tracking-wider", getAstronautRank(user.xp).color)}>
                {getAstronautRank(user.xp).title}
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
            {activeTab === "home" && <HomeView user={user} onEnterStation={(id) => setActiveStation(id)} onSelectUser={setSelectedUserId} />}
            {activeTab === "chat" && <ChatView user={user} onSelectUser={setSelectedUserId} />}
            {activeTab === "search" && <UserSearchView user={user} onSelectUser={setSelectedUserId} />}
            {activeTab === "profile" && <ProfileView user={user} />}
            {activeTab === "discussions" && <DiscussionsView user={user} />}
            {activeTab === "schedule" && <ScheduleView user={user} />}
            {activeTab === "challenges" && <ChallengesHubView user={user} onEnterStation={(id) => setActiveStation(id)} onSelectUser={setSelectedUserId} />}
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
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Contextual Nav Helper */}
      <div className="md:hidden fixed bottom-[90px] left-1/2 -translate-x-1/2 z-40 w-max pointer-events-none">
          <div className="pointer-events-auto flex gap-2 overflow-x-auto px-4 hide-scrollbar">
            {currentCategory === "focus" && (
                <>
                  <MobileNavPill icon={<LayoutDashboard size={14} />} label="المحطات" active={activeTab === "home"} onClick={() => handleTabChange("home")} />
                  <MobileNavPill icon={<Calendar size={14} />} label="الجدول" active={activeTab === "schedule"} onClick={() => handleTabChange("schedule")} />
                  <MobileNavPill icon={<Swords size={14} />} label="النزالات ⚔️" active={activeTab === "challenges"} onClick={() => handleTabChange("challenges")} className="tour-step-challenges-mobile" />
                  <MobileNavPill icon={<Bird size={14} />} label="المزرعة" active={activeTab === "farm"} onClick={() => handleTabChange("farm")} />
                  <MobileNavPill icon={<Target size={14} />} label="الثقوب السوداء" active={activeTab === "blackholes"} onClick={() => handleTabChange("blackholes")} />
                </>
            )}
            {/* ... Mobile Sub-nav for others ... */}
            {currentCategory === "community" && (
                <>
                  <MobileNavPill icon={<MessageSquare size={14} />} label="الشات" active={activeTab === "chat"} onClick={() => handleTabChange("chat")} />
                  <MobileNavPill icon={<Search size={14} />} label="الاستكشاف" active={activeTab === "search"} onClick={() => handleTabChange("search")} />
                  <MobileNavPill icon={<MessageCircle size={14} />} label="مجلس الحكماء" active={activeTab === "discussions"} onClick={() => handleTabChange("discussions")} />
                  <MobileNavPill icon={<Users size={14} />} label="الأساطيل" active={activeTab === "fleets"} onClick={() => handleTabChange("fleets")} />
                  <MobileNavPill icon={<Trophy size={14} />} label="المتصدرين" active={activeTab === "leaderboard"} onClick={() => handleTabChange("leaderboard")} />
                </>
            )}
            {currentCategory === "profile" && (
                <>
                  <MobileNavPill icon={<UserIcon size={14} />} label="الملف" active={activeTab === "profile"} onClick={() => handleTabChange("profile")} />
                  <MobileNavPill icon={<Info size={14} />} label="الدعم والاقتراحات" active={activeTab === "support"} onClick={() => handleTabChange("support")} />
                  {user.role === "admin" && (
                    <MobileNavPill icon={<Shield size={14} />} label="الإدارة" active={activeTab === "admin"} onClick={() => handleTabChange("admin")} />
                  )}
                </>
            )}
          </div>
      </div>

      {/* Floating Bottom Dock */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-1.5 bg-[#080914]/80 backdrop-blur-3xl p-2 rounded-full border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.8)] relative isolate before:absolute before:inset-0 before:-z-10 before:rounded-full before:bg-gradient-to-t before:from-white/5 before:to-transparent">
          <DockButton
            icon={<Rocket size={20} />}
            label="التركيز"
            active={currentCategory === "focus"}
            onClick={() => setCategory("focus")}
            colorClass="from-indigo-600 to-indigo-400"
            glowClass="bg-indigo-500/30"
          />
          <DockButton
            icon={<Globe2 size={20} />}
            label="المجرة"
            active={currentCategory === "community"}
            onClick={() => setCategory("community")}
            colorClass="from-fuchsia-600 to-pink-500"
            glowClass="bg-fuchsia-500/30"
          />
          <DockButton
            icon={<UserCircle size={20} />}
            label="الهوية"
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

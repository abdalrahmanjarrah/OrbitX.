import { Joyride } from "react-joyride";
import { playSound } from "./lib/sound";
import { useRenderLog, authorizeDebugger } from "./firebaseDebug";
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
import StarBackground from "./components/StarBackground";

import { cn } from "./lib/utils";
import {
  auth,
  db,
  signInWithGoogle,
  logout,
  handleFirestoreError,
  OperationType,
} from "./firebase";
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
import { UserSearchView } from "./components/UserSearchView";

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


import { SURAHS, getAstronautRank, BADGES, MeteorEffect, RECITERS, UserData, Fleet, Discussion, Reply, ScheduleItem, Room, Challenge, AwarenessSignal, Message, ErrorBoundary } from './shared';
import LandingPage from './components/LandingPage';
import NotificationsDropdown from './views/NotificationsDropdown';
import Dashboard from './views/Dashboard';
import NavPill from './views/NavPill';
import MobileNavPill from './views/MobileNavPill';
import DockButton from './views/DockButton';
import ChallengeModal from './views/ChallengeModal';
import ArticleModal from './views/ArticleModal';
import HomeView from './views/HomeView';
import StationCard from './views/StationCard';
import ExhibitionGallery from './views/ExhibitionGallery';
import SuggestionsSection from './views/SuggestionsSection';
import QuranPlayer from './views/QuranPlayer';
import PersonalTasks from './views/PersonalTasks';
import StudyRoomView from './views/StudyRoomView';
import LeaderboardView from './views/LeaderboardView';
import ChatView from './views/ChatView';
import FocusHeatmap from './views/FocusHeatmap';
import ProfileView from './views/ProfileView';
import DiscussionsView from './views/DiscussionsView';
import ScheduleView from './views/ScheduleView';
import AdminView from './views/AdminView';
import BadgeCard from './views/BadgeCard';
import CosmicDiary from './views/CosmicDiary';
import FarmDisplay from './views/FarmDisplay';
import UserModal from './views/UserModal';
import NavLink from './views/NavLink';
import BlackHolesView from './views/BlackHolesView';
import AwarenessView from './views/AwarenessView';
import AnalyticsView from './views/AnalyticsView';
import FleetsView from './views/FleetsView';

function App() {
  useRenderLog("App");
  const [user, loading] = useAuthState(auth);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [view, setView] = useState<"landing" | "dashboard">("landing");
  const lastSyncedProfileRef = useRef<string>("");
  const previousLevelRef = useRef<number | null>(null);
  const previousUserUidRef = useRef<string | null>(null);

  useEffect(() => {
    if (user) {
      if (userData) {
        const isAuthorized = import.meta.env.DEV || userData.role === "admin";
        authorizeDebugger(isAuthorized);
      }
    } else {
      authorizeDebugger(!!import.meta.env.DEV);
    }
  }, [user, userData]);

  const [isQuotaExceeded, setIsQuotaExceeded] = useState(
    typeof window !== "undefined" && !!(window as any).__firestoreQuotaExceeded
  );

  useEffect(() => {
    const handleQuota = () => {
      setIsQuotaExceeded(true);
    };
    window.addEventListener("firestore_quota_exceeded", handleQuota);
    return () => {
      window.removeEventListener("firestore_quota_exceeded", handleQuota);
    };
  }, []);

  useEffect(() => {
    if (user) {
      // Activity tracking
      let lastActivityUpdate = 0;
      const updateActivity = () => {
        if (typeof window !== "undefined" && (window as any).__firestoreQuotaExceeded) {
          return; // Guard against further quota errors when resource is exhausted
        }
        const now = Date.now();
        if (now - lastActivityUpdate > 60000) {
          // Throttle to 1 min
          lastActivityUpdate = now;
          updateDoc(doc(db, "profiles", user.uid), {
            lastActiveTime: now,
          }).catch(() => {});
        }
      };

      const activityEvents = ["mousedown", "keydown", "touchstart"];
      activityEvents.forEach((e) =>
        window.addEventListener(e, updateActivity, { passive: true }),
      );
      updateActivity(); // Initial track

      const userRef = doc(db, "users", user.uid);
      const unsubscribe = onSnapshot(
        userRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserData;
            // Auto-upgrade to admin if email matches
            const isAdminEmail =
              user.email === "lumafashionhq@gmail.com" ||
              user.email === "abdalrahmanjarrah94@gmail.com";
            if (isAdminEmail && data.role !== "admin") {
              updateDoc(userRef, { role: "admin" }).catch((e) =>
                handleFirestoreError(
                  e,
                  OperationType.WRITE,
                  `users/${user.uid}`,
                ),
              );
              data.role = "admin";
            }
            setUserData(data);
            setView("dashboard");
          } else {
            // Initialize new user
            const isAdminEmail =
              user.email === "lumafashionhq@gmail.com" ||
              user.email === "abdalrahmanjarrah94@gmail.com";

            const newUserData: UserData = {
              uid: user.uid,
              displayName: user.displayName || "رائد فضاء",
              email: user.email || "",
              photoURL: user.photoURL || "",
              level: 1,
              xp: 0,
              role: isAdminEmail ? "admin" : "user",
              friendsCount: 0,
              banned: false,
              currentActivity: "في لوحة التحكم",
              streak: 1,
              lastActiveDate: new Date().toISOString().split("T")[0],
            };

            const initUser = async () => {
                await setDoc(userRef, newUserData).catch((e) =>
                  handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`),
                );

                const profileRef = doc(db, "profiles", user.uid);
                await setDoc(profileRef, {
                  uid: user.uid,
                  displayName: user.displayName || "رائد فضاء",
                  photoURL: user.photoURL || "",
                  bio: "",
                  level: 1,
                  xp: 0,
                  totalFocusSessions: 0,
                  friendsCount: 0,
                  role: isAdminEmail ? "admin" : "user",
                  banned: false,
                  currentActivity: "في لوحة التحكم",
                  streak: 1,
                  lastActiveDate: new Date().toISOString().split("T")[0],
                }, { merge: true }).catch((e) =>
                  handleFirestoreError(e, OperationType.WRITE, `profiles/${user.uid}`)
                );
            };
            initUser();
          }
        },
        (e) => handleFirestoreError(e, OperationType.GET, `users/${user.uid}`),
      );

      return () => {
        unsubscribe();
        activityEvents.forEach((e) =>
          window.removeEventListener(e, updateActivity),
        );
      };
    } else {
      setUserData(null);
      setView("landing");
    }
  }, [user]);

  // Hearts recovery logic removed

  useEffect(() => {
    if (userData && userData.uid) {
      const today = new Date().toISOString().split("T")[0];
      const lastActive = userData.lastActiveDate;

      if (lastActive !== today) {
        const userRef = doc(db, "users", userData.uid);
        updateDoc(userRef, {
          lastActiveDate: today,
        }).catch((e) => console.error("Active date update failed", e));
      }
    }
  }, [userData?.uid, userData?.lastActiveDate]);

  useEffect(() => {
    if (userData) {
      const newBadges: string[] = [...(userData.badges || [])];
      let changed = false;

      // Starter Badge (awarded on having at least 25 XP)
      if (
        userData.xp >= 25 &&
        !newBadges.includes("starter")
      ) {
        newBadges.push("starter");
        changed = true;
      }
      // Focus 10 Badge (awarded on having at least 250 XP)
      if (
        userData.xp >= 250 &&
        !newBadges.includes("focus_10")
      ) {
        newBadges.push("focus_10");
        changed = true;
      }
      // Master Focus Badge (previously streak_7, awarded on 1000 XP)
      if (
        userData.xp >= 1000 &&
        !newBadges.includes("streak_7")
      ) {
        newBadges.push("streak_7");
        changed = true;
      }
      if (userData.level >= 30 && !newBadges.includes("level_30")) {
        newBadges.push("level_30");
        changed = true;
      }

      if (changed) {
        updateDoc(doc(db, "users", userData.uid), {
          badges: newBadges,
        }).catch((e) => console.error("Badge update failed", e));
      }
    }
  }, [
    userData?.xp,
    userData?.level,
    userData?.uid,
  ]);

  useEffect(() => {
    if (userData) {
      const calculatedLevel = Math.floor(userData.xp / 1000) + 1;
      const sessionKey = `lastCelebratedLevel_${userData.uid}`;
      
      // Initial load or user change: silently initialize without triggering the toast
      if (previousUserUidRef.current !== userData.uid || previousLevelRef.current === null) {
        previousUserUidRef.current = userData.uid;
        
        const celebratedLevelStr = sessionStorage.getItem(sessionKey);
        const celebratedLevel = celebratedLevelStr ? parseInt(celebratedLevelStr, 10) : null;
        
        // Make sure previousLevelRef is initialized to the highest verified level
        previousLevelRef.current = Math.max(calculatedLevel, celebratedLevel !== null ? celebratedLevel : calculatedLevel);
        
        if (celebratedLevel === null) {
          sessionStorage.setItem(sessionKey, String(calculatedLevel));
        }
        return;
      }

      const celebratedLevelStr = sessionStorage.getItem(sessionKey);
      const celebratedLevel = celebratedLevelStr ? parseInt(celebratedLevelStr, 10) : null;

      // Genuine promotion transition where the calculated level exceeds what was previously seen and celebrated
      if (calculatedLevel > previousLevelRef.current && (celebratedLevel === null || calculatedLevel > celebratedLevel)) {
        setShowLevelUp(true);
        playSound("levelup");
        sessionStorage.setItem(sessionKey, String(calculatedLevel));
        setTimeout(() => setShowLevelUp(false), 5000);
      }
      
      // Always keep the persistent ref updated with the latest state
      previousLevelRef.current = calculatedLevel;
    }
  }, [userData?.xp, userData?.level, userData?.uid]);

  useEffect(() => {
    if (userData) {
      const publicData = {
        uid: userData.uid,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        bio: userData.bio || "",
        level: userData.level,
        xp: userData.xp,
        totalFocusSessions: userData.totalFocusSessions || 0,
        friendsCount: userData.friendsCount || 0,
        role: userData.role,
        banned: userData.banned || false,
        currentActivity: userData.currentActivity || "في المدار",
      };
      
      const serialized = JSON.stringify(publicData);
      if (lastSyncedProfileRef.current === serialized) {
        return;
      }
      if (typeof window !== "undefined" && (window as any).__firestoreQuotaExceeded) {
        return; // Guard profile updates
      }
      lastSyncedProfileRef.current = serialized;

      const profileRef = doc(db, "profiles", userData.uid);
      setDoc(profileRef, publicData, { merge: true }).catch((e) =>
        console.error("Profile sync failed", e),
      );
    }
  }, [userData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-space-dark flex items-center justify-center">
        <Rocket className="w-12 h-12 text-indigo-400 animate-bounce" />
      </div>
    );
  }

  if (view === "landing" && !user) {
    return <LandingPage onLogin={signInWithGoogle} />;
  }

  if (userData?.banned) {
    return (
      <div className="min-h-screen bg-space-dark flex flex-col items-center justify-center p-4 text-center">
        <ShieldAlert className="w-24 h-24 text-red-500 mb-6" />
        <h1 className="text-4xl font-bold text-white mb-4">تم حظر حسابك</h1>
        <p className="text-gray-400 max-w-md">
          لقد تم حظر وصولك إلى المنصة بسبب مخالفة القوانين. إذا كنت تعتقد أن هذا
          خطأ، يرجى التواصل مع الإدارة.
        </p>
        <button
          onClick={logout}
          className="mt-8 px-8 py-3 bg-white/5 rounded-xl hover:bg-[#0a0b16]/20 transition-all"
        >
          تسجيل الخروج
        </button>
      </div>
    );
  }

  return (
    <>
      {isQuotaExceeded && (
        <div className="bg-gradient-to-r from-amber-600/90 to-red-600/90 text-white text-xs md:text-sm py-2.5 px-4 text-center font-semibold relative z-[300] shadow-md flex items-center justify-center gap-2 select-none">
          <span>🛡️ نظام الفضاء الرديف: ميزانية قاعدة البيانات المجانية لـ Firebase تجاوزت الحد المسموح به اليوم. نحن نوجه جميع عملياتك بنجاح محلياً لضمان تركيزك التام ومواصلة إنتاجيتك دون انقطاع.</span>
          <button onClick={() => setIsQuotaExceeded(false)} className="underline hover:text-white/80 transition ml-2 text-[10px] md:text-sm font-bold bg-white/10 px-2 py-0.5 rounded">إخفاء</button>
        </div>
      )}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-gradient-to-r from-yellow-400 to-orange-500 p-1 rounded-2xl shadow-2xl shadow-indigo-900/20 shadow-orange-500/40"
          >
            <div className="bg-[#0a0b16] px-8 py-4 rounded-[calc(1rem-1px)] flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-400/20 rounded-full flex items-center justify-center text-2xl">
                🎊
              </div>
              <div className="text-right">
                <h3 className="text-lg font-black text-white">ترقية جديدة!</h3>
                <p className="text-gray-400 text-xs">
                  لقد وصلت للمستوى {userData?.level}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <QuranPlayer />
      <Dashboard user={userData} onLogout={logout} />
    </>
  );
}

import GlobalAdminAlert from "./views/GlobalAdminAlert";

export default function WrappedApp() {
  return (
    <ErrorBoundary>
      <GlobalAdminAlert />
      <App />
    </ErrorBoundary>
  );
}
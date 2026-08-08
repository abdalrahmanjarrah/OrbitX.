import { Joyride } from "react-joyride";
import { playSound } from "../lib/sound";
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


import { SURAHS, getAstronautRank, BADGES, MeteorEffect, RECITERS, UserData, Fleet, Discussion, Reply, ScheduleItem, Room, Challenge, AwarenessSignal, Message } from '../shared';
import NotificationsDropdown from './NotificationsDropdown';
import Dashboard from './Dashboard';
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
import FocusHeatmap from './FocusHeatmap';
import ProfileView from './ProfileView';
import DiscussionsView from './DiscussionsView';
import ScheduleView from './ScheduleView';
import AdminView from './AdminView';
import BadgeCard from './BadgeCard';
import CosmicDiary from './CosmicDiary';
import UserModal from './UserModal';
import NavLink from './NavLink';
import BlackHolesView from './BlackHolesView';
import AwarenessView from './AwarenessView';
import AnalyticsView from './AnalyticsView';
import FleetsView from './FleetsView';
import { useLanguage } from '../context/LanguageContext';

export default function FarmDisplay({
  user,
  isOwner,
  isStudying = true,
}: {
  user: UserData;
  isOwner: boolean;
  isStudying?: boolean;
}) {
  const [show3DFarm, setShow3DFarm] = useState(false);
  const { isAr, t } = useLanguage();

  return (
    <>
      {show3DFarm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
           <div className="bg-[#050510] border border-cyan-800 p-8 rounded-2xl text-center">
             <h2 className="text-xl text-cyan-300 mb-4">
               {isAr ? "قسم العوالم ثلاثية الأبعاد قيد التطوير والبرمجة" : "Farm 3D is under construction"}
             </h2>
             <button onClick={() => setShow3DFarm(false)} className="px-6 py-2 bg-cyan-900 border border-cyan-400 rounded-lg text-cyan-100 hover:bg-cyan-800">
               {isAr ? "إغلاق" : "Close"}
             </button>
           </div>
        </div>
      )}

      <div className={cn("bg-[#0b0c16] border border-white/5 rounded-3xl p-8 shadow-2xl relative mb-8 overflow-hidden", isAr ? "text-right" : "text-left")}>
        {/* Work In Progress Lock Overlay */}
        <div className="absolute inset-0 z-50 bg-[#0a0b16]/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <div className="p-4 bg-[#0a0b16] rounded-full shadow-2xl shadow-yellow-500/20 mb-4 border border-yellow-500/30">
              <Lock className="w-10 h-10 text-yellow-500" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2 font-['Space_Grotesk']">
              {isAr ? "قريباً.. 🚀" : "Coming Soon.. 🚀"}
            </h3>
            <p className="text-gray-300 max-w-sm">
              {isAr 
                ? "نعمل حالياً على تطوير قسم عوالم الإنجاز (3D) ليكون جاهزاً وممتعاً. سيتم إطلاقه قريباً!"
                : "We are currently developing the cosmic achievements outer worlds (3D) to be interactive and fun. Launching soon!"}
            </p>
        </div>

        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1623512224734-8c88682a85e6?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c16] via-[#0b0c16]/80 to-transparent"></div>

        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <h2 className="text-3xl font-bold text-white mb-2 font-['Space_Grotesk']">
            {isAr ? "عوالم الإنجاز (3D)" : "Achievement Worlds (3D)"}
          </h2>
          <p className="text-gray-400 mb-8 max-w-lg">
            {isOwner
              ? (isAr ? "ادخل إلى عالمك الخاص في تجربة ثلاثية الأبعاد، ازرع، اربِ الحيوانات وابنِ مزرعتك!" : "Enter your personal universe in an interactive 3D space. Cultivate cosmic flora and fauna!")
              : (isAr ? `استكشف عالم ${user.displayName} الخاص` : `Explore ${user.displayName}'s private biome`)}
          </p>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl w-full max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className={cn("bg-black/40 p-4 rounded-xl border border-white/5 flex gap-4 justify-center items-center", isAr ? "flex-row" : "flex-row-reverse")}>
                <div className="flex flex-col items-center">
                  <span className="text-gray-400 text-xs mb-1">
                    {isAr ? "الخبرة (XP)" : "Experience (XP)"}
                  </span>
                  <span className="text-emerald-400 text-xl font-bold">
                    💎 {user.xp || 0}
                  </span>
                </div>
                <div className="w-px h-8 bg-white/10"></div>
                <div className="flex flex-col items-center">
                  <span className="text-gray-400 text-xs mb-1">
                    {isAr ? "المستوى" : "Level"}
                  </span>
                  <span className="text-sky-400 text-xl font-bold">
                    ⭐ {user.level || 1}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShow3DFarm(true)}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold p-4 py-5 rounded-xl shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center gap-3 animate-pulse-slow block w-full"
              >
                <span className="text-3xl">🌍</span>
                <span className="text-xl">
                  {isOwner 
                    ? (isAr ? "دخول عالمي الخاص" : "Deploy My Universe")
                    : (isAr ? "دخول العالم" : "Enter Universe")}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

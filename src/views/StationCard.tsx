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
    return originalOnSnapshot(...args);
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
import BadgeCard from './BadgeCard';
import CosmicDiary from './CosmicDiary';
import FarmDisplay from './FarmDisplay';
import UserModal from './UserModal';
import NavLink from './NavLink';
import BlackHolesView from './BlackHolesView';
import AwarenessView from './AwarenessView';
import AnalyticsView from './AnalyticsView';
import FleetsView from './FleetsView';

const bentoItem = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  },
};

export default function StationCard({
  room,
  activeUsers,
  onEnter,
  isAdmin,
}: {
  room: Room;
  activeUsers?: UserData[];
  onEnter: () => void;
  isAdmin?: boolean;
}) {
  const [uptime, setUptime] = useState("");
  useEffect(() => {
    const updateTime = () => {
      let accumulatedFocusSeconds = room.accumulatedFocusSeconds || 0;
      if (room.timerStatus === "focus" && room.startTime) {
        const start = room.startTime.toMillis
          ? room.startTime.toMillis()
          : room.startTime.seconds * 1000 || Date.now();
        accumulatedFocusSeconds += Math.max(0, Math.floor((Date.now() - start) / 1000));
      }
      if (accumulatedFocusSeconds < 60) setUptime("نشط الآن");
      else if (accumulatedFocusSeconds < 3600) setUptime(`${Math.floor(accumulatedFocusSeconds / 60)} د`);
      else setUptime(`${Math.floor(accumulatedFocusSeconds / 3600)} س`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [room.accumulatedFocusSeconds, room.timerStatus, room.startTime]);

  const isFocusing = room.timerStatus === "focus";

  return (
    <motion.div
      variants={bentoItem}
      onClick={onEnter}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onEnter(); }}
      className={cn(
        "relative rounded-[2rem] p-6 text-right flex flex-col justify-between aspect-square md:aspect-[4/5] overflow-hidden group cursor-pointer border transition-all duration-700 hover:-translate-y-2",
        room.imageUrl ? "border-transparent" : (isFocusing ? "bg-[#0b0c1b] border-indigo-500/30 shadow-[0_0_40px_rgba(99,102,241,0.15)]" : "bg-[#080914] border-white/5 hover:border-white/10")
      )}
      style={
        room.imageUrl
          ? { backgroundImage: `linear-gradient(135deg, rgba(8, 9, 20, 0.9) 0%, rgba(15, 17, 35, 0.6) 100%), url(${room.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : {}
      }
    >
      {/* Orbital/Planetary Effects */}
      {!room.imageUrl && isFocusing && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
           {/* Center Planet Glow */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-indigo-500/20 blur-[40px] rounded-full mix-blend-screen group-hover:scale-110 transition-transform duration-1000" />
           {/* Orbit Rings */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-indigo-500/10 rounded-full border-dashed animate-[spin_10s_linear_infinite]" />
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-cyan-500/10 rounded-full border-dotted animate-[spin_15s_linear_infinite_reverse]" />
           {/* Corner Nebulas */}
           <div className="absolute -top-20 -right-20 w-64 h-64 bg-fuchsia-500/10 blur-[60px] rounded-full group-hover:bg-fuchsia-500/20 transition-colors duration-700" />
           <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-500/5 blur-[50px] rounded-full group-hover:bg-cyan-500/10 transition-colors duration-700" />
        </div>
      )}

      {/* Header logic */}
      <div className="relative z-10 flex items-start justify-between">
         <div className={cn("px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-1.5 text-xs font-bold border shadow-sm", isFocusing ? "bg-indigo-500/20 text-indigo-200 border-indigo-400/30" : "bg-white/5 text-gray-400 border-white/10")}>
            <div className={cn("w-1.5 h-1.5 rounded-full", isFocusing ? "bg-cyan-400 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" : "bg-gray-500")} />
            {isFocusing ? "حالة التدفق" : "في المدار"}
         </div>
         {isAdmin && (
            <button
               onClick={async (e) => { e.stopPropagation(); if(window.confirm('حذف المحطة؟')) await deleteDoc(doc(db, "rooms", room.id)).catch(()=>{}); }}
               className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-full transition-colors backdrop-blur-md"
            >
               <Trash2 size={14} />
            </button>
         )}
      </div>

      {/* Main Content */}
      <div className="relative z-10 mt-auto pb-4">
         <h4 className="text-2xl sm:text-3xl font-black font-display text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-l group-hover:from-white group-hover:to-cyan-300 transition-all duration-500 leading-tight">
            {room.name}
         </h4>
         <div className="flex items-center gap-2 text-sm font-bold text-indigo-300/80">
            <Timer size={14} className={isFocusing ? "text-cyan-400/80 animate-pulse" : "text-gray-500"} /> {uptime}
         </div>
      </div>

      {/* Footer / Participants */}
      <div className="relative z-10 pt-4 border-t border-white/5 flex justify-between items-center bg-gradient-to-t from-[#000]/40 to-transparent -mx-6 px-6 -mb-6 h-16 backdrop-blur-[2px]">
         <div className="flex flex-row-reverse items-center -space-x-3 w-1/2 justify-end">
            {room.participants.slice(0, 4).map((p, i) => {
              const userMatch = activeUsers?.find((u) => u.uid === p);
              return (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-[#090a16] bg-gray-800 overflow-hidden relative z-10 hover:z-20 transform transition-all duration-300 hover:scale-125 shadow-lg"
                  title={userMatch?.displayName || "رائد"}
                >
                  <img src={userMatch?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p}`} alt="user" className="w-full h-full object-cover" />
                </div>
              );
            })}
            {room.participants.length > 4 && (
              <div className="w-8 h-8 rounded-full border-2 border-[#090a16] bg-indigo-600/80 backdrop-blur-sm flex items-center justify-center text-[10px] font-black text-white relative z-10 shadow-lg">
                +{room.participants.length - 4}
              </div>
            )}
         </div>
         <div className="flex items-center gap-1 text-[11px] font-black tracking-wide text-indigo-400/80 group-hover:text-cyan-300 transition-colors uppercase">
            استكشاف <ChevronLeft size={14} className="group-hover:-translate-x-1.5 transition-transform duration-300" />
         </div>
      </div>
    </motion.div>
  );
}

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
import StationCard from './StationCard';
import ExhibitionGallery from './ExhibitionGallery';
import SuggestionsSection from './SuggestionsSection';
import QuranPlayer from './QuranPlayer';
import PersonalTasks from './PersonalTasks';
import StudyRoomView from './StudyRoomView';
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

export default function LeaderboardView({
  user,
  onSelectUser,
}: {
  user: UserData;
  onSelectUser: (id: string) => void;
}) {
  const [leaders, setLeaders] = useState<UserData[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "profiles"),
      orderBy("xp", "desc"),
      limit(50),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setLeaders(snapshot.docs.map((doc) => doc.data() as UserData));
      },
      (e) => handleFirestoreError(e, OperationType.GET, "profiles_leaderboard"),
    );
    return () => unsubscribe();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-black flex items-center gap-3">
          <Trophy className="text-yellow-400" size={32} />
          قائمة المتصدرين
        </h2>
        <div className="px-4 py-2 bg-[#0a0b16] shadow-lg shadow-indigo-900/10 rounded-xl border border-white/10 text-sm text-gray-400">
          أفضل 50 رائد فضاء
        </div>
      </div>

      <div className="bg-[#0a0b16] shadow-lg shadow-indigo-900/10 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-lg bg-[#0a0b16]/60">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-sm font-bold text-gray-400">
          <div className="col-span-1 text-center">المركز</div>
          <div className="col-span-6">الرائد</div>
          <div className="col-span-2 text-center">المستوى</div>
          <div className="col-span-3 text-center">نقاط الخبرة (XP)</div>
        </div>

        <div className="divide-y divide-white/5">
          {leaders.map((leader, index) => {
            const isTop3 = index < 3;
            const rankStyle =
              index === 0
                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                : index === 1
                  ? "bg-gray-300/20 text-gray-300 border-gray-300/30"
                  : index === 2
                    ? "bg-amber-700/20 text-amber-600 border-amber-700/30"
                    : "bg-[#0a0b16] shadow-lg shadow-indigo-900/10 text-gray-400 border-white/10";

            return (
              <motion.div
                key={leader.uid}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "grid grid-cols-12 gap-4 p-4 items-center transition-colors hover:bg-[#0a0b16] shadow-lg shadow-indigo-900/10",
                  leader.uid === user.uid && "bg-indigo-500/200/10",
                )}
              >
                <div className="col-span-1 flex justify-center">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold border",
                      rankStyle,
                    )}
                  >
                    {index + 1}
                  </div>
                </div>

                <div className="col-span-6 flex items-center gap-3">
                  <button
                    onClick={() => onSelectUser(leader.uid)}
                    className="relative group"
                  >
                    <img
                      src={leader.photoURL}
                      className="w-10 h-10 rounded-full border border-white/10 group-hover:border-indigo-400 transition-colors"
                      referrerPolicy="no-referrer"
                    />
                    {leader.uid === user.uid && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-indigo-500/200 rounded-full border-2 border-[#0a0a1a] flex items-center justify-center">
                        <Star size={8} className="text-white" />
                      </div>
                    )}
                  </button>
                  <div className="flex flex-col">
                    <button
                      onClick={() => onSelectUser(leader.uid)}
                      className="font-bold text-right hover:text-indigo-500 transition-colors"
                    >
                      {leader.displayName}
                    </button>
                    <span
                      className={cn(
                        "text-[10px] font-bold",
                        getAstronautRank(leader.xp).color,
                      )}
                    >
                      {getAstronautRank(leader.xp).title}
                    </span>
                  </div>
                </div>

                <div className="col-span-2 flex justify-center">
                  <div className="px-3 py-1 bg-[#0a0b16] shadow-lg shadow-indigo-900/10 rounded-lg font-mono font-bold text-indigo-500">
                    {leader.level}
                  </div>
                </div>

                <div className="col-span-3 flex justify-center">
                  <div className="flex items-center gap-1 font-mono font-bold text-yellow-400">
                    <Zap size={14} />
                    {leader.xp.toLocaleString()}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

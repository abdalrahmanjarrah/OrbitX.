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
import LeaderboardView from './LeaderboardView';
import ChatView from './ChatView';
import FocusHeatmap from './FocusHeatmap';
import ProfileView from './ProfileView';
import DiscussionsView from './DiscussionsView';
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

export default function ScheduleView({ user }: { user: UserData }) {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [day, setDay] = useState("الأحد");
  const [time, setTime] = useState("");
  const [task, setTask] = useState("");
  const DAYS = [
    "الأحد",
    "الأثنين",
    "الثلاثاء",
    "الأربعاء",
    "الخميس",
    "الجمعة",
    "السبت",
  ];

  useEffect(() => {
    const q = query(
      collection(db, "users", user.uid, "schedule"),
      orderBy("time", "asc"),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setItems(
          snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as ScheduleItem,
          ),
        );
      },
      (e) =>
        handleFirestoreError(
          e,
          OperationType.GET,
          `users/${user.uid}/schedule`,
        ),
    );
    return () => unsubscribe();
  }, [user.uid]);

  const handleAddItem = async () => {
    if (!time || !task) return;
    try {
      await addDoc(collection(db, "users", user.uid, "schedule"), {
        day,
        time,
        task,
        userId: user.uid,
      });
      setTime("");
      setTask("");
    } catch (e) {
      handleFirestoreError(
        e,
        OperationType.WRITE,
        `users/${user.uid}/schedule`,
      );
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, "users", user.uid, "schedule", id));
    } catch (e) {
      handleFirestoreError(
        e,
        OperationType.DELETE,
        `users/${user.uid}/schedule/${id}`,
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-400">
          <Info size={16} />
          <span className="text-xs font-bold">
            نظم وقتك وخطط لأسبوعك الدراسي
          </span>
        </div>
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <Calendar className="w-8 h-8 text-blue-400" />
          جدولي الأسبوعي
        </h2>
      </div>

      <div className="p-6 rounded-3xl bg-[#0a0b16] shadow-lg shadow-indigo-900/10 border border-white/10 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 block text-right">
            المهمة
          </label>
          <input
            type="text"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="مثال: مذاكرة رياضيات"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-right focus:outline-none placeholder:text-gray-600"
            dir="rtl"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 block text-right">
            الوقت
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-right focus:outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 block text-right">
            اليوم
          </label>
          <select
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="w-full bg-[#0a0b16] border border-white/10 rounded-xl px-4 py-2 text-right focus:outline-none appearance-none"
            dir="rtl"
          >
            {DAYS.map((d) => (
              <option
                key={d}
                value={d}
                className="bg-[#0a0b16] text-white py-2"
              >
                {d}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleAddItem}
          className="py-2 bg-blue-600 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          إضافة للجدول
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
        {DAYS.map((d) => (
          <div key={d} className="space-y-3 min-w-0">
            <h3 className="text-center font-bold py-2 bg-[#0a0b16] shadow-lg shadow-indigo-900/10 rounded-xl border border-white/10 text-[10px] uppercase tracking-wider text-indigo-400">
              {d}
            </h3>
            <div className="space-y-2">
              {items
                .filter((i) => i.day === d)
                .map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.05 }}
                    className="p-3 rounded-xl bg-[#0a0b16] shadow-lg shadow-indigo-900/10 border border-white/10 relative group overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-1 h-full bg-blue-500/50" />
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <X size={10} />
                    </button>
                    <div className="flex items-center gap-2 mb-1">
                      <Star
                        size={10}
                        className="text-yellow-400 fill-yellow-400 animate-pulse"
                      />
                      <p className="text-[10px] font-bold text-blue-400">
                        {item.time}
                      </p>
                    </div>
                    <p className="text-[10px] text-gray-200 leading-tight">
                      {item.task}
                    </p>
                  </motion.div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Star Map Visualization */}
      <div className="p-8 rounded-3xl glass border-white/5 relative overflow-hidden min-h-[300px]">
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full">
            {items.map((item, idx) => {
              if (idx === 0) return null;
              const prev = items[idx - 1];
              return (
                <line
                  key={`line-${item.id}`}
                  x1={`${(idx - 1) * (100 / items.length) + 5}%`}
                  y1={`${30 + Math.sin(idx - 1) * 20}%`}
                  x2={`${idx * (100 / items.length) + 5}%`}
                  y2={`${30 + Math.sin(idx) * 20}%`}
                  stroke="rgba(59, 130, 246, 0.3)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              );
            })}
          </svg>
        </div>
        <div className="relative z-10 flex flex-wrap gap-8 justify-center items-center">
          {items.map((item, idx) => (
            <motion.div
              key={`star-${item.id}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.2 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <Star size={20} className="text-blue-400 fill-blue-400" />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-white truncate max-w-[80px]">
                  {item.task}
                </p>
                <p className="text-[8px] text-gray-500">{item.day}</p>
              </div>
            </motion.div>
          ))}
          {items.length === 0 && (
            <div className="text-center text-gray-500 py-12">
              <Star size={48} className="mx-auto mb-4 opacity-20" />
              <p>أضف مهاماً لترى خريطتك النجمية تتشكل</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

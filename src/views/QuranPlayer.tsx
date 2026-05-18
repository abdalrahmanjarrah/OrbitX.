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

export default function QuranPlayer() {
  const [reciterIndex, setReciterIndex] = useState(0);
  const [surahIndex, setSurahIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.6);
  const [isOpen, setIsOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const playPromiseRef = useRef<Promise<void> | null>(null);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      if (playPromiseRef.current) {
        await playPromiseRef.current.catch(() => {});
      }
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        playPromiseRef.current = audioRef.current.play();
        setIsPlaying(true);
        await playPromiseRef.current;
      } catch (e) {
        console.error("Audio play failed", e);
        setIsPlaying(false);
      } finally {
        playPromiseRef.current = null;
      }
    }
  };

  const handleSurahChange = async (index: number) => {
    setSurahIndex(index);
    setIsPlaying(false);
    if (audioRef.current) {
      if (playPromiseRef.current) {
        await playPromiseRef.current.catch(() => {});
      }
      audioRef.current.pause();
      audioRef.current.load();
    }
  };

  const handleReciterChange = async (index: number) => {
    setReciterIndex(index);
    setIsPlaying(false);
    if (audioRef.current) {
      if (playPromiseRef.current) {
        await playPromiseRef.current.catch(() => {});
      }
      audioRef.current.pause();
      audioRef.current.load();
    }
  };

  const getAudioUrl = () => {
    const surahNum = (surahIndex + 1).toString().padStart(3, "0");
    return `${RECITERS[reciterIndex].server}${surahNum}.mp3`;
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-24 left-6 z-40 w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-xl",
          isOpen
            ? "bg-indigo-600 text-white shadow-indigo-900/50"
            : "bg-[#0a0b16] border border-white/10 hover:bg-white/5 shadow-black/50",
        )}
        title="القرآن الكريم"
      >
        <Music
          size={20}
          className={cn(
            !isOpen &&
              "text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]",
          )}
        />
        {isPlaying && !isOpen && (
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-indigo-500 animate-[pulse_1.5s_ease-in-out_infinite] shadow-[0_0_8px_rgba(99,102,241,0.8)] border-2 border-[#0a0b16]" />
        )}
      </button>

      <audio
        ref={audioRef}
        src={getAudioUrl()}
        onEnded={() => setIsPlaying(false)}
      />
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: -20 }}
            className="fixed bottom-[130px] left-6 z-50 w-80 bg-gradient-to-br from-[#0c0c16]/95 to-[#050510]/95 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl shadow-indigo-900/40"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-space-dark/80 shrink-0">
              <div className="flex items-center gap-2">
                <Music
                  size={18}
                  className="text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                />
                <h3 className="font-bold text-right text-sm tracking-wide text-white">
                  القرآن الكريم 🕌
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <select
                    value={reciterIndex}
                    onChange={(e) =>
                      handleReciterChange(parseInt(e.target.value))
                    }
                    className="w-full bg-[#0a0b16] shadow-lg shadow-indigo-900/10 border border-white/10 rounded-xl px-4 py-2.5 text-right text-sm appearance-none focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-gray-200"
                  >
                    {RECITERS.map((r, i) => (
                      <option
                        key={i}
                        value={i}
                        className="bg-[#0a0b16] text-white"
                      >
                        {r.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                  />
                </div>

                <div className="relative">
                  <select
                    value={surahIndex}
                    onChange={(e) =>
                      handleSurahChange(parseInt(e.target.value))
                    }
                    className="w-full bg-[#0a0b16] shadow-lg shadow-indigo-900/10 border border-white/10 rounded-xl px-4 py-2.5 text-right text-sm appearance-none focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-gray-200"
                  >
                    {SURAHS.map((s, i) => (
                      <option
                        key={i}
                        value={i}
                        className="bg-[#0a0b16] text-white"
                      >
                        {s} .{i + 1}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-center gap-6 py-4 bg-white/[0.02] rounded-2xl border border-white/5">
                <SkipBack
                  size={20}
                  className="text-gray-400 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSurahChange(Math.max(0, surahIndex - 1))}
                />
                <button
                  onClick={togglePlay}
                  className="w-14 h-14 rounded-full bg-indigo-500 flex items-center justify-center cursor-pointer hover:bg-indigo-600 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-500/30"
                >
                  {isPlaying ? (
                    <Pause size={24} fill="white" />
                  ) : (
                    <Play size={24} fill="white" className="ml-1" />
                  )}
                </button>
                <SkipForward
                  size={20}
                  className="text-gray-400 cursor-pointer hover:text-white transition-colors"
                  onClick={() =>
                    handleSurahChange(
                      Math.min(SURAHS.length - 1, surahIndex + 1),
                    )
                  }
                />
              </div>

              <div className="space-y-1 px-2 pt-2 pb-1">
                <div className="flex items-center gap-3">
                  <VolumeX size={16} className="text-gray-500" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="flex-1 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-400 hover:accent-indigo-300 transition-colors"
                  />
                  <Volume2 size={16} className="text-gray-500" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

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

export default function ChatView({
  user,
  onSelectUser,
}: {
  user: UserData;
  onSelectUser: (id: string) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isChatEnabled, setIsChatEnabled] = useState(true);
  
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "system", "settings"), (docSnap) => {
       if (docSnap.exists()) setIsChatEnabled(docSnap.data().isChatEnabled !== false);
    });
    return () => unsub();
  }, []);
  const [newMessage, setNewMessage] = useState("");
  const [typingMap, setTypingMap] = useState<
    Record<string, { name: string; time: number }>
  >({});
  const [deletingMsgId, setDeletingMsgId] = useState<string | null>(null);

  const prevCount = useRef(0);
  const initialLoad = useRef(true);
  const lastMsgTime = useRef(0);
  const lastTypingUpdate = useRef(0);

  useEffect(() => {
    const q = query(
      collection(db, "global_chat"),
      orderBy("timestamp", "asc"),
      limit(100),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Message,
        );

        if (!initialLoad.current && msgs.length > prevCount.current) {
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg && lastMsg.userId !== user.uid) {
            playSound("message");
          }
        }

        prevCount.current = msgs.length;
        initialLoad.current = false;
        setMessages(msgs);
      },
      (e) => handleFirestoreError(e, OperationType.GET, "global_chat"),
    );
    return () => unsubscribe();
  }, [user.uid]);

  useEffect(() => {
  // تم إيقاف الاستماع لـ chat_typing لتوفر عمليات القراءة والكتابة يومياً ولحماية حصة الـ 20,000 ✓
  // تم التخلص من الـ Loop والـ setInterval لضمان استقرار التطبيق.
}, [user.uid]);
  const typingNames = Object.values(typingMap)
    .filter((t) => Date.now() - t.time < 3000)
    .map((t) => t.name);

  const handleSendMessage = async () => {
    if (!isChatEnabled && user.role !== 'admin') {
       alert("الشات العام موقف حالياً من قبل الإدارة.");
       return;
    }
    if (!newMessage.trim()) return;
    if (newMessage.length > 500) {
      alert("الرسالة طويلة جداً! الحد الأقصى هو 500 حرف.");
      return;
    }
    const now = Date.now();
    if (now - lastMsgTime.current < 2000) {
      alert("الرجاء الانتظار قليلاً قبل إرسال رسالة أخرى (حماية من الإزعاج).");
      return;
    }
    lastMsgTime.current = now;
    try {
      await addDoc(collection(db, "global_chat"), {
        text: newMessage,
        userId: user.uid,
        userName: user.displayName,
        userPhoto: user.photoURL,
        userRankTitle: getAstronautRank(user.xp).title,
        userRankColor: getAstronautRank(user.xp).color,
        userRankIcon: getAstronautRank(user.xp).icon,
        timestamp: serverTimestamp(),
        type: "text",
      });
      setNewMessage("");
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, "global_chat");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col bg-[#0a0b16] shadow-lg shadow-indigo-900/10 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-lg bg-[#0a0b16]/60"
    >
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-gray-400">متصل الآن</span>
        </div>
        <div className="flex items-center gap-4">
          {user.role === "admin" && (
            <button
              onClick={async () => {
                try {
                  await setDoc(doc(db, "system", "settings"), { isChatEnabled: !isChatEnabled }, { merge: true });
                } catch (e) {
                  handleFirestoreError(e, OperationType.WRITE, "system_settings");
                }
              }}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full font-bold transition-all",
                !isChatEnabled 
                  ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30" 
                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
              )}
            >
              {!isChatEnabled ? "دردشة مغلقة 🔒" : "دردشة مفتوحة 🔓"}
            </button>
          )}
          <h2 className="text-2xl font-bold flex items-center gap-2">
            الشات العام 🚀
          </h2>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto space-y-6 relative">
        {typingNames.length > 0 && (
          <div
            className="sticky top-0 z-10 text-xs text-indigo-400 italic mb-2 animate-pulse text-right bg-[#0a0b16]/80 p-2 rounded-lg backdrop-blur-sm self-start inline-block"
            dir="rtl"
          >
            {typingNames.slice(0, 3).join(" و ")}{" "}
            {typingNames.length > 3
              ? "وآخرون يكتبون..."
              : typingNames.length > 1
                ? "يكتبون الآن..."
                : "يكتب الآن..."}
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-4",
              msg.userId === user.uid ? "flex-row-reverse" : "flex-row",
            )}
          >
            <button
              onClick={() => onSelectUser(msg.userId)}
              className="z-10 relative"
            >
              <img
                src={msg.userPhoto}
                className="w-10 h-10 rounded-full border border-white/10 hover:border-indigo-400 transition-colors"
                referrerPolicy="no-referrer"
              />
            </button>
            <div
              className={cn(
                "flex flex-col",
                msg.userId === user.uid ? "items-end" : "items-start",
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                {(user.role === "admin" || msg.userId === user.uid) &&
                  (deletingMsgId === msg.id ? (
                    <div className="flex items-center gap-2 bg-red-500/10 px-2 py-1 rounded border border-red-500/30">
                      <span className="text-[10px] text-red-400">حذف؟</span>
                      <button
                        onClick={async () => {
                          try {
                            await deleteDoc(doc(db, "global_chat", msg.id));
                            setDeletingMsgId(null);
                          } catch (e: any) {
                            handleFirestoreError(
                              e,
                              OperationType.DELETE,
                              `global_chat/${msg.id}`,
                            );
                          }
                        }}
                        className="text-[10px] text-red-500 hover:text-white font-bold"
                      >
                        نعم
                      </button>
                      <button
                        onClick={() => setDeletingMsgId(null)}
                        className="text-[10px] text-gray-400"
                      >
                        لا
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingMsgId(msg.id)}
                      className="text-red-500 hover:text-red-400 p-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  ))}
                <button
                  onClick={() => onSelectUser(msg.userId)}
                  className="text-xs text-gray-400 hover:text-indigo-500 transition-colors flex items-center justify-end gap-1"
                >
                  {msg.userName} {msg.userRankIcon}
                  {(msg.userRankTitle && msg.userRankColor) && (
                    <span className={cn("text-[8px] font-bold", msg.userRankColor)}>
                       — {msg.userRankTitle}
                    </span>
                  )}
                </button>
              </div>
              <div
                className={cn(
                  "px-4 py-2 rounded-2xl text-sm max-w-md",
                  msg.userId === user.uid
                    ? "bg-indigo-500 text-white rounded-tr-none"
                    : "bg-white/5 text-gray-200 rounded-tl-none",
                )}
              >
                {msg.text}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 bg-space-dark/80 border-t border-white/10">
  <div className="relative">
    {!isChatEnabled && user.role !== 'admin' ? (
       <div className="w-full bg-[#0a0b16] border border-red-500/30 rounded-2xl px-6 py-4 text-center text-red-400 font-bold bg-opacity-50">
         الدردشة العامة مغلقة من قبل الإدارة 🔒
       </div>
    ) : (
      <>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)} // تم التنظيف بنجاح وبأمان ✓
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="اكتب رسالة للجميع..."
          className="w-full bg-[#0a0b16] shadow-lg shadow-indigo-900/10 border border-white/10 rounded-2xl px-6 py-4 text-right focus:outline-none focus:ring-2 focus:ring-indigo-400/50 transition-all text-white placeholder:text-gray-600"
          dir="rtl"
        />
        <button
          onClick={handleSendMessage}
          className="absolute left-2 top-2 bottom-2 px-6 bg-indigo-500 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <span>إرسال</span>
          <Send size={18} />
        </button>
      </>
    )}
  </div>
</div>
    </motion.div>
  );
}

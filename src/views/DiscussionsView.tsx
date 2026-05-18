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
import ChatView from './ChatView';
import FocusHeatmap from './FocusHeatmap';
import ProfileView from './ProfileView';
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

export default function DiscussionsView({ user }: { user: UserData }) {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [selectedDiscussion, setSelectedDiscussion] =
    useState<Discussion | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newReply, setNewReply] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [deletingDiscussionId, setDeletingDiscussionId] = useState<
    string | null
  >(null);
  const [deletingReplyId, setDeletingReplyId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "discussions"),
      orderBy("timestamp", "desc"),
      limit(50),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setDiscussions(
          snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as Discussion,
          ),
        );
      },
      (e) => handleFirestoreError(e, OperationType.GET, "discussions"),
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedDiscussion) {
      const q = query(
        collection(db, "discussions", selectedDiscussion.id, "replies"),
        orderBy("timestamp", "asc"),
      );
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          setReplies(
            snapshot.docs.map(
              (doc) => ({ id: doc.id, ...doc.data() }) as Reply,
            ),
          );
        },
        (e) =>
          handleFirestoreError(
            e,
            OperationType.GET,
            `discussions/${selectedDiscussion.id}/replies`,
          ),
      );
      return () => unsubscribe();
    }
  }, [selectedDiscussion]);

  const handleCreateDiscussion = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    try {
      await addDoc(collection(db, "discussions"), {
        title: newTitle,
        content: newContent,
        userId: user.uid,
        userName: user.displayName,
        userPhoto: user.photoURL,
        timestamp: serverTimestamp(),
        repliesCount: 0,
      });
      setNewTitle("");
      setNewContent("");
      setIsCreating(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, "discussions");
    }
  };

  const handleSendReply = async () => {
    if (!newReply.trim() || !selectedDiscussion) return;
    try {
      await addDoc(
        collection(db, "discussions", selectedDiscussion.id, "replies"),
        {
          text: newReply,
          userId: user.uid,
          userName: user.displayName,
          userPhoto: user.photoURL,
          timestamp: serverTimestamp(),
        },
      );
      await updateDoc(doc(db, "discussions", selectedDiscussion.id), {
        repliesCount: increment(1),
      });
      if (selectedDiscussion.userId !== user.uid) {
        addDoc(
          collection(db, "users", selectedDiscussion.userId, "notifications"),
          {
            type: "reply",
            content: `رد ${user.displayName} على نقاشك: ${selectedDiscussion.title}`,
            read: false,
            timestamp: serverTimestamp(),
          },
        ).catch(console.error);
      }
      setNewReply("");
    } catch (e) {
      handleFirestoreError(
        e,
        OperationType.WRITE,
        `discussions/${selectedDiscussion.id}/replies`,
      );
    }
  };

  const handleDeleteDiscussion = async (id: string, authorId: string) => {
    if (user.role !== "admin" && user.uid !== authorId) return;
    try {
      await deleteDoc(doc(db, "discussions", id));
      if (selectedDiscussion?.id === id) setSelectedDiscussion(null);
      setDeletingDiscussionId(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `discussions/${id}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-6 py-2 bg-indigo-500 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2"
        >
          {isCreating ? <X size={18} /> : <Plus size={18} />}
          {isCreating ? "إلغاء" : "بدء نقاش جديد"}
        </button>
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <MessageCircle className="w-8 h-8 text-indigo-500" />
          ساحة النقاش
        </h2>
      </div>

      {isCreating && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl bg-[#0a0b16] shadow-lg shadow-indigo-900/10 border border-white/10 space-y-4"
        >
          <input
            type="text"
            placeholder="عنوان الموضوع..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full bg-white/5/80 shadow-inner border border-white/10 rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-1 focus:ring-indigo-400"
            dir="rtl"
          />
          <textarea
            placeholder="محتوى النقاش..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="w-full bg-white/5/80 shadow-inner border border-white/10 rounded-xl px-4 py-3 text-right h-32 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            dir="rtl"
          />
          <button
            onClick={handleCreateDiscussion}
            className="w-full py-3 bg-indigo-500 rounded-xl font-bold hover:bg-indigo-700 transition-all"
          >
            نشر الموضوع
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {selectedDiscussion ? (
          <div className="space-y-6">
            <button
              onClick={() => setSelectedDiscussion(null)}
              className="text-indigo-500 font-bold flex items-center gap-2 hover:underline"
            >
              <SkipBack size={18} className="rotate-180" />
              العودة للنقاشات
            </button>
            <div className="p-8 rounded-3xl bg-[#0a0b16] shadow-lg shadow-indigo-900/10 border border-white/10 space-y-6 relative overflow-hidden">
              <div className="atmosphere-bg opacity-10" />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedDiscussion.userPhoto}
                    className="w-12 h-12 rounded-2xl border border-white/10"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-left">
                    <p className="font-bold text-base">
                      {selectedDiscussion.userName}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {selectedDiscussion.timestamp
                        ?.toDate()
                        .toLocaleString("ar-EG")}
                    </p>
                  </div>
                </div>
                <h3 className="text-2xl font-black">
                  {selectedDiscussion.title}
                </h3>
              </div>
              <p
                className="text-gray-200 leading-relaxed text-right relative z-10 text-lg"
                dir="rtl"
              >
                {selectedDiscussion.content}
              </p>
            </div>

            <div className="space-y-4 pr-6 border-r-2 border-white/5">
              {replies.map((reply) => (
                <div
                  key={reply.id}
                  className="p-4 rounded-2xl bg-[#0a0b16] shadow-lg shadow-indigo-900/10 border border-white/10 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {reply.timestamp?.toDate().toLocaleString("ar-EG")}
                      </span>
                      {(user.role === "admin" || reply.userId === user.uid) &&
                        (deletingReplyId === reply.id ? (
                          <div
                            className="flex items-center gap-1.5 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/30"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteDoc(
                                  doc(
                                    db,
                                    "discussions",
                                    selectedDiscussion.id,
                                    "replies",
                                    reply.id,
                                  ),
                                );
                                setDeletingReplyId(null);
                              }}
                              className="text-[9px] text-red-500 hover:text-white font-bold"
                            >
                              نعم
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingReplyId(null);
                              }}
                              className="text-[9px] text-gray-400"
                            >
                              لا
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingReplyId(reply.id);
                            }}
                            className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">
                        {reply.userName}
                      </span>
                      <img
                        src={reply.userPhoto}
                        className="w-6 h-6 rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 text-right" dir="rtl">
                    {reply.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="relative">
              <textarea
                placeholder="أضف رداً..."
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                className="w-full bg-white/5/80 shadow-inner border border-white/10 rounded-2xl px-6 py-4 text-right h-24 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                dir="rtl"
              />
              <button
                onClick={handleSendReply}
                className="absolute left-2 bottom-2 px-6 py-2 bg-indigo-500 rounded-xl font-bold hover:bg-indigo-700 transition-all"
              >
                رد
              </button>
            </div>
          </div>
        ) : (
          discussions.map((disc) => (
            <motion.div
              key={disc.id}
              whileHover={{ scale: 1.01 }}
              className="p-6 rounded-3xl bg-[#0a0b16] shadow-lg shadow-indigo-900/10 border border-white/10 hover:bg-white/5 transition-all cursor-pointer group"
              onClick={() => setSelectedDiscussion(disc)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-gray-400 text-xs">
                    <MessageSquare size={14} />
                    {disc.repliesCount} ردود
                  </div>
                  {(user.role === "admin" || disc.userId === user.uid) &&
                    (deletingDiscussionId === disc.id ? (
                      <div
                        className="flex items-center gap-2 bg-red-500/10 px-2 py-1 rounded border border-red-500/30"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-[10px] text-red-400">حذف؟</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDiscussion(disc.id, disc.userId);
                          }}
                          className="text-[10px] text-red-500 hover:text-white font-bold"
                        >
                          نعم
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingDiscussionId(null);
                          }}
                          className="text-[10px] text-gray-400"
                        >
                          لا
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingDiscussionId(disc.id);
                        }}
                        className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    ))}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold text-sm">{disc.userName}</p>
                    <p className="text-[10px] text-gray-500">
                      {disc.timestamp?.toDate().toLocaleDateString("ar-EG")}
                    </p>
                  </div>
                  <img
                    src={disc.userPhoto}
                    className="w-10 h-10 rounded-full border border-white/10"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
              <h3 className="text-lg font-bold text-right group-hover:text-indigo-500 transition-colors">
                {disc.title}
              </h3>
              <p
                className="text-sm text-gray-400 text-right mt-2 line-clamp-2"
                dir="rtl"
              >
                {disc.content}
              </p>
            </motion.div>
          ))
        )}
        {!selectedDiscussion && discussions.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-white/10 rounded-3xl">
            <p className="text-gray-500 italic">لا توجد نقاشات حالياً</p>
          </div>
        )}
      </div>
    </div>
  );
}

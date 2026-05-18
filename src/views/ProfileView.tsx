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

export default function ProfileView({
  user,
  isStudying,
}: {
  user: UserData;
  isStudying?: boolean;
}) {
  const [exhibitions, setExhibitions] = useState<any[]>([]);
  const [deletingExhibitionId, setDeletingExhibitionId] = useState<
    string | null
  >(null);
  const [friends, setFriends] = useState<UserData[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(user.bio || "");
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [missionRoleStr, setMissionRoleStr] = useState(user.missionRole || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputExhibitionRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, "exhibitions"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc"),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setExhibitions(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
      },
      (e) =>
        handleFirestoreError(
          e,
          OperationType.GET,
          `exhibitions_user_${user.uid}`,
        ),
    );
    return () => unsubscribe();
  }, [user.uid]);

  useEffect(() => {
    const q = query(collection(db, "users", user.uid, "friends"), limit(20));
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const friendIds = snapshot.docs.map((doc) => doc.id);
        if (friendIds.length > 0) {
          try {
            // Use 'in' query to fetch all friends in one go
            const friendsQuery = query(
              collection(db, "profiles"),
              where("__name__", "in", friendIds),
            );
            const friendsSnap = await getDocs(friendsQuery);
            setFriends(friendsSnap.docs.map((doc) => doc.data() as UserData));
          } catch (e) {
            console.error("Error fetching friends details:", e);
          }
        } else {
          setFriends([]);
        }
      },
      (e) =>
        handleFirestoreError(e, OperationType.GET, `users/${user.uid}/friends`),
    );
    return () => unsubscribe();
  }, [user.uid]);

  const handleUpdateBio = async () => {
    try {
      await updateDoc(doc(db, "users", user.uid), {
        bio,
        missionRole: missionRoleStr,
        displayName,
      });
      setIsEditing(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleUpdateAvatar = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("الرجاء اختيار ملف صورة صالح.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        // Compress to JPEG with 0.8 quality
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

        try {
          await updateDoc(doc(db, "users", user.uid), { photoURL: dataUrl });

          // Update denormalized photo in other collections
          const collectionsToUpdate = [
            "global_chat",
            "discussions",
            "suggestions",
          ];
          for (const col of collectionsToUpdate) {
            const q = query(
              collection(db, col),
              where("userId", "==", user.uid),
            );
            const snapshot = await getDocs(q);
            snapshot.forEach(async (docSnap) => {
              await updateDoc(doc(db, col, docSnap.id), {
                userPhoto: dataUrl,
              }).catch(() => {});
            });
          }

          // Update replies inside discussions
          const discussionsSnap = await getDocs(collection(db, "discussions"));
          discussionsSnap.forEach(async (discDoc) => {
            const repliesQ = query(
              collection(db, "discussions", discDoc.id, "replies"),
              where("userId", "==", user.uid),
            );
            const repliesSnap = await getDocs(repliesQ);
            repliesSnap.forEach(async (replyDoc) => {
              await updateDoc(
                doc(db, "discussions", discDoc.id, "replies", replyDoc.id),
                { userPhoto: dataUrl },
              ).catch(() => {});
            });
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleExhibitionFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("الرجاء اختيار ملف صورة صالح.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

        try {
          await addDoc(collection(db, "exhibitions"), {
            url: dataUrl,
            userId: user.uid,
            userName: user.displayName,
            timestamp: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, "exhibitions");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      {/* Profile Header */}
      <div className="p-8 rounded-[2.5rem] glass border-indigo-400/20 relative overflow-hidden group flex flex-col justify-center transition-colors">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
          <UserIcon size={200} className="text-indigo-500" />
        </div>
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="flex items-center justify-center">
            <div
              className="relative group cursor-pointer"
              onClick={handleUpdateAvatar}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              {/* Dynamic Glow Effect */}
              <div
                className={cn(
                  "absolute inset-0 rounded-full blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-500",
                  getAstronautRank(user.xp).color.replace("text-", "bg-"),
                )}
              ></div>

              <div className="w-32 h-32 rounded-full border-4 border-indigo-400 p-1 relative overflow-hidden z-10 bg-[#0a0b16]">
                <img
                  src={user.photoURL}
                  className="w-full h-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-slate-900/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  <span className="text-xs font-bold text-white">
                    تغيير الصورة
                  </span>
                </div>
              </div>
              <div
                className={cn(
                  "absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold border-2 border-[#0a0b16] z-20 whitespace-nowrap shadow-xl",
                  getAstronautRank(user.xp)
                    .color.replace("text-", "bg-")
                    .replace("300", "500")
                    .replace("400", "500"),
                  getAstronautRank(user.xp).color === "text-white"
                    ? "text-black"
                    : "text-white",
                )}
              >
                LVL {user.level}
              </div>
            </div>
          </div>

          <div className="flex-1 text-center md:text-right space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex gap-4 flex-wrap justify-center">
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-bold hover:bg-red-500/40 hover:text-white transition-all text-sm flex items-center gap-2"
                >
                  <LogOut size={16} />
                  تسجيل خروج
                </button>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-6 py-2 bg-white/5 rounded-xl font-bold hover:bg-[#0a0b16]/20 transition-all text-sm"
                >
                  تعديل الملف
                </button>
                <button className="px-6 py-2 bg-indigo-500 rounded-xl font-bold hover:bg-indigo-700 transition-all text-sm">
                  مشاركة
                </button>
              </div>
              <h2 className="text-3xl font-bold flex items-center gap-3">
                {user.displayName}
                <span
                  className={cn(
                    "text-sm px-3 py-1 rounded-full border border-current",
                    getAstronautRank(user.xp)
                      .color.replace("text-", "bg-")
                      .replace("400", "500/20"),
                  )}
                >
                  {getAstronautRank(user.xp).title}
                </span>
              </h2>
            </div>

            <div className="flex flex-wrap justify-center md:justify-end gap-3 text-xs">
              <div className="text-center px-6 py-3 bg-[#0a0b16] rounded-2xl border border-white/5 backdrop-blur-md shadow-inner shadow-black/20">
                <span className="block font-black text-2xl text-indigo-400">
                  {exhibitions.length}
                </span>
                <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                  منشور
                </span>
              </div>
              <div className="text-center px-6 py-3 bg-[#0a0b16] rounded-2xl border border-white/5 backdrop-blur-md shadow-inner shadow-black/20">
                <span className="block font-black text-2xl text-blue-400">
                  {user.xp}
                </span>
                <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                  XP
                </span>
              </div>
              <div className="text-center px-6 py-3 bg-[#0a0b16] rounded-2xl border border-white/5 backdrop-blur-md shadow-inner shadow-black/20">
                <span className="block font-black text-2xl text-fuchsia-400">
                  {friends.length}
                </span>
                <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                  صديق
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {isEditing ? (
                <div className="flex flex-col gap-3 items-end w-full">
                  <div className="w-full relative">
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="الأسم المستعار..."
                      className="w-full bg-white/5/80 shadow-inner border border-white/10 rounded-xl px-4 py-2 text-right focus:outline-none focus:border-indigo-400 text-sm font-bold"
                      dir="rtl"
                    />
                  </div>
                  <div className="w-full sm:w-auto relative">
                    <input
                      value={missionRoleStr}
                      onChange={(e) => setMissionRoleStr(e.target.value)}
                      placeholder="اكتب تخصصك الفضائي..."
                      className="w-full bg-white/5/80 shadow-inner border border-white/10 rounded-xl px-4 py-2 text-right focus:outline-none focus:border-indigo-400 text-sm"
                      dir="rtl"
                    />
                  </div>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="اكتب نبذة عنك..."
                    className="w-full bg-white/5/80 shadow-inner border border-white/10 rounded-xl p-3 text-right text-sm focus:outline-none"
                    dir="rtl"
                  />
                  <button
                    onClick={handleUpdateBio}
                    className="px-6 py-2 bg-indigo-500 rounded-xl hover:bg-indigo-600 transition-colors text-white text-sm font-bold"
                  >
                    حفظ التغييرات
                  </button>
                </div>
              ) : (
                <div className="space-y-2 text-right">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-gray-300">
                    <Rocket size={12} className="text-indigo-400" />
                    {user.missionRole || "لم يتم تحديد التخصص"}
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {user.bio ||
                      'لا يوجد وصف حالياً... اضغط على "تعديل الملف" للإضافة'}
                  </p>
                </div>
              )}
            </div>

            {/* Badges Display */}
            <div className="pt-4 border-t border-white/5">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 text-right">
                الأوسمة المستحقة
              </h4>
              <div className="flex flex-wrap justify-end gap-3">
                {user.badges && user.badges.length > 0 ? (
                  user.badges.map((badgeId) => {
                    const badge = BADGES.find((b) => b.id === badgeId);
                    return badge ? (
                      <div key={badgeId} className="group relative">
                        <div className="w-10 h-10 rounded-xl bg-[#0a0b16] shadow-lg shadow-indigo-900/10 border border-white/10 flex items-center justify-center text-xl hover:bg-white/5 transition-all cursor-help">
                          {badge.icon}
                        </div>
                        <div className="absolute bottom-full right-0 mb-2 w-32 p-2 bg-[#0a0b16] border border-white/10 rounded-lg text-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                          <p className="font-bold text-indigo-500">
                            {badge.title}
                          </p>
                          <p className="text-gray-400">{badge.description}</p>
                        </div>
                      </div>
                    ) : null;
                  })
                ) : (
                  <p className="text-[10px] text-gray-600 italic">
                    لم تحصل على أي أوسمة بعد... استمر في التركيز!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mt-8 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-gray-400">
            <span className={getAstronautRank(user.xp).color}>
              {getAstronautRank(user.xp).title}
            </span>
            <span>التقدم للرتبة التالية</span>
            <span>{getAstronautRank(user.xp).nextRankTitle}</span>
          </div>
          <div className="h-6 bg-[#0a0b16] shadow-inner shadow-black/80 rounded-full overflow-hidden border border-white/10 relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${getAstronautRank(user.xp).progressPercentage}%`,
              }}
              className="h-full bg-gradient-to-l from-indigo-500 to-blue-400"
            />
            <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
              {Math.round(getAstronautRank(user.xp).progressPercentage)}%
            </div>
          </div>
        </div>
      </div>

      {/* Friends List */}
      {friends.length > 0 && (
        <div className="p-6 rounded-3xl glass border border-blue-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">الأصدقاء</h3>
              <p className="text-xs text-gray-400">
                {friends.length} زملاء في المجرة
              </p>
            </div>
          </div>
          <div className="flex -space-x-3 space-x-reverse justify-end">
            {friends.slice(0, 8).map((friend, i) => (
              <div
                key={friend.uid}
                className="group relative"
                style={{ zIndex: 10 - i }}
              >
                <img
                  src={friend.photoURL}
                  className="w-10 h-10 rounded-full border-2 border-[#0a0b16] object-cover hover:scale-110 transition-transform cursor-help"
                  referrerPolicy="no-referrer"
                />
                {friend.lastActiveTime &&
                  Date.now() - friend.lastActiveTime < 300000 && (
                    <div
                      className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0b16]"
                      title="متصل الآن"
                    />
                  )}
                <div className="absolute bottom-full right-1/2 translate-x-1/2 mb-2 px-2 py-1 bg-[#0a0b16] border border-white/10 rounded-lg text-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
                  {friend.displayName}
                </div>
              </div>
            ))}
            {friends.length > 8 && (
              <div className="w-10 h-10 rounded-full border-2 border-[#0a0b16] bg-[#0a0b16] text-blue-400 flex items-center justify-center text-xs font-bold relative z-0 shadow-inner">
                +{friends.length - 8}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Badges */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {BADGES.map((badge, i) => (
          <BadgeCard
            key={i}
            icon={badge.icon}
            title={badge.title}
            xp={`${badge.minXp} XP`}
            active={user.xp >= badge.minXp}
          />
        ))}
      </div>

      <FarmDisplay user={user} isOwner={true} isStudying={isStudying} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Exhibitions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between p-6 rounded-3xl glass border border-white/5">
            <input
              type="file"
              ref={fileInputExhibitionRef}
              onChange={handleExhibitionFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputExhibitionRef.current?.click()}
              className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm font-bold shadow-sm shadow-indigo-500/10 border border-indigo-500/30"
            >
              <Plus size={18} />
              إضافة صورة
            </button>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-pink-400" />
              معرض المحطات
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {exhibitions.map((ex, i) => (
              <motion.div
                key={ex.id}
                whileHover={{ scale: 1.02 }}
                className="aspect-square rounded-3xl overflow-hidden border border-white/10 bg-[#0a0b16] shadow-lg shadow-indigo-900/10 group relative"
              >
                <img
                  src={ex.url}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  <span className="text-xs font-bold text-white">
                    {ex.timestamp
                      ? new Date(ex.timestamp.toDate()).toLocaleDateString(
                          "ar-EG",
                        )
                      : ""}
                  </span>
                  {deletingExhibitionId === ex.id ? (
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-[10px] text-red-300 font-bold bg-black/50 px-2 py-1 rounded">
                        تأكيد الحذف؟
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            deleteDoc(doc(db, "exhibitions", ex.id)).catch(
                              () => {},
                            );
                            setDeletingExhibitionId(null);
                          }}
                          className="px-3 py-1 bg-red-500 rounded-full text-white text-xs font-bold"
                        >
                          نعم
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingExhibitionId(null);
                          }}
                          className="px-3 py-1 bg-white/20 rounded-full text-white text-xs font-bold"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingExhibitionId(ex.id);
                      }}
                      className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full text-white transition-colors"
                      title="حذف الصورة"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
            {exhibitions.length === 0 && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-white/10 rounded-3xl">
                <p className="text-gray-500 italic">
                  لا توجد صور في المعرض بعد
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Stats or other bento items */}
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          <FocusHeatmap />
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-6 flex-1">
            <div className="p-6 rounded-3xl glass border border-orange-500/20 flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-orange-500/5 group-hover:bg-orange-500/10 transition-colors"></div>
              <Flame
                size={48}
                className="text-orange-500 mb-4 animate-pulse drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]"
              />
              <h4 className="text-xl font-black text-white mb-1">
                أيام التركيز
              </h4>
              <p className="text-4xl font-black text-orange-400 drop-shadow-md">
                {user.streak || 0}
              </p>
              <span className="text-xs text-gray-400 mt-2 font-bold uppercase tracking-widest">
                تتجدد غداً
              </span>
            </div>
            <div className="p-6 rounded-3xl glass border border-blue-500/20 flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors"></div>
              <Activity
                size={48}
                className="text-blue-500 mb-4 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]"
              />
              <h4 className="text-xl font-black text-white mb-1">المهام</h4>
              <p className="text-4xl font-black text-blue-400 drop-shadow-md">
                {user.completedTasks || 0}
              </p>
              <span className="text-xs text-gray-400 mt-2 font-bold uppercase tracking-widest">
                إنجازك
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

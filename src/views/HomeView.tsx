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
import BadgeCard from './BadgeCard';
import CosmicDiary from './CosmicDiary';
import FarmDisplay from './FarmDisplay';
import UserModal from './UserModal';
import NavLink from './NavLink';
import BlackHolesView from './BlackHolesView';
import AwarenessView from './AwarenessView';
import AnalyticsView from './AnalyticsView';
import FleetsView from './FleetsView';

const bentoContainer: any = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const bentoItem: any = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  },
};

export default function HomeView({
  user,
  onEnterStation,
  onSelectUser,
}: {
  user: UserData;
  onEnterStation: (id: string) => void;
  onSelectUser: (id: string) => void;
}) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [advice, setAdvice] = useState<string>("");
  const [activeUsers, setActiveUsers] = useState<UserData[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomTask, setNewRoomTask] = useState("");
  const [newRoomImageUrl, setNewRoomImageUrl] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [pendingChallenges, setPendingChallenges] = useState<Challenge[]>([]);

  useEffect(() => {
    let unsubscribeChallenges: () => void;
    let unsubscribeUsers: () => void;
    let isMounted = true;

    const fetchData = async () => {
      try {
        const roomsQuery = query(
          collection(db, "rooms"),
          orderBy("createdAt", "desc"),
          limit(50),
        );
        const roomsSnap = await getDocs(roomsQuery);
        const fetchedRooms: Room[] = [];
        const now = Date.now();
        
        roomsSnap.docs.forEach((docSnap) => {
          if (!docSnap.exists()) return;
          const data = docSnap.data() as Room;
          if (data && data.isChallenge) {
             if (data.participants?.includes(user?.uid)) {
                fetchedRooms.push({ id: docSnap.id, ...data });
             }
             return;
          }
          if (data && data.participants?.length === 0 && data.emptyAt) {
            const emptyMs = data.emptyAt.toMillis
              ? data.emptyAt.toMillis()
              : data.emptyAt.seconds * 1000;
            if (now - emptyMs > 300000) {
              deleteDoc(docSnap.ref).catch(() => {});
              return;
            }
          }
          if (data) fetchedRooms.push({ id: docSnap.id, ...data });
        });
        if (isMounted) setRooms(fetchedRooms);

        const adviceQuery = query(
          collection(db, "advices"),
          orderBy("timestamp", "desc"),
          limit(1),
        );
        const adviceSnap = await getDocs(adviceQuery);
        if (!adviceSnap.empty && isMounted) {
          setAdvice(adviceSnap.docs[0].data().text);
        }

        const usersQuery = query(collection(db, "profiles"), orderBy("lastActiveTime", "desc"), limit(15));
        const fetchActiveUsers = async () => {
          try {
            const snapshot = await getDocs(usersQuery);
            if (isMounted) {
              setActiveUsers(
                snapshot.docs
                  .map((doc) => doc.data() as UserData)
                  .filter((u) => u.uid !== user.uid),
              );
            }
          } catch (err) {
            console.warn("Soft fail loading online profiles: ", err);
          }
        };

        await fetchActiveUsers();
        const intervalId = setInterval(fetchActiveUsers, 60000);
        unsubscribeUsers = () => clearInterval(intervalId);

      } catch (e) {
        console.error("Error fetching home data:", e);
      }
    };
    
    fetchData();

    const challengesQuery = query(
      collection(db, "challenges"),
      where("challengedId", "==", user.uid),
      where("status", "==", "pending"),
      limit(20)
    );
    unsubscribeChallenges = onSnapshot(
      challengesQuery,
      (snapshot) => {
        setPendingChallenges(
          snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as Challenge,
          ),
        );
      },
      (e) => handleFirestoreError(e, OperationType.GET, "challenges"),
    );

    return () => {
      isMounted = false;
      if (unsubscribeChallenges) unsubscribeChallenges();
      if (unsubscribeUsers) unsubscribeUsers();
    };
  }, [user.uid]);;

  const PREDEFINED_IMAGES = [
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=600&auto=format&fit=crop",
  ];

  const handleCreateRoom = async () => {
    if (!newRoomName) return;
    setIsCreating(true);

    try {
      const roomData = {
        name: newRoomName,
        task: "محطة مشتركة",
        imageUrl: newRoomImageUrl || null,
        creatorId: user.uid,
        creatorName: user.displayName,
        participants: [user.uid],
        maxParticipants: 5,
        timerStatus: "idle",
        timerDuration: 25,
        breakDuration: 5,
        createdAt: serverTimestamp(),
      };

      const roomRef = await addDoc(collection(db, "rooms"), roomData);
      setShowCreateModal(false);
      setNewRoomName("");
      setNewRoomTask("");
      setNewRoomImageUrl("");
      onEnterStation(roomRef.id);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, "rooms");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="w-full relative min-h-screen pb-32">
      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none z-0 mix-blend-screen" />
      <div className="fixed bottom-0 right-1/4 w-[30rem] h-[30rem] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none z-0 mix-blend-screen" />
      
      <motion.div
        variants={bentoContainer}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-10 max-w-7xl mx-auto w-full z-10 relative"
      >
        {/* Welcome Section / Deep Focus Overview */}
        <motion.div variants={bentoItem} className="flex flex-col md:flex-row items-center justify-between gap-8 pt-6">
          <div className="flex-1 space-y-4">
            <h1 className="text-4xl md:text-5xl font-black font-display text-transparent bg-clip-text bg-gradient-to-l from-white via-indigo-100 to-indigo-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              أهلاً {user.displayName}... جاهز للتركيز؟
            </h1>
            <p className="text-lg text-indigo-200/80 max-w-lg shadow-sm">
              محطتك الفضائية بانتظارك. انطلق في رحلة جديدة من الإنتاجية واخترق حدود المعرفة.
            </p>
            
            <div className="flex gap-4 pt-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="group relative px-6 py-3 rounded-2xl bg-[#1a1b32]/80 backdrop-blur-xl border border-indigo-500/30 overflow-hidden shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_40px_rgba(99,102,241,0.4)] transition-all duration-500"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/50 to-cyan-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative flex items-center justify-center gap-3 text-white font-bold">
                  <Plus size={18} className="text-cyan-400 group-hover:rotate-90 transition-transform duration-500" />
                  <span>برمجة محطة جديدة</span>
                </div>
              </button>
            </div>
          </div>

          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4 shrink-0">
             <div className="flex flex-col justify-center px-6 py-4 rounded-3xl bg-[#0b0c1b]/60 backdrop-blur-md border border-white/5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                  <Timer size={12} className="text-cyan-400" /> ساعات التركيز
                </span>
                <div className="text-3xl font-black text-white">{Math.round((user.xp / 60) * 10) / 10} <span className="text-sm font-medium text-gray-500">ساعة</span></div>
             </div>
             
             <div className="flex flex-col justify-center px-6 py-4 rounded-3xl bg-[#0b0c1b]/60 backdrop-blur-md border border-white/5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                  <Star size={12} className="text-fuchsia-400" /> رتبة الفضاء
                </span>
                <div className="text-3xl font-black text-white">Lvl {user.level || 1} <span className="text-sm font-medium text-gray-500">{getAstronautRank(user.xp).title}</span></div>
             </div>
          </div>
        </motion.div>

        {/* Primary Content: Active Stations */}
        <div className="flex flex-col gap-6">
           <div className="flex items-center justify-between">
              <h2 className="text-xl md:text-2xl font-black font-display text-white flex items-center gap-3">
                 <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                 </div>
                 المحطات المدارية النشطة
              </h2>
           </div>

           {rooms.length === 0 ? (
             <motion.div variants={bentoItem} className="w-full flex flex-col items-center justify-center p-12 md:p-24 rounded-3xl bg-gradient-to-br from-[#0c0d1e]/50 to-[#050510]/50 backdrop-blur-xl border border-white/5 text-center">
                 <div className="w-24 h-24 mb-6 relative">
                     <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin opacity-50" style={{ animationDuration: '3s' }} />
                     <div className="absolute inset-2 rounded-full border-r-2 border-cyan-400 animate-spin opacity-30" style={{ animationDuration: '4s', animationDirection: 'reverse' }} />
                     <Rocket size={40} className="absolute inset-0 m-auto text-indigo-400 opacity-40" />
                 </div>
                 <h3 className="text-xl font-bold text-white mb-2">المدار هادئ تماماً</h3>
                 <p className="text-indigo-200/50 max-w-sm">لا يوجد أحد في المدار حالياً. لتكن أنت أول من يطلق محطته ويبدأ جلسة تركيز عميقة.</p>
             </motion.div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room) => (
                  <StationCard
                    key={room.id}
                    room={room}
                    activeUsers={activeUsers}
                    onEnter={() => onEnterStation(room.id)}
                    isAdmin={user.role === 'admin'}
                  />
                ))}
             </div>
           )}
        </div>

        {/* Secondary Content: Missions & Cosmic Challenges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
           {/* Daily Missions */}
           <motion.div variants={bentoItem} className="flex flex-col bg-[#0b0c1b]/80 backdrop-blur-xl border border-indigo-500/10 rounded-3xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/10 transition-colors duration-700" />
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                   <Target size={18} className="text-indigo-400" />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-white">مهام النظام</h3>
                   <p className="text-xs text-indigo-200/60 uppercase tracking-widest font-bold">Daily Objectives</p>
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                 <div className="p-4 rounded-2xl bg-[#131526]/80 border border-white/5 shadow-inner">
                    <div className="flex justify-between items-center mb-3">
                       <span className="text-sm font-bold text-white">التركيز المفرط</span>
                       <span className="text-[10px] font-bold px-2 py-1 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 text-orange-400 rounded-lg flex items-center gap-1 border border-orange-500/20">
                          <Zap size={10} /> +50 XP
                       </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 font-medium mb-1.5 px-1">
                       <span>التقدم الحالي</span>
                       <span>{(user.totalFocusSessions || 0) % 3} / 3</span>
                    </div>
                    <div className="w-full h-2 bg-[#0a0b16] rounded-full overflow-hidden shadow-inner">
                       <div 
                         className="h-full bg-gradient-to-l from-orange-400 to-indigo-500 relative transition-all duration-1000"
                         style={{ width: `${Math.min(((user.totalFocusSessions || 0) % 3) * 33.3, 100)}%` }}
                       >
                         <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgoJPHJlY3Qgd2lkdGg9IjQiIGhlaWdodD0iNCIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIwLjEiLz4KPC9zdmc+')] opacity-30" />
                       </div>
                    </div>
                 </div>
              </div>
           </motion.div>

           {/* Cosmic Challenges */}
           <motion.div variants={bentoItem} className="flex flex-col bg-[#0b0c1b]/80 backdrop-blur-xl border border-fuchsia-500/10 rounded-3xl p-6 relative overflow-hidden group">
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-fuchsia-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-fuchsia-500/10 transition-colors duration-700" />
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-fuchsia-500/20 flex items-center justify-center border border-fuchsia-500/30">
                     <Swords size={18} className="text-fuchsia-400" />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-white">تحديات الأقران</h3>
                     <p className="text-xs text-fuchsia-200/60 uppercase tracking-widest font-bold">Social Combat</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowChallengeModal(true)}
                  className="px-4 py-2 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-300 rounded-xl text-xs font-bold transition-all border border-fuchsia-500/20"
                >
                  تحدي جديد +
                </button>
              </div>

              <div className="space-y-3 relative z-10">
                 {pendingChallenges.length === 0 ? (
                   <div className="text-center py-6 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                      <p className="text-xs text-gray-500">لا توجد تحديات معلقة. كن أنت المبادر!</p>
                   </div>
                 ) : (
                   pendingChallenges.map((challenge) => (
                     <div key={challenge.id} className="p-4 rounded-2xl bg-[#131526]/80 flex justify-between items-center border border-white/5">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                              <span className="text-xs">{challenge.challengerName.charAt(0)}</span>
                           </div>
                           <span className="text-sm font-bold text-white">{challenge.challengerName}</span>
                        </div>
                        <div className="flex gap-2">
                           <button 
                             onClick={async () => {
                               await updateDoc(doc(db, "challenges", challenge.id), { status: "active" });
                               const roomData = {
                                 name: `تحدي: ${challenge.challengerName} ⚔️ ${user.displayName}`,
                                 task: "تحدي التركيز العميق",
                                 creatorId: user.uid,
                                 creatorName: user.displayName,
                                 participants: [user.uid, challenge.challengerId],
                                 maxParticipants: 2,
                                 timerStatus: "idle", timerDuration: challenge.durationMinutes || 60, breakDuration: 5,
                                 createdAt: serverTimestamp(),
                                 isChallenge: true,
                                 challengeId: challenge.id,
                                 challengeDurationMinutes: challenge.durationMinutes || 60
                               };
                               const roomRef = await addDoc(collection(db, "rooms"), roomData);
                               onEnterStation(roomRef.id);
                             }}
                             className="px-4 py-1.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-lg text-xs font-bold transition-colors"
                           >
                             قبول ودخول
                           </button>
                           <button
                             onClick={() => updateDoc(doc(db, "challenges", challenge.id), { status: "declined" })}
                             className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg text-xs font-bold transition-colors"
                           >
                             رفض
                           </button>
                        </div>
                     </div>
                   ))
                 )}
              </div>
           </motion.div>
        </div>
      </motion.div>

      {/* Modals placed identically as before */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-[#000108]/90 backdrop-blur-xl" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-md p-8 rounded-[2rem] bg-[#0c0d1e] border border-indigo-500/30 shadow-[0_0_80px_rgba(99,102,241,0.2)] relative z-10"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-l from-white to-gray-400">تأسيس محطة</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 px-1">اسم المحطة الخاصة بك</label>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="مثال: مدار التركيز العميق..."
                    className="w-full p-4 rounded-2xl bg-[#060711] border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all text-white text-lg placeholder-gray-700"
                  />
                </div>
                
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-400 px-1">خلفية المحطة المدارية (اختياري)</label>
                  <div className="grid grid-cols-3 gap-3">
                    {PREDEFINED_IMAGES.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setNewRoomImageUrl(url)}
                        className={cn(
                          "relative rounded-2xl overflow-hidden aspect-[4/3] border-2 transition-all object-cover hover:scale-105",
                          newRoomImageUrl === url
                            ? "border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.4)] opacity-100"
                            : "border-transparent opacity-40 hover:opacity-80",
                        )}
                        style={{
                          backgroundImage: `url(${url})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      >
                        {newRoomImageUrl === url && (
                          <div className="absolute inset-0 bg-indigo-500/30 flex items-center justify-center backdrop-blur-[2px]">
                            <CheckCircle size={24} className="text-white drop-shadow-md" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  {newRoomImageUrl && (
                    <button
                      onClick={() => setNewRoomImageUrl("")}
                      className="text-xs font-bold text-gray-500 hover:text-red-400 transition-colors w-full text-center mt-2"
                    >
                      بدون خلفية مخصصة
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={handleCreateRoom}
                disabled={isCreating || !newRoomName}
                className="w-full mt-8 p-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:from-[#131526] disabled:to-[#131526] disabled:text-gray-500 disabled:border disabled:border-white/5 transition-all font-bold text-lg shadow-[0_0_20px_rgba(99,102,241,0.2)] disabled:shadow-none text-white flex justify-center items-center gap-2 group"
              >
                {isCreating ? "جاري الإطلاق الكوني..." : (
                  <> إطلاق المحطة <Rocket size={20} className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" /> </> 
                )}
              </button>
            </motion.div>
          </div>
        )}
        {showChallengeModal && (
          <ChallengeModal user={user} onClose={() => setShowChallengeModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

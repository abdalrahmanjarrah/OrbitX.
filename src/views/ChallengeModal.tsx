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

export default function ChallengeModal({
  user,
  onClose,
}: {
  user: UserData;
  onClose: () => void;
}) {
  const [friends, setFriends] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "users", user.uid, "friends"), limit(20));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const friendIds = snapshot.docs.map((doc) => doc.id);
      if (friendIds.length > 0) {
        try {
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
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user.uid]);

  const sendChallenge = async (friendId: string) => {
    try {
      await addDoc(collection(db, "challenges"), {
        challengerId: user.uid,
        challengerName: user.displayName,
        challengedId: friendId,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      addDoc(collection(db, "users", friendId, "notifications"), {
        type: "challenge",
        content: `دعاك ${user.displayName} لتحدي دراسي جديد!`,
        read: false,
        timestamp: serverTimestamp(),
      }).catch(console.error);
      alert("تم إرسال طلب التحدي بنجاح!");
      onClose();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, "challenges");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#0a0b16] rounded-3xl p-6 md:p-8 w-full max-w-md border border-white/10 shadow-2xl shadow-indigo-900/20 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-gray-500 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-black mb-6 text-center text-indigo-400">
          اختر صديق للتحدي 🎯
        </h2>

        {loading ? (
          <div className="py-8 text-center text-gray-500">
            جاري تحميل الأصدقاء...
          </div>
        ) : friends.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            لا يوجد أصدقاء. ابحث عن رواد لتضيفهم!
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            {friends.map((friend) => (
              <div
                key={friend.uid}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={friend.photoURL}
                      alt={friend.displayName}
                      className="w-10 h-10 rounded-full object-cover border border-white/10"
                      referrerPolicy="no-referrer"
                    />
                    {friend.lastActiveTime &&
                      Date.now() - friend.lastActiveTime < 300000 && (
                        <div
                          className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0b16]"
                          title="متصل الآن"
                        />
                      )}
                  </div>
                  <div>
                    <div className="font-bold text-sm">
                      {friend.displayName}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      المستوى {friend.level}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => sendChallenge(friend.uid)}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-500/20 text-white"
                >
                  تحدي
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

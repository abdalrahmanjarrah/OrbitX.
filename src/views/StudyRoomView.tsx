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
import { Debugger } from "../firebaseDebug";
import { requestXpGrant } from "../lib/xpSystem";
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

export default function StudyRoomView(props: {
  user: UserData;
  stationId: string;
  onExit: () => void;
  onSelectUser: (id: string) => void;
}) {
  const [authStatus, setAuthStatus] = useState<"loading" | "authorized" | "spectator" | "rejected">("loading");

  useEffect(() => {
    let active = true;
    const checkAuth = async () => {
      try {
        const snap = await getDoc(doc(db, "rooms", props.stationId));
        if (!snap.exists()) {
          setAuthStatus("rejected");
          props.onExit();
          return;
        }

        const data = snap.data() as Room;
        let allowed = true;
        let spectator = false;
        
        // 1. Participant Eligibility (Private Challenge)
        if (data.isChallenge) {
          allowed = (props.user.uid === data.creatorId) || (data.participants && data.participants.includes(props.user.uid));
        }

        if (!allowed) {
          if (props.user.role === "admin") {
            spectator = true;
            allowed = true;
          } else {
            alert("هذا التحدي خاص. لا يمكنك الدخول.");
            setAuthStatus("rejected");
            props.onExit();
            return;
          }
        }

        // 2. Capacity Validation
        if (allowed && !spectator && data.maxParticipants && data.maxParticipants > 0) {
          const currentCount = data.participants ? data.participants.length : 0;
          if (currentCount >= data.maxParticipants && (!data.participants || !data.participants.includes(props.user.uid))) {
            if (props.user.role === "admin") {
              spectator = true;
            } else {
              alert("المحطة ممتلئة! لا يمكنك الدخول.");
              setAuthStatus("rejected");
              props.onExit();
              return;
            }
          }
        }

        if (active) setAuthStatus(spectator ? "spectator" : "authorized");
      } catch (err) {
        if (active) {
          setAuthStatus("rejected");
          props.onExit();
        }
      }
    };
    checkAuth();
    return () => { active = false; };
  }, [props.stationId, props.user.uid, props.user.role, props.onExit]);

  if (authStatus === "loading") {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-white relative z-50">
        <div className="flex flex-col items-center space-y-4">
          <Rocket className="w-12 h-12 animate-bounce text-blue-500" />
          <p className="font-mono text-blue-300">يتم التحقق من التصريح...</p>
        </div>
      </div>
    );
  }
  
  if (authStatus === "rejected") return null;

  return <StudyRoomContent {...props} isSpectator={authStatus === "spectator"} />;
}

function StudyRoomContent({
  user,
  stationId,
  onExit,
  onSelectUser,
  isSpectator,
}: {
  user: UserData;
  stationId: string;
  onExit: () => void;
  onSelectUser: (id: string) => void;
  isSpectator: boolean;
}) {
  const [room, setRoom] = useState<Room | null>(null);
  const lastXpGrantTimestampRef = useRef<number | null>(null);
  const safeUpdateRoom = async (data: any) => {
    try {
      await updateDoc(doc(db, "rooms", stationId), data);
    } catch (e) {}
  };

  const checkChallengeCompletion = async (cId: string) => {
    try {
      const snap = await getDoc(doc(db, "challenges", cId));
      if (!snap.exists()) return;
      const cData = snap.data() as Challenge;
      
      if (cData.status !== "active") return;
      
      const target = cData.durationMinutes;
      const p1 = cData.progressPlayer1 || 0;
      const p2 = cData.progressPlayer2 || 0;
      
      if (p1 >= target || p2 >= target) {
         let winnerId = "";
         if (p1 >= target && p2 >= target) {
           winnerId = p1 > p2 ? cData.challengerId : (p2 > p1 ? cData.challengedId : "tie");
         } else if (p1 >= target) {
           winnerId = cData.challengerId;
         } else {
           winnerId = cData.challengedId;
         }
         
         await updateDoc(doc(db, "challenges", cId), {
           status: "completed",
           winnerId
         });
         
         const isUserWinner = winnerId === user.uid;
         if (winnerId !== "tie") {
            if (isUserWinner) {
               await updateDoc(doc(db, "users", user.uid), {
                  coins: increment(50)
               });
               requestXpGrant(user.uid, user.fleetId, null, false, 50, "challenge_win", true);
               addDoc(collection(db, "users", user.uid, "notifications"), {
                 type: "challenge_win",
                 content: `مبروك! لقد فزت بتحدي التركيز. تم إضافة 50 XP لعملك الرائع!`,
                 read: false,
                 timestamp: serverTimestamp(),
               }).catch(() => {});
            }
         }
         
         addDoc(collection(db, "rooms", stationId, "messages"), {
            text: winnerId === "tie" ? "انتهى التحدي بالتعادل!" : `🏆 انتهى التحدي! الفائز هو ${winnerId === cData.challengerId ? cData.challengerName : cData.challengedName}`,
            userId: "system",
            userName: "نظام التحديات",
            userPhoto: "",
            timestamp: serverTimestamp(),
            type: "text",
         });
      }
    } catch(e) {
      console.error(`Failed to check challenge: ${e}`);
    }
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<{id: string, text: string, type: 'distraction' | 'presence'}[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [typingMap, setTypingMap] = useState<
    Record<string, { name: string; time: number }>
  >({});
  const [deletingMsgId, setDeletingMsgId] = useState<string | null>(null);
  const lastTypingUpdate = useRef(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [participantsData, setParticipantsData] = useState<UserData[]>([]);
  const [challengeData, setChallengeData] = useState<Challenge | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [showFuelLeak, setShowFuelLeak] = useState(false);
  const [leakedXP, setLeakedXP] = useState(0);
  
  const fuelLeakIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const localLeakedRef = useRef<number>(0);

  const [showAFKCheck, setShowAFKCheck] = useState(false);
  const [isWatchingClass, setIsWatchingClass] = useState(false);
  const [afkTimeLeft, setAfkTimeLeft] = useState(60);
  const afkCheckedForThisCycleRef = useRef<number | null>(null);

  const [hasJoinedStation, setHasJoinedStation] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const isExitingRef = useRef(false);
  const isJoinedRef = useRef(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [sharedNotes, setSharedNotes] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState<number>(0);
  const participantsCountRef = useRef(0);
  
  const isHost = room ? ((room.hostId || room.creatorId) === user.uid || user.role === "admin") : false;

  const lastXpUpdateTimeRef = useRef<number | null>(null);
  
  const afkFailCountRef = useRef(0);
  const sessionXpCountRef = useRef<number>(0);
  const MAX_XP_PER_SESSION = 120;

  const xpIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isJoined || room?.timerStatus !== "focus") {
      lastXpUpdateTimeRef.current = null;
      if (xpIntervalRef.current) {
        Debugger.logClearInterval("XP Loop (Not Joined)", xpIntervalRef.current);
        clearInterval(xpIntervalRef.current);
        xpIntervalRef.current = null;
      }
      return;
    }

    if (lastXpUpdateTimeRef.current === null) {
      lastXpUpdateTimeRef.current = Date.now();
      sessionXpCountRef.current = 0;
      afkFailCountRef.current = 0;
    }

    if (xpIntervalRef.current) {
      Debugger.logClearInterval("XP Loop", xpIntervalRef.current);
      clearInterval(xpIntervalRef.current);
    }

    xpIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const secondsSpent = Math.floor(
        (now - (lastXpUpdateTimeRef.current || now)) / 1000
      );

      if (secondsSpent >= 60) {
        const elapsedMinutes = Math.floor(secondsSpent / 60);
        lastXpUpdateTimeRef.current = (lastXpUpdateTimeRef.current || now) + elapsedMinutes * 60000;

        const globalLastGrant = (user as any).lastXpUpdate || 0;
        const lastGrant = Math.max(lastXpGrantTimestampRef.current || 0, globalLastGrant);
        
        const globalElapsedMinutes = Math.floor((now - lastGrant + 5000) / 60000); // 5s grace period

        const maxAllowedXp = MAX_XP_PER_SESSION - sessionXpCountRef.current;
        let xpToGrant = Math.min(elapsedMinutes, globalElapsedMinutes, maxAllowedXp);

        if (xpToGrant > 0) {
          lastXpGrantTimestampRef.current = now;
          sessionXpCountRef.current += xpToGrant;
          
          requestXpGrant(
             user.uid,
             user.fleetId,
             room?.isChallenge ? room.challengeId : null,
             user.uid === room?.creatorId,
             xpToGrant,
             `Focus Interval (Elapsed: ${elapsedMinutes}m)`,
             false // check lock!
          ).then(granted => {
             if (granted > 0 && room?.isChallenge && room.challengeId) {
                checkChallengeCompletion(room.challengeId).catch(() => {});
             }
          });
        }
      }
    }, 1000);
    Debugger.logInterval("XP Loop", xpIntervalRef.current);

    return () => {
      if (xpIntervalRef.current) {
        Debugger.logClearInterval("XP Loop (Cleanup)", xpIntervalRef.current);
        clearInterval(xpIntervalRef.current);
        xpIntervalRef.current = null;
      }
    };
  }, [isJoined, room?.timerStatus, user.uid, user.fleetId]);

  const performSafeExit = async (options: {
    isPenalty?: boolean;
    penaltyReason?: string;
    penaltyAmount?: number;
    customExitMessage?: string;
    skipFirebaseUpdate?: boolean;
  } = {}) => {
    if (isExitingRef.current) return;
    isExitingRef.current = true;
    setIsExiting(true);
    setShowExitDialog(false);

    // FREEZE TIMERS & INTERVALS INSTANTLY
    if (xpIntervalRef.current) {
      clearInterval(xpIntervalRef.current);
      xpIntervalRef.current = null;
    }
    if (fuelLeakIntervalRef.current) {
      clearInterval(fuelLeakIntervalRef.current);
      fuelLeakIntervalRef.current = null;
    }

    console.log("[Exit] Exit started. Intervals cleared.");

    if (options.isPenalty && options.penaltyReason) {
      try {
        console.log("[Exit] Applying penalty:", options.penaltyAmount, options.penaltyReason);
        requestXpGrant(user.uid, user.fleetId, null, false, options.penaltyAmount || -10, options.penaltyReason, true);
      } catch (e) {
        console.error("Failed to apply exit penalty:", e);
      }
    }

    if (!options.skipFirebaseUpdate && participantsCountRef.current > 1) {
      console.log("[Exit] Broadcasting exit message...");
      addDoc(collection(db, "rooms", stationId, "messages"), {
        text: options.customExitMessage || (options.isPenalty 
          ? `🚀 غادر المحرك (${user.displayName}) المحطة والتايمر يعمل بوضع الدراسة (تم خصم ${Math.abs(options.penaltyAmount || 10)} XP).`
          : `🚀 غادر المحرك (${user.displayName}) المحطة.`),
        userId: "system",
        userName: "نظام التنبيه",
        userPhoto: "",
        timestamp: serverTimestamp(),
        type: "text",
      }).catch(e => console.error("error broadcasting exit message", e));
    }

    if (!options.skipFirebaseUpdate) {
      console.log("[Exit] Removing from database...");
      updateDoc(doc(db, 'rooms', stationId), {
        participants: arrayRemove(user.uid)
      }).catch(e => {
        console.error("Failed to remove user from room:", e);
      });
    }

    console.log("[Exit] Navigation completed... triggering onExit.");
    onExit();
  };

  const handleConfirmExit = async () => {
    let isPenalty = false;
    if (room?.timerStatus === "focus") {
      isPenalty = true;
    }
    performSafeExit({
      isPenalty,
      penaltyReason: "self_exit_penalty",
      penaltyAmount: -10
    });
  };

  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [studyLink, setStudyLink] = useState("");
  const [showStudyLinkModal, setShowStudyLinkModal] = useState(false);
  const studyLinkRef = useRef("");

  // Cosmic Loss System (Bet)
  const [showBetModal, setShowBetModal] = useState(false);
  const [betError, setBetError] = useState("");
  const currentBetRef = useRef<number>(0);
  const remainingShieldRef = useRef<number>(0);
  const [shieldPercent, setShieldPercent] = useState<number>(0);

  useEffect(() => {
    isJoinedRef.current = isJoined;
  }, [isJoined]);

  const isWatchingClassRef = useRef(false);
  useEffect(() => {
    isWatchingClassRef.current = isWatchingClass;
  }, [isWatchingClass]);

  useEffect(() => {
    participantsCountRef.current = participantsData.length;
  }, [participantsData.length]);

  // Next Mission state
  const [showNextMissionModal, setShowNextMissionModal] = useState(false);
  const [nextMissionInput, setNextMissionInput] = useState("");
  const [pendingMission, setPendingMission] = useState<string | null>(null);

  useEffect(() => {
    const unsubTyping = onSnapshot(
      collection(db, "rooms", stationId, "typing"),
      (snap) => {
        const newMap: Record<string, { name: string; time: number }> = {};
        snap.docs.forEach((d) => {
          if (d.id !== user.uid)
            newMap[d.id] = d.data() as { name: string; time: number };
        });
        setTypingMap(newMap);
      },
      () => {},
    );

    const interval = setInterval(() => {
      setTypingMap((m) => {
        let changed = false;
        const next = { ...m };
        const now = Date.now();
        for (const k in next) {
          if (now - next[k].time > 4000) {
            delete next[k];
            changed = true;
          }
        }
        return changed ? next : m;
      });
    }, 2000);
    return () => {
      unsubTyping();
      clearInterval(interval);
    };
  }, [stationId, user.uid]);

  const typingNames = Object.values(typingMap)
    .filter((t) => Date.now() - t.time < 4000)
    .map((t) => t.name);

  // We have removed WebRTC logic

  const hasShownMissionModalRef = useRef(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const roomStatusRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    roomStatusRef.current = room?.timerStatus || null;
    
    // Clear the fuel leak penalty if the room is no longer in focus mode!
    if (room?.timerStatus !== "focus" && fuelLeakIntervalRef.current) {
      clearInterval(fuelLeakIntervalRef.current);
      fuelLeakIntervalRef.current = null;
      setShowFuelLeak(false);
    }
  }, [room?.timerStatus]);

  const autoJoinAttempted = useRef(false);

  useEffect(() => {
    const autoJoin = async () => {
      if (!autoJoinAttempted.current) {
        autoJoinAttempted.current = true;
        if (isSpectator) return;
        
        setHasJoinedStation(true);
        setIsJoined(true);
        try {
          await safeUpdateRoom({
            participants: arrayUnion(user.uid),
            emptyAt: null,
          });
          if (
            "Notification" in window &&
            Notification.permission === "default"
          ) {
            Notification.requestPermission();
          }
          await updateDoc(doc(db, "users", user.uid), {
            currentActivity: `في مدار محطة: ${room?.name || "خاصة"}`,
          });
        } catch (e) {
          console.error(e);
        }
      }
    };
    autoJoin();
  }, [stationId, room?.name, user.uid]);

  const toggleCall = async () => {
    if (isSpectator) return;
    if (isJoined) {
      setIsJoined(false);
      try {
        const docSnap = await getDoc(doc(db, "rooms", stationId));
        if (docSnap.exists()) {
          const rem = docSnap
            .data()
            .participants.filter((p: string) => p !== user.uid);
          const updates: any = {
            participants: arrayRemove(user.uid),
            emptyAt: rem.length === 0 ? serverTimestamp() : deleteField(),
          };
          const currentHostId = docSnap.data().hostId || docSnap.data().creatorId;
          if (currentHostId === user.uid && rem.length > 0) {
            updates.hostId = rem[0];
          }
          if (rem.length === 0) {
            updates.timerStatus = "idle";
          }
          await safeUpdateRoom(updates);
        }
      } catch (e) {}
      setHasJoinedStation(false);
    } else {
      setIsJoined(true);
      await safeUpdateRoom({
        participants: arrayUnion(user.uid),
        emptyAt: null,
      });
      setHasJoinedStation(true);
    }
  };

  const alertSound = useRef(
    new Audio(
      "https://assets.mixkit.co/active_storage/sfx/2558/2558-preview.mp3",
    ),
  );
  const successSound = useRef(
    new Audio(
      "https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3",
    ),
  );

  // Sound synchronization logic
  useEffect(() => {
    if (showAlert) {
      alertSound.current.play().catch(() => {});
    }
  }, [showAlert]);

  const prevStatus = useRef<string | null>(null);
  useEffect(() => {
    if (room?.timerStatus === "idle" && prevStatus.current === "focus") {
      successSound.current.play().catch(() => {});
    }
    prevStatus.current = room?.timerStatus || null;
  }, [room?.timerStatus]);

  useEffect(() => {
    let unsubChallenge: () => void;
    if (room?.isChallenge && room?.challengeId) {
      unsubChallenge = onSnapshot(doc(db, "challenges", room.challengeId), (docSnap) => {
         if (docSnap.exists()) {
             setChallengeData({ id: docSnap.id, ...docSnap.data() } as Challenge);
         }
      });
    }
    return () => {
      if (unsubChallenge) unsubChallenge();
    };
  }, [room?.isChallenge, room?.challengeId]);

  useEffect(() => {
    const roomRef = doc(db, "rooms", stationId);
    const unsubscribeRoom = onSnapshot(
      roomRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Room;
          setRoom({ id: docSnap.id, ...data });

          if (data.sharedNotes !== undefined && !isEditingNotes) {
            setSharedNotes(data.sharedNotes);
          }

          // Initial sync
          if (data.timerStatus !== "idle" && data.startTime) {
            const start = data.startTime.toDate().getTime();
            const duration =
              (data.timerStatus === "focus"
                ? data.timerDuration
                : data.breakDuration) *
              60 *
              1000;
            const elapsed = Date.now() - start;
            const remaining = Math.max(
              0,
              Math.floor((duration - elapsed) / 1000),
            );
            setTimeLeft(remaining);
          } else {
            setTimeLeft(data.timerDuration * 60);
          }
        } else {
          // Room was deleted or doesn't exist
          setTimeout(() => performSafeExit({ skipFirebaseUpdate: true }), 0);
        }
      },
      (e) => handleFirestoreError(e, OperationType.GET, `rooms/${stationId}`),
    );

    const messagesQuery = query(
      collection(db, "rooms", stationId, "messages"),
      orderBy("timestamp", "desc"),
      limit(50),
    );
    let initialLoadMsgs = true;
    const unsubscribeMessages = onSnapshot(
      messagesQuery,
      (snapshot) => {
        let msgs = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Message,
        );
        msgs = msgs.reverse();
        setMessages(msgs);

        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const msg = change.doc.data();
            // User requested no chat sound inside Study Rounds. So we mute it.
            // if (!initialLoadMsgs && msg.userId !== user.uid) { playSound("message"); }
            if (!initialLoadMsgs) {
              if (msg.isExitPenalty) {
                setActiveAlerts(prev => [...prev, {id: change.doc.id, text: msg.text, type: 'distraction'}]);
              } else if (msg.type === 'system' || msg.text.includes("انضم إلى") || msg.text.includes("غادر المحطة")) {
                setActiveAlerts(prev => [...prev, {id: change.doc.id, text: msg.text, type: 'presence'}]);
              }
            }
            if (
              msg.isExitPenalty &&
              msg.userId !== user.uid &&
              isJoinedRef.current &&
              prevStatus.current === "focus"
            ) {
              // Self-deduct XP
              requestXpGrant(user.uid, user.fleetId, null, false, -20, "peer_exit_penalty", true);
            }
          }
        });
        initialLoadMsgs = false;
      },
      (e) =>
        handleFirestoreError(
          e,
          OperationType.GET,
          `rooms/${stationId}/messages`,
        ),
    );

    // Join automatically on mount
    if (!isJoinedRef.current && !isSpectator) {
      setIsJoined(true);
      setHasJoinedStation(true);
      updateDoc(roomRef, {
        participants: arrayUnion(user.uid),
        emptyAt: null,
      }).catch(() => {});
    }

    updateDoc(doc(db, "users", user.uid), {
      currentActivity: `يتصفح محطة: ${room?.name || "..."}`,
    }).catch((e) =>
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`),
    );

    // Tab visibility detection for Fuel Leak
    // Using refs to share state between useEffect and normal functions

   const handleVisibilityChange = () => {
    if (!isJoinedRef.current) return;
    if (document.visibilityState === "hidden" || !document.hasFocus()) {
      if (roomStatusRef.current !== "focus") return;
      
      if (studyLinkRef.current && studyLinkRef.current.trim() !== "") {
        return;
      }

      if (isWatchingClassRef.current) {
        return;
      }

      setShowFuelLeak(true);
      localLeakedRef.current = 0;
      setLeakedXP(0);

      try {
        playSound("alert");
      } catch (e) {}

      // Announce to the room that the engine stopped
      if (participantsCountRef.current > 1) {
        addDoc(collection(db, "rooms", stationId, "messages"), {
          text: `🚨 المحرك (${user.displayName}) توقف عن العمل! السفينة تتباطأ!`,
          userId: "system",
          userName: "نظام التنبيه",
          userPhoto: "",
          timestamp: serverTimestamp(),
          type: "text",
          isExitPenalty: true,
        }).catch(() => {});
      }

      if (!fuelLeakIntervalRef.current) {
        fuelLeakIntervalRef.current = setInterval(async () => {
          localLeakedRef.current += 1;
          setLeakedXP(localLeakedRef.current);

          // إذا كان هناك رهان والدرع ما زال متوفراً لحماية اللاعب
          if (currentBetRef.current > 0 && remainingShieldRef.current > 0) {
            remainingShieldRef.current = Math.max(0, remainingShieldRef.current - 1);
            setShieldPercent(
              Math.round((remainingShieldRef.current / currentBetRef.current) * 100)
            );
          } 
          // الـ Fallback: إذا لم يكن هناك رهان أصلاً، أو انتهى الدرع ووصل لـ 0 (الخصم المباشر)
          else {
            try {
              // خصم الـ XP من المستخدم
              requestXpGrant(user.uid, user.fleetId, null, false, -1, "fuel_leak_tick", true);
            } catch (err) {
              console.error("Error draining XP:", err);
            }
          }
        }, 60000); // تكرار كل دقيقة
      }
    } else {
      if (fuelLeakIntervalRef.current) {
        clearInterval(fuelLeakIntervalRef.current);
        fuelLeakIntervalRef.current = null;
      }
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("blur", handleVisibilityChange);
  window.addEventListener("focus", handleVisibilityChange);

    return () => {
      if (fuelLeakIntervalRef.current) {
        clearInterval(fuelLeakIntervalRef.current);
        fuelLeakIntervalRef.current = null;
      }
      unsubscribeRoom();
      unsubscribeMessages();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);

      // Use a more reliable cleanup
      const cleanup = async () => {
        if (!user?.uid || !stationId || isSpectator) return;
        try {
          const roomSnap = await getDoc(roomRef);
          
          // 1. حماية صارمة: إذا المحطة محذوفة أصلاً من قاعدة البيانات، توقف فوراً ولا تعمل أي شيء!
          if (!roomSnap.exists()) {
            console.log("المحطة محذوفة بالفعل، تم إلغاء التحديثات لمنع عودتها.");
            // نقوم فقط بتحديث نشاط المستخدم بأمان دون لمس المحطة
            await updateDoc(doc(db, "users", user.uid), {
              currentActivity: "في لوحة التحكم",
            }).catch(() => {});
            return;
          }

          const data = roomSnap.data();
          const remainingParticipants = (data.participants || []).filter(
            (p: string) => p !== user.uid,
          );

          const updates: any = {
            participants: arrayRemove(user.uid),
            emptyAt: remainingParticipants.length === 0 ? serverTimestamp() : deleteField(),
          };

          const currentHostId = data.hostId || data.creatorId;
          if (currentHostId === user.uid && remainingParticipants.length > 0) {
            updates.hostId = remainingParticipants[0];
          }
          
          if (remainingParticipants.length === 0) {
            updates.timerStatus = "idle";
          }

          // نحدث المحطة فقط لأننا تأكدنا بوجودها بالـ if السابقة
          await updateDoc(roomRef, updates);

          if (remainingParticipants.length === 0) {
            setTimeout(async () => {
              try {
                const checkSnap = await getDoc(roomRef);
                if (checkSnap.exists() && (!checkSnap.data().participants || checkSnap.data().participants.length === 0)) {
                  await deleteDoc(roomRef);
                }
              } catch (e) {}
            }, 300000);
          }

          // تحديث نشاط المستخدم بنجاح
          await updateDoc(doc(db, "users", user.uid), {
            currentActivity: "في لوحة التحكم",
          });

        } catch (e: any) {
          if (
            e?.code !== 'not-found' && e?.code !== 'permission-denied' &&
            !e?.message?.includes("No document to update")
          ) {
            console.error('Cleanup safely bypassed:', e);
            Debugger.logCleanupError(`StudyRoom cleanup failed: ${e?.message}`);
          }
        }
      };
      cleanup();

      if (false) {
        // removed
      }
    };
  }, [stationId, user.uid]);

  // We have removed the Automatic Mic Control based on Timer
  useEffect(() => {
    if (room?.participants) {
      // Clear participants who are no longer in the room
      setParticipantsData((prev) =>
        prev.filter((p) => room.participants.includes(p.uid)),
      );

      if (isJoined) {
        // Voice features have been removed or moved
      }

      const unsubscribes = room.participants.map((uid) => {
        return onSnapshot(
          doc(db, "profiles", uid),
          (docSnap) => {
            if (docSnap.exists()) {
              setParticipantsData((prev) => {
                const filtered = prev.filter((p) => p.uid !== uid);
                return [...filtered, docSnap.data() as UserData];
              });
            }
          },
          (e) => handleFirestoreError(e, OperationType.GET, `users/${uid}`),
        );
      });
      return () => unsubscribes.forEach((unsub) => unsub());
    } else {
      setParticipantsData([]);
    }
  }, [room?.participants, isJoined, user.uid]);

  // Hearts logic removed
  const roomSnapshotRef = useRef(room);
  useEffect(() => {
    roomSnapshotRef.current = room;
  }, [room]);

  useEffect(() => {
    if (room && room.timerStatus !== "idle" && room.startTime) {
      const workerCode = `
        let intervalId;
        self.onmessage = function(e) {
          if (e.data === 'start') {
            intervalId = setInterval(() => self.postMessage('tick'), 1000);
          } else if (e.data === 'stop') {
            clearInterval(intervalId);
          }
        };
      `;
      const blob = new Blob([workerCode], { type: "application/javascript" });
      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl);

      worker.onmessage = () => {
        const r = roomSnapshotRef.current;
        if (!r || !r.startTime) return;
        const start =
          typeof r.startTime.toDate === "function"
            ? r.startTime.toDate().getTime()
            : (r.startTime as any).seconds * 1000;
        const duration =
          (r.timerStatus === "focus" ? r.timerDuration : r.breakDuration) *
          60 *
          1000;
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, Math.floor((duration - elapsed) / 1000));
        setTimeLeft(remaining);
      };

      worker.postMessage("start");

      return () => {
        worker.postMessage("stop");
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
      };
    }
  }, [
    room?.timerStatus,
    room?.startTime,
    room?.timerDuration,
    room?.breakDuration,
  ]);

  // AFK Check Logic
  useEffect(() => {
    if (room?.timerStatus !== "focus" || timeLeft <= 0 || !isJoined) {
      setShowAFKCheck(false);
      setIsWatchingClass(false);
      afkCheckedForThisCycleRef.current = null;
      return;
    }

    if (isWatchingClass) return;

    const durationSeconds = room.timerDuration * 60;
    // Check at 15m (900s), 10m (600s), 5m (300s) left, if duration is long enough
    const checkThresholds = [900, 600, 300].filter(
      (t) => t < durationSeconds - 60,
    );

    checkThresholds.forEach((threshold) => {
      if (
        Math.abs(timeLeft - threshold) <= 2 &&
        afkCheckedForThisCycleRef.current !== threshold
      ) {
        afkCheckedForThisCycleRef.current = threshold;
        if (!showAFKCheck) {
          setShowAFKCheck(true);
          setAfkTimeLeft(60);
          try {
            playSound("notification");
            // Play ping sound
            const audio = new Audio(
              "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
            );
            audio.play();
          } catch (e) {}
        }
      }
    });
  }, [
    timeLeft,
    room?.timerStatus,
    room?.timerDuration,
    isJoined,
    showAFKCheck,
    isWatchingClass,
  ]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showAFKCheck) {
      interval = setInterval(() => {
        setAfkTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setTimeout(() => handleAFKFailure(), 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showAFKCheck]);

  const handleAFKFailure = async () => {
    afkFailCountRef.current += 1;
    if (afkFailCountRef.current < 2) {
      // إعطاء فرصة ثانية قبل الطرد النهائي
      setAfkTimeLeft(15);
      return;
    }

    setShowAFKCheck(false);

    // Kick user out
    performSafeExit({
       customExitMessage: `💤 غادر ${user.displayName} المحطة بسبب عدم الاستجابة (AFK). تم حفظ نقاطه المسجلة حتى الآن.`
    });
  };

  const triggerRedAlert = async () => {
    setShowAlert(true);

    // Deduct 20 XP on distraction
    requestXpGrant(user.uid, user.fleetId, null, false, -20, "distraction_penalty", true);

    // Broadcast alert to chat
    await addDoc(collection(db, "rooms", stationId, "messages"), {
      text: `☄️ نيزك ضرب المحطة! ${user.displayName} تشتت وفقد 20 XP!`,
      userId: user.uid,
      userName: "نظام التنبيه",
      userPhoto: "",
      timestamp: serverTimestamp(),
      type: "text",
    });

    setTimeout(() => setShowAlert(false), 4000);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    if (newMessage.length > 500) {
      alert("الرسالة طويلة جداً! الحد الأقصى هو 500 حرف.");
      return;
    }

    if (room?.isChatLocked && !isHost) {
      alert("الدردشة مغلقة من قبل المشرف.");
      return;
    }

    if (room?.timerStatus === "focus") {
      const now = Date.now();
      if (now - lastMessageTime < 5 * 60 * 1000) {
        const remainingMinutes = Math.ceil(
          (5 * 60 * 1000 - (now - lastMessageTime)) / 60000,
        );
        alert(
          `التايمر يعمل بوضع الدراسة! يمكنك إرسال رسالة واحدة فقط كل 5 دقائق. يرجى الانتظار ${remainingMinutes} دقيقة.`,
        );
        return;
      }
      setLastMessageTime(now);
    }

    try {
      await addDoc(collection(db, "rooms", stationId, "messages"), {
        text: newMessage,
        userId: user.uid,
        userName: user.displayName,
        userPhoto: user.photoURL,
        timestamp: serverTimestamp(),
        type: "text",
      });
      setNewMessage("");
    } catch (e) {
      handleFirestoreError(
        e,
        OperationType.WRITE,
        `rooms/${stationId}/messages`,
      );
    }
  };

  useEffect(() => {
    if (
      room?.timerStatus === "focus" &&
      timeLeft <= 60 &&
      timeLeft > 0 &&
      !hasShownMissionModalRef.current &&
      room.timerDuration > 1
    ) {
      setShowNextMissionModal(true);
      hasShownMissionModalRef.current = true;
    }

    if (room?.timerStatus !== "focus") {
      hasShownMissionModalRef.current = false;
    }
  }, [timeLeft, room?.timerStatus, room?.timerDuration]);

  useEffect(() => {
    if (room?.timerStatus === "focus") {
      const stored = localStorage.getItem("pendingMission");
      if (stored) {
        setPendingMission(stored);
        localStorage.removeItem("pendingMission");
      } else {
        setPendingMission(null);
      }
    } else {
      setPendingMission(null);
    }
  }, [room?.timerStatus]);

  const handleNextMissionSubmit = () => {
    if (nextMissionInput.trim()) {
      localStorage.setItem("pendingMission", nextMissionInput.trim());
    }
    setShowNextMissionModal(false);
    setNextMissionInput("");
  };

  const isTransitioningRef = useRef(false);

  useEffect(() => {
    if (timeLeft > 0) {
      isTransitioningRef.current = false;
    }
    if (timeLeft === 0 && room && room.timerStatus !== "idle") {
      if (!room.startTime) return;
      const startMs =
        typeof room.startTime.toDate === "function"
          ? room.startTime.toDate().getTime()
          : room.startTime.seconds * 1000;
      const durationMs =
        (room.timerStatus === "focus"
          ? room.timerDuration
          : room.breakDuration) *
        60 *
        1000;
      const elapsed = Date.now() - startMs;
      // Require at least 90% of the time really elapsed to avoid stale timeLeft=0 race condition
      if (elapsed < durationMs - 5000) return;
      
      const isLegitEnd = elapsed <= durationMs + 2 * 60 * 1000;

      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;

      // Only show Notification and sound if legit end
      if (isLegitEnd) {
        if (
          "Notification" in window &&
          Notification.permission === "granted" &&
          document.visibilityState === "hidden"
        ) {
          new Notification("انتهى الوقت!", {
            body:
              room.timerStatus === "focus"
                ? "انتهت جلسة التركيز، حان وقت الاستراحة"
                : "انتهت الاستراحة، حان وقت التركيز",
          });
        }
        playSound("timer");
      }

      if (room.timerStatus === "focus" && isLegitEnd) {
        // Award XP and increment sessions
        const isGroup = participantsCountRef.current > 1;
        const groupMultiplier = 1;
        const xpEarnedBase = room.timerDuration; // 1 XP per minute
        const regularXp = xpEarnedBase * groupMultiplier;

        // Reset join time so leaving during break doesn't grant focus XP again
        // lastXpUpdateTimeRef already handles this by being null

        // Return remaining shield to user
        const refund =
          remainingShieldRef.current > 0 ? remainingShieldRef.current : 0;
        const safeXpEarned = Math.min(refund, Math.max(0, MAX_XP_PER_SESSION - sessionXpCountRef.current));

        currentBetRef.current = 0;
        remainingShieldRef.current = 0;
        setShieldPercent(0);
        const userRef = doc(db, "users", user.uid);
        const updates: any = {
          totalFocusSessions: increment(1),
          lastStudyDate: new Date().toISOString().split("T")[0],
        };

        if (((user.totalFocusSessions || 0) + 1) % 3 === 0) {
          updates.completedTasks = increment(1); // Keep track of completed tasks if we want
        }

        if (((user.totalFocusSessions || 0) + 1) % 5 === 0) {
          updates.seeds = increment(1);
        }

        // Also we must water the plants if they exist
        if (user.plants && user.plants.length > 0) {
          const now = Date.now();
          // We can't easily iterate and map over an array in Firestore updates
          // without replacing the whole array.
          const updatedPlants = user.plants.map((p) => ({
            ...p,
            lastWateredAt: now,
          }));
          updates.plants = updatedPlants;
        }

        updateDoc(userRef, updates).catch((e) =>
          handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`),
        );

        let totalXpToGive = 0;
        if (safeXpEarned > 0) {
            totalXpToGive += safeXpEarned;
        }
        if (((user.totalFocusSessions || 0) + 1) % 3 === 0) {
            totalXpToGive += 50;
        }

        if (totalXpToGive > 0) {
            requestXpGrant(
              user.uid,
              user.fleetId,
              null, // Shield returns and quests do NOT count toward challenge time
              false,
              totalXpToGive,
              `on_exit_session (refund/quest)`,
              true // force bypass lock! Because multiple things might happen.
            ).then(granted => {
              if (granted > 0 && room?.isChallenge && room.challengeId) {
                  // We still check just in case, but no progress added here
                  checkChallengeCompletion(room.challengeId).catch(() => {});
              }
            });
        }

        if (user.fleetId) {
          updateDoc(doc(db, "fleets", user.fleetId), {
            totalFocusHours: increment(room.timerDuration / 60),
          }).catch((e) => console.error(e));
        }
      }

      // Auto transition for anyone to prevent stalls if host is AFK
      const delay =
        isHost ? 0 : Math.random() * 2000 + 1000;
      setTimeout(() => {
        const nextStatus = room.timerStatus === "focus" ? "break" : "idle";
        const focusToAdd =
          room.timerStatus === "focus" ? room.timerDuration * 60 : 0;

        const updateData: any = {
          timerStatus: nextStatus,
          startTime: nextStatus === "break" ? serverTimestamp() : deleteField(),
        };

        if (focusToAdd > 0) {
          updateData.accumulatedFocusSeconds =
            (room.accumulatedFocusSeconds || 0) + focusToAdd;
        }

        safeUpdateRoom(updateData);
      }, delay);

      setTimeout(() => {
        isTransitioningRef.current = false;
      }, 5000);
    }
  }, [timeLeft, room?.timerStatus, user.uid, stationId]);

  // Removed auto-toggle focus mode requested by user

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSharedNotes(e.target.value);
    setIsEditingNotes(true);
  };

  const saveNotes = async () => {
    try {
      await safeUpdateRoom({ sharedNotes });
      setIsEditingNotes(false);
    } catch (e) {
      console.error("Failed to save notes", e);
    }
  };

  if (!room) return null;

  return (
    <div className="min-h-screen relative flex flex-col overflow-x-hidden" dir="rtl">
      <StarBackground />
      <div className="atmosphere-bg" />

      {/* Cosmic Loss Aversion Bet Modal */}
      <AnimatePresence>
        {showBetModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xl bg-[#0a0b16]/80 text-white">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0b0c16] border border-white/10 rounded-3xl p-8 max-w-lg w-full shadow-[0_0_80px_rgba(30,58,138,0.4)] text-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Rocket size={120} />
              </div>
              <h2 className="text-3xl font-black mb-2 text-sky-400">
                نظام الضياع الكوني 🌌
              </h2>
              <p className="text-gray-400 mb-6 font-medium text-sm leading-relaxed relative z-10">
                المبدأ النفسي: البشر يكرهون الخسارة أكثر بمرتين من حبهم للمكسب.
                <br />
                <br />
                ضع <span className="text-orange-400 font-bold">رهاناً</span> من
                نقاط הـ XP لبناء (درع السفينة). الخوف من خسارة الرتبة سيجبرك على
                البقاء مركزاً! إذا تشتت أو فتحت نافذة أخرى سيبدأ الدرع بالتضرر
                وتخسر نقاطك للأبد!
              </p>

              {betError && (
                <div className="bg-red-500/20 text-red-400 text-sm py-2 px-4 rounded-xl mb-6 font-bold">
                  {betError}
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 mb-8">
                {[50, 100, 200].map((amount) => (
                  <button
                    key={amount}
                    onClick={async () => {
                      if (user.xp < amount) {
                        setBetError(
                          "عذرًا، لا تملك نقاط خبرة كافية (XP) لهذا الرهان!",
                        );
                        return;
                      }

                      try {
                        requestXpGrant(user.uid, user.fleetId, null, false, -amount, "shield_bet_deduction", true);
                        currentBetRef.current = amount;
                        remainingShieldRef.current = amount;
                        setShieldPercent(100);
                        setShowBetModal(false);
                        safeUpdateRoom({
                          timerStatus: "focus",
                          startTime: serverTimestamp(),
                        });
                      } catch (e) {
                        setBetError("حدث خطأ أثناء وضع الرهان!");
                      }
                    }}
                    className="relative group overflow-hidden rounded-2xl bg-[#090915] border border-sky-500/30 hover:border-sky-400 transition-all p-4 flex flex-col items-center justify-center gap-2"
                  >
                    <div className="absolute inset-0 bg-sky-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <ShieldAlert className="w-8 h-8 text-sky-400 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-lg">{amount}</span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">
                      XP
                    </span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowBetModal(false)}
                className="text-gray-500 hover:text-white transition-colors text-sm font-bold"
              >
                إلغاء والعودة
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AFK Check Overlay */}
      <AnimatePresence>
        {showAFKCheck && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[130] bg-[#0a0b16]/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-white"
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-indigo-900/40 border-2 border-indigo-500 shadow-[0_0_80px_rgba(99,102,241,0.5)] rounded-3xl p-8 max-w-sm text-center w-full relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/20 to-transparent pointer-events-none" />
              <Eye className="w-20 h-20 mx-auto text-indigo-400 animate-pulse mb-6 relative z-10" />
              <h2 className="text-3xl font-black mb-4 text-white relative z-10">
                إثبات الانتباه! 👁️
              </h2>
              <p className="text-indigo-200 mb-6 text-sm relative z-10">
                هل لا زلت متواجداً وتركز معنا؟ يرجى تأكيد وجودك قبل انتهاء الوقت
                المتبقي لكي لا تخسر الجلسة التدريبية!
              </p>

              <div className="text-5xl font-black text-fuchsia-400 mb-8 font-mono animate-pulse relative z-10">
                {afkTimeLeft}ث
              </div>

              <div className="flex flex-col gap-3 w-full relative z-10">
                <button
                  onClick={() => {
                    setShowAFKCheck(false);
                    requestXpGrant(user.uid, user.fleetId, null, false, 5, "afk_check", true);
                    // Give them a small 5xp reward for being attentive
                  }}
                  className="w-full bg-gradient-to-r from-indigo-600 to-fuchsia-500 hover:from-indigo-500 hover:to-fuchsia-400 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 text-lg"
                >
                  أنا هنا وأركز! 🚀
                </button>
                <button
                  onClick={() => {
                    setShowAFKCheck(false);
                    setIsWatchingClass(true);
                  }}
                  className="w-full bg-white/5 hover:bg-white/10 text-indigo-300 font-bold py-3 px-8 rounded-xl transition-all border border-white/10 text-sm"
                >
                  أُشاهد حصة 📺 (إلغاء التحذيرات)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Red Alert Overlay */}
      <AnimatePresence>
        {showFuelLeak && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-red-900/40 backdrop-blur-md flex flex-col items-center justify-center p-4 text-white"
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#0a0b16] border-2 border-red-500 shadow-[0_0_80px_rgba(239,68,68,0.3)] rounded-3xl p-8 max-w-lg text-center"
            >
              <ShieldAlert className="w-20 h-20 mx-auto text-orange-500 animate-pulse mb-6" />
              <h2 className="text-4xl font-black mb-4 text-orange-500">
                الإنذار الأحمر! 🚨
              </h2>
              <p className="text-gray-300 mb-6 text-lg">
                رائد الفضاء، لقد تضرر الدرع بسبب تشتت الانتباه! عد للمسار فوراً!
              </p>

              <div className="bg-red-500/10 border border-red-500/50 rounded-2xl p-6 mb-8 flex flex-col gap-4">
                {currentBetRef.current > 0 && (
                  <div className="w-full bg-[#090915] rounded-full h-4 relative overflow-hidden border border-red-500/30">
                    <div
                      className="absolute inset-y-0 right-0 bg-red-500 transition-all"
                      style={{ width: `${shieldPercent}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                      صحة الدرع: {shieldPercent}%
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center px-4">
                  <span className="text-gray-400 font-bold">
                    الضرر المباشر (XP)
                  </span>
                  <span className="text-4xl font-black text-red-500 font-mono tracking-tighter">
                    -{leakedXP}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setShowFuelLeak(false)}
                  className="w-full py-4 rounded-xl font-bold text-lg bg-orange-600 hover:bg-orange-700 transition"
                >
                  تفعيل الدرع والعودة للتركيز
                </button>
                <button
                  onClick={() => {
                    setShowFuelLeak(false);
                    setIsWatchingClass(true);
                  }}
                  className="w-full bg-white/5 hover:bg-white/10 text-orange-200 font-bold py-3 px-8 rounded-xl transition-all border border-white/10 text-sm"
                >
                  أُشاهد حصة 📺 (إلغاء التحذيرات)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-red-900/60 backdrop-blur-xl bg-[#0a0b16]/80 flex flex-col items-center justify-center text-white overflow-hidden"
          >
            {/* Meteor Animation */}
            <motion.div
              initial={{ x: -500, y: -500, scale: 0.5, opacity: 0 }}
              animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeIn" }}
              className="relative"
            >
              <Flame className="w-32 h-32 text-orange-500 animate-pulse rotate-[135deg]" />
              <div className="absolute inset-0 blur-2xl bg-orange-600/50 rounded-full animate-ping" />
            </motion.div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: "spring" }}
              className="text-center mt-8"
            >
              <ShieldAlert className="w-24 h-24 mx-auto mb-4 text-red-500" />
              <h2 className="text-6xl font-black mb-2">اصطدام نيزك!</h2>
              <p className="text-2xl font-bold text-red-200">
                لقد خرجت عن المدار وفقدت قلباً!
              </p>
            </motion.div>

            {/* Screen Shake Effect */}
            <motion.div
              animate={{
                x: [0, -20, 20, -20, 20, 0],
                y: [0, 10, -10, 10, -10, 0],
              }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="fixed inset-0 pointer-events-none border-[20px] border-red-600/50"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Room Header - Upgraded to Floating Pill */}
      <nav className="z-20 mx-auto mt-6 max-w-[95%] lg:max-w-7xl flex items-center justify-between px-6 py-3 bg-space-dark/80 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl shadow-indigo-900/20 shadow-indigo-900/40">
        {/* Right Side: Station Info */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="p-2.5 bg-gradient-to-br from-indigo-400/20 to-indigo-500/20 rounded-full border border-indigo-400/30 text-indigo-500">
              <Rocket size={20} />
            </div>
            {isJoined && (
              <div
                className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#0a0b16] shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"
                title="متصل بالمدار"
              />
            )}
          </div>
          <div className="text-right">
            <h2 className="text-lg md:text-xl font-black text-white">
              {room.name}
            </h2>
            <p className="text-[10px] text-gray-500 font-bold tracking-wider">
              {room.participants.length}/{room.maxParticipants} رواد فضاء
            </p>
          </div>
        </div>

        {/* Left Side: Actions */}
        <div className="flex items-center gap-4 md:gap-6">


          {/* Utility Actions */}
          <div className="flex items-center gap-2 border-r border-white/10 pr-4 mr-2">
            {isHost && (
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="p-2 text-gray-500 hover:text-red-500 transition-colors hover:bg-red-500/10 rounded-xl"
                title="حذف المحطة"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button
              onClick={() => setIsFocusMode(!isFocusMode)}
              className={cn(
                "p-2 rounded-xl transition-all flex items-center gap-2 group",
                isFocusMode
                  ? "bg-indigo-500 text-white"
                  : "text-gray-500 hover:text-white hover:bg-white/5",
              )}
              title={
                isFocusMode ? "إيقاف وضع التركيز" : "تفعيل وضع التركيز العميق"
              }
            >
              <span className="text-xs font-bold hidden sm:block">
                {isFocusMode ? "خروج من التركيز" : "تركيز عميق"}
              </span>
              <Zap className={cn("w-5 h-5", isFocusMode && "animate-pulse")} />
            </button>

            <button
              onClick={() => {
                if (room.timerStatus === "focus") {
                  setShowExitDialog(true);
                } else {
                  handleConfirmExit();
                }
              }}
              disabled={isExiting}
              className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              title="خروج"
            >
              <span className="text-xs font-bold hidden sm:block">خروج</span>
              <LogOut className="w-5 h-5 rotate-180 group-hover:-translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </nav>

      {/* Challenge UI Panel */}
      {room?.isChallenge && challengeData && (
         <div className="z-20 px-8 pt-4 w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-4">
            <div className="flex-1 bg-[#131526]/80 backdrop-blur-md rounded-3xl p-6 border border-fuchsia-500/20 shadow-2xl flex items-center justify-between">
                <div>
                   <h3 className="font-bold text-fuchsia-400 flex items-center gap-2 text-sm mb-1">
                      <Swords size={16} /> تحدي خاص
                   </h3>
                   <p className="text-xs text-gray-400">الهدف: {challengeData.durationMinutes} دقيقة تركيز</p>
                </div>
                {challengeData.status === "completed" ? (
                   <div className="text-sm font-bold text-green-400">
                     انتهى التحدي 🏆 الفائز: {challengeData.winnerId === challengeData.challengerId ? challengeData.challengerName : (challengeData.winnerId === challengeData.challengedId ? challengeData.challengedName : 'تعادل')}
                   </div>
                ) : (
                   <div className="flex gap-8">
                      <div className="flex flex-col items-center">
                         <span className="text-[10px] text-gray-400 mb-1">{challengeData.challengerName}</span>
                         <span className="font-black text-xl text-white">{challengeData.progressPlayer1 || 0}</span>
                      </div>
                      <div className="flex flex-col items-center">
                         <span className="text-[10px] text-gray-400 mb-1">{challengeData.challengedName}</span>
                         <span className="font-black text-xl text-white">{challengeData.progressPlayer2 || 0}</span>
                      </div>
                   </div>
                )}
            </div>
         </div>
      )}

      {/* Active Alerts Banner */}
      <AnimatePresence>
        {activeAlerts.length > 0 && (
          <div className="z-20 px-8 py-2 max-w-5xl mx-auto space-y-2 w-full mt-2">
            {activeAlerts.map(alert => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "w-full backdrop-blur-xl border rounded-full px-6 py-3 flex items-center justify-between shadow-lg",
                  alert.type === 'distraction' 
                    ? "bg-red-500/20 border-red-500/40 text-red-200"
                    : "bg-indigo-500/20 border-indigo-500/40 text-indigo-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-full",
                    alert.type === 'distraction' ? "bg-red-500/20" : "bg-indigo-500/20"
                  )}>
                    {alert.type === 'distraction' ? <AlertTriangle size={18} className="text-red-400" /> : <Info size={18} className="text-indigo-400" />}
                  </div>
                  <span className="text-sm font-bold tracking-wide">
                    {alert.text}
                  </span>
                </div>
                <button
                  onClick={() => setActiveAlerts(prev => prev.filter(a => a.id !== alert.id))}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={16} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Task Bar / Info Badge */}
      <div className="z-10 px-8 py-2 max-w-5xl mx-auto -mt-2 space-y-2">
        <div className="w-full bg-space-dark/80 backdrop-blur-xl bg-[#0a0b16]/80 border border-white/5 rounded-full px-6 py-2 flex items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-3 text-cyan-400">
            <div className="p-1 bg-cyan-500/20 rounded-full">
              <CheckCircle size={16} />
            </div>
            <span className="text-xs font-bold tracking-wide">
              التركيز مستمر
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors cursor-pointer">
            <span className="text-[10px] font-medium uppercase tracking-widest hidden md:block">
              معلومات المحطة
            </span>
            <Info size={16} />
          </div>
        </div>

        <AnimatePresence>
          {room.timerStatus === "focus" && pendingMission && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full bg-orange-500/10 backdrop-blur-xl border border-orange-500/30 rounded-full px-6 py-3 flex items-center justify-center shadow-[0_4px_30px_rgba(249,115,22,0.2)]"
            >
              <div className="flex flex-col items-center gap-1 text-orange-400">
                <span className="text-[10px] uppercase tracking-widest font-bold opacity-80">
                  مهمتك المعلقة في المدار
                </span>
                <span className="text-sm font-black text-white">
                  {pendingMission}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <main className="flex-1 p-4 md:p-8 z-10 w-full max-w-5xl mx-auto pb-48">
        {/* Center Column: Sun Timer & Orbit */}
        <div
          className={cn(
            "flex flex-col items-center justify-center relative min-h-[500px] transition-all duration-1000 py-10 lg:py-20",
            isFocusMode
              ? "scale-[1.15] lg:scale-[1.4]"
              : "scale-100 lg:scale-[1.3]",
          )}
        >
          <div className="relative w-full max-w-[600px] aspect-square flex items-center justify-center">
            {/* Solar System Background Rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="absolute rounded-full border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.05)]"
                  style={{
                    width: `${380 + i * 90}px`,
                    height: `${380 + i * 90}px`,
                  }}
                />
              ))}
            </div>

            {/* Orbiting Planets (Users) */}
            {[...participantsData]
              .sort((a, b) => a.uid.localeCompare(b.uid))
              .slice(0, 5)
              .map((p, index) => {
                const baseRadius = 190; // Increased distance from center
                const orbitSpacing = 45;
                const radius = baseRadius + index * orbitSpacing;

                // Seeded derivation for visual variety
                const seed = p.uid
                  .split("")
                  .reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const duration = 60 + (seed % 40) + index * 25;
                const initialAngle = (seed * 137.5) % 360;

                return (
                  <div
                    key={p.uid}
                    className="absolute inset-0 pointer-events-none"
                  >
                    {/* Subtle Orbit Path Highlight */}
                    <div
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5 pointer-events-none"
                      style={{ width: radius * 2, height: radius * 2 }}
                    />

                    {/* The Orbiting Container */}
                    <motion.div
                      animate={{ rotate: [initialAngle, initialAngle + 360] }}
                      transition={{
                        duration,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="absolute inset-0"
                    >
                      {/* The Planet itself */}
                      <div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
                        style={{ transform: `translateY(-${radius}px)` }}
                      >
                        {/* Counter-rotate content */}
                        <motion.div
                          animate={{
                            rotate: [-initialAngle, -(initialAngle + 360)],
                          }}
                          transition={{
                            duration,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="flex flex-col items-center gap-1"
                        >
                          <div className="relative pointer-events-auto">
                            <button
                              onClick={() => onSelectUser(p.uid)}
                              className={cn(
                                "w-10 h-10 md:w-12 md:h-12 rounded-full border-2 p-0.5 overflow-hidden shadow-xl transition-all",
                                p.uid === user.uid
                                  ? "border-amber-400 shadow-amber-400/40"
                                  : "border-indigo-400 shadow-indigo-400/20",
                              )}
                            >
                              <img
                                src={
                                  p.photoURL ||
                                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.uid}`
                                }
                                alt={p.displayName}
                                className="w-full h-full rounded-full object-cover bg-slate-900"
                                referrerPolicy="no-referrer"
                              />
                            </button>
                          </div>
                          <span className="text-[6px] md:text-[8px] font-bold bg-[#0a0b16]/90 backdrop-blur-xl px-2 py-0.5 rounded-full border border-white/10 text-white whitespace-nowrap shadow-lg">
                            {p.displayName.split(" ")[0]}
                          </span>
                        </motion.div>
                      </div>
                    </motion.div>
                  </div>
                );
              })}

            {/* Sun Timer */}
            <div className="relative w-40 h-40 md:w-56 md:h-56 flex items-center justify-center z-10">
              {room.timerStatus === "focus" && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180%] h-[180%] bg-yellow-400/10 mix-blend-screen rounded-full animate-bio-pulse blur-[30px] pointer-events-none -z-10" />
              )}
              {/* Fuel Gauge Ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="48%"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="8"
                />
                <motion.circle
                  cx="50%"
                  cy="50%"
                  r="48%"
                  fill="none"
                  stroke={room.timerStatus === "focus" ? "#fde047" : "#2dd4bf"}
                  strokeWidth="8"
                  strokeDasharray="100 100"
                  animate={{
                    strokeDashoffset:
                      100 -
                      (timeLeft /
                        ((room.timerStatus === "focus"
                          ? room.timerDuration
                          : room.breakDuration) *
                          60)) *
                        100,
                  }}
                  transition={{ duration: 1, ease: "linear" }}
                  strokeLinecap="round"
                />
              </svg>

              {(() => {
                const isFocus = room.timerStatus === "focus";
                const progress =
                  isFocus && room.timerDuration
                    ? Math.min(
                        1,
                        Math.max(0, timeLeft / (room.timerDuration * 60)),
                      )
                    : 1;
                const invProgress = 1 - progress;

                return (
                  <motion.div
                    animate={
                      isFocus
                        ? {
                            scale: [1, 1 + (0.02 + invProgress * 0.05), 1],
                            opacity: [0.95, 1, 0.95],
                          }
                        : room.timerStatus === "break"
                          ? { scale: [1, 1.02, 1] }
                          : {}
                    }
                    transition={{
                      duration: isFocus ? Math.max(0.8, 4 * progress) : 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className={cn(
                      "w-[85%] h-[85%] rounded-full flex items-center justify-center transition-all duration-1000",
                      room.timerStatus === "break"
                        ? "bg-gradient-to-br from-indigo-400 via-fuchsia-400 to-emerald-600 shadow-[0_0_120px_rgba(45,212,191,0.5)] border-4 border-indigo-400/50"
                        : room.timerStatus === "idle"
                          ? "bg-[#090915] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                          : "",
                    )}
                    style={
                      isFocus
                        ? {
                            background: `radial-gradient(circle at center, rgb(253, 224, 71) 0%, rgb(${251 - invProgress * 50}, ${191 - invProgress * 120}, ${36 - invProgress * 36}) 100%)`,
                            boxShadow: `0 0 ${80 + invProgress * 60}px rgba(251, 146, 60, ${0.4 + invProgress * 0.4})`,
                            border: `4px solid rgba(253, 224, 71, ${0.6 - invProgress * 0.3})`,
                          }
                        : {}
                    }
                  >
                    <div className="flex flex-col items-center justify-center">
                      <span
                        className={cn(
                          "text-4xl md:text-6xl font-black tracking-tighter drop-shadow-sm flex items-center gap-2",
                          room.timerStatus === "idle"
                            ? "text-gray-600"
                            : "text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.4)]",
                        )}
                      >
                        {formatTime(timeLeft)}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] md:text-sm font-bold uppercase tracking-widest text-center",
                          room.timerStatus === "idle"
                            ? "text-white/10"
                            : "text-black/60",
                        )}
                      >
                        {room.timerStatus === "focus"
                          ? "مرحلة التركيز"
                          : room.timerStatus === "break"
                            ? "استراحة"
                            : "جاهز"}
                      </span>
                    </div>
                  </motion.div>
                );
              })()}
            </div>

            {/* Orbit Rings */}
            <div className="absolute w-[280px] h-[280px] md:w-[400px] md:h-[400px] border border-white/5 rounded-full" />
            <div className="absolute w-[320px] h-[320px] md:w-[450px] md:h-[450px] border border-white/10 rounded-full" />
          </div>

          {/* Timer Controls */}
          {isHost && (
            <div className="mt-12 flex flex-col items-center gap-6">
              {room.timerStatus === "idle" && (
                <div className="flex gap-4 mb-4">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-gray-500 font-bold">
                      وقت التركيز
                    </span>
                    <input
                      type="number"
                      value={room.timerDuration}
                      onChange={(e) =>
                        safeUpdateRoom({
                          timerDuration: parseInt(e.target.value) || 25,
                        })
                      }
                      className="w-16 p-2 rounded-xl bg-[#0a0b16] shadow-lg shadow-indigo-900/10 border border-white/10 text-center text-sm focus:border-orange-500 outline-none"
                    />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-gray-500 font-bold">
                      وقت الاستراحة
                    </span>
                    <input
                      type="number"
                      value={room.breakDuration}
                      onChange={(e) =>
                        safeUpdateRoom({
                          breakDuration: parseInt(e.target.value) || 5,
                        })
                      }
                      className="w-16 p-2 rounded-xl bg-[#0a0b16] shadow-lg shadow-indigo-900/10 border border-white/10 text-center text-sm focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4">
                {room.timerStatus === "idle" ? (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() =>
                        safeUpdateRoom({
                          timerStatus: "focus",
                          startTime: serverTimestamp(),
                        })
                      }
                      className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 transition-all shadow-xl font-bold text-xl flex items-center justify-center gap-3"
                    >
                      <Play size={24} fill="currentColor" />
                      بدء التركيز
                    </button>
                    <button
                      onClick={() => setShowBetModal(true)}
                      className="px-8 py-3 outline-none border border-transparent rounded-2xl bg-[#0a0b16] hover:bg-white/5 transition-all text-orange-500 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-black/20 group"
                    >
                      <Flame size={18} className="group-hover:animate-pulse" />
                      التركيز بنظام الرهان (الضياع الكوني)
                    </button>
                    <button
                      onClick={() => setShowStudyLinkModal(true)}
                      className="px-8 py-3 outline-none border border-white/10 rounded-2xl bg-[#0a0b16] hover:bg-white/5 transition-all text-indigo-400 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-black/20 group"
                    >
                      <Target size={18} />
                      {studyLinkRef.current &&
                      studyLinkRef.current.trim() !== ""
                        ? "تم ربط منصة خارجية"
                        : "الدراسة خارج المنصة؟ (أضف رابط)"}
                    </button>
                  </div>
                ) : (
                  <div className="px-8 py-4 rounded-2xl bg-[#0a0b16] shadow-lg shadow-indigo-900/10 border border-white/10 flex items-center gap-3 font-bold text-xl text-gray-500 cursor-not-allowed">
                    <Lock size={24} />
                    المحطة في المدار
                  </div>
                )}
              </div>

              {room.timerStatus !== "idle" && (
                <div className="flex gap-4">
                  <button
                    onClick={async () => {
                      await safeUpdateRoom({
                        timerStatus: "idle",
                        startTime: deleteField(),
                      });
                    }}
                    className="px-4 py-2 rounded-xl bg-[#0a0b16] border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-all text-xs font-bold flex items-center gap-2"
                  >
                    <Square size={14} fill="currentColor" />
                    إيقاف العداد
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tools */}
        <PersonalTasks />
      </main>

      {/* Delete Confirmation Dialog */}

      {/* Floating Station Chat (Available in break and idle) */}
      <AnimatePresence>
        {(room?.timerStatus === "break" || room?.timerStatus === "idle") && (
          <motion.div
            className="fixed bottom-6 right-6 z-50 flex flex-col items-end"
            initial={{ y: 50, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.9 }}
          >
            <AnimatePresence>
              {isChatDrawerOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0, y: 20 }}
                  animate={{ height: "500px", opacity: 1, y: 0 }}
                  exit={{ height: 0, opacity: 0, y: 20 }}
                  className="w-96 bg-gradient-to-br from-[#0c0c16]/95 to-[#050510]/95 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl shadow-indigo-900/40 mb-4 flex flex-col"
                >
                  <div className="p-4 border-b border-white/5 flex items-center justify-between bg-space-dark/80 shrink-0">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <MessageCircle
                          size={18}
                          className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                        />
                        <h3 className="font-bold text-right text-sm tracking-wide">
                          دردشة المحطة
                        </h3>
                      </div>
                      {isHost && (
                        <button
                          onClick={async () => {
                            await safeUpdateRoom({ isChatLocked: !room?.isChatLocked });
                          }}
                          className={cn(
                            "text-[10px] px-2 py-1 rounded-full font-bold transition-all",
                            room?.isChatLocked 
                              ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30" 
                              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                          )}
                        >
                          {room?.isChatLocked ? "دردشة مغلقة 🔒" : "دردشة مفتوحة 🔓"}
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => setIsChatDrawerOpen(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="flex-1 p-3 overflow-y-auto space-y-3 relative custom-scrollbar">
                    {typingNames.length > 0 && (
                      <div
                        className="sticky top-0 z-10 text-[10px] text-indigo-400 italic mb-2 animate-pulse text-right bg-[#0a0b16]/80 p-1.5 rounded-lg backdrop-blur-sm self-start inline-block"
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
                          "flex flex-col",
                          msg.userId === user.uid ? "items-end" : "items-start",
                        )}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          {(user.role === "admin" || msg.userId === user.uid) &&
                            (deletingMsgId === msg.id ? (
                              <div className="flex items-center gap-1.5 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/30">
                                <button
                                  onClick={async () => {
                                    try {
                                      await deleteDoc(
                                        doc(
                                          db,
                                          "rooms",
                                          stationId,
                                          "messages",
                                          msg.id,
                                        ),
                                      );
                                      setDeletingMsgId(null);
                                    } catch (e) {
                                      handleFirestoreError(
                                        e,
                                        OperationType.DELETE,
                                        `rooms/${stationId}/messages/${msg.id}`,
                                      );
                                    }
                                  }}
                                  className="text-[9px] text-red-500 hover:text-white font-bold"
                                >
                                  نعم
                                </button>
                                <button
                                  onClick={() => setDeletingMsgId(null)}
                                  className="text-[9px] text-gray-400"
                                >
                                  لا
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeletingMsgId(msg.id)}
                                className="text-red-500 hover:text-red-400 p-1"
                              >
                                <Trash2 size={10} />
                              </button>
                            ))}
                          <button
                            onClick={() =>
                              msg.userId !== "system" &&
                              onSelectUser(msg.userId)
                            }
                            className={cn(
                              "flex items-center gap-1.5",
                              msg.userId !== "system" &&
                                "hover:text-indigo-500 transition-colors",
                            )}
                          >
                            <span className="text-[9px] text-gray-400 font-medium">
                              {msg.userName}
                            </span>
                            {msg.userPhoto && (
                              <img
                                src={msg.userPhoto}
                                className="w-3.5 h-3.5 rounded-full"
                                referrerPolicy="no-referrer"
                              />
                            )}
                          </button>
                        </div>
                        <div
                          className={cn(
                            "px-4 py-2 rounded-2xl text-sm max-w-[85%] leading-relaxed",
                            msg.userId === user.uid
                              ? "bg-indigo-500 text-white rounded-tr-none"
                              : "bg-white/10 text-gray-200 rounded-tl-none",
                            msg.userId === "system" &&
                              "bg-red-500/20 text-red-400 border border-red-500/30 italic w-full max-w-full text-center",
                          )}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-3 bg-[#0a0b16]/80 border-t border-white/10 shrink-0">
                    <div className="relative">
                      {room?.isChatLocked && !isHost ? (
                        <div className="w-full bg-[#050510] border border-red-500/30 rounded-xl px-4 py-3 text-center text-sm text-red-400 font-bold bg-opacity-50">
                          الدردشة مغلقة من قبل المشرف 🔒
                        </div>
                      ) : (
                        <>
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => {
                              setNewMessage(e.target.value);
                              const now = Date.now();
                              if (now - lastTypingUpdate.current > 2500) {
                                lastTypingUpdate.current = now;
                                setDoc(
                                  doc(db, "rooms", stationId, "typing", user.uid),
                                  { name: user.displayName, time: now },
                                ).catch(() => {});
                              }
                            }}
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleSendMessage()
                            }
                            placeholder="اكتب رسالة..."
                            className="w-full bg-[#050510] shadow-inner border border-white/5 rounded-xl px-4 py-3 text-right text-sm focus:outline-none focus:border-indigo-500/50 text-white placeholder:text-gray-600"
                            dir="rtl"
                          />
                          <button
                            onClick={handleSendMessage}
                            className="absolute left-1.5 top-1.5 bottom-1.5 px-3 bg-indigo-500 rounded-lg hover:bg-indigo-600 transition-colors flex items-center justify-center"
                          >
                            <Send size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => setIsChatDrawerOpen(!isChatDrawerOpen)}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-xl",
                isChatDrawerOpen
                  ? "bg-indigo-600 text-white shadow-indigo-900/50"
                  : "bg-[#0a0b16] border border-white/10 text-cyan-400 hover:bg-white/5 shadow-black/50",
              )}
            >
              <MessageCircle
                size={20}
                className={cn(
                  !isChatDrawerOpen &&
                    "drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]",
                )}
              />
              {/* Unread dot or similar could go here */}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showDeleteDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 shadow-2xl shadow-indigo-900/20 backdrop-blur-lg bg-[#0a0b16]/60"
          >
            <div className="bg-[#0a0b16] border border-red-500/30 rounded-3xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto shadow-2xl shadow-indigo-900/20 shadow-red-500/20">
              <h2 className="text-xl font-black mb-4 text-center text-red-500">
                حذف المحطة
              </h2>
              <p className="text-gray-300 text-center text-sm mb-6">
                هل أنت متأكد من حذف هذه المحطة نهائياً؟ هذا الإجراء لا يمكن
                التراجع عنه.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteDialog(false)}
                  className="flex-1 px-4 py-2 bg-[#0a0b16] shadow-lg shadow-indigo-900/10 hover:bg-white/5 rounded-xl text-white font-bold transition-all text-sm"
                >
                  إلغاء
                </button>
                <button
                  onClick={async () => {
                    setShowDeleteDialog(false);
                    await deleteDoc(doc(db, "rooms", stationId));
                    performSafeExit({ skipFirebaseUpdate: true });
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl text-white font-bold transition-all shadow-sm shadow-red-600/30 text-sm"
                >
                  تأكيد الحذف
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit Confirmation Dialog */}
      <AnimatePresence>
        {showExitDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 shadow-2xl shadow-indigo-900/20 backdrop-blur-lg bg-[#0a0b16]/60"
          >
            <div className="bg-[#0a0b16] border border-red-500/30 rounded-3xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto shadow-2xl shadow-indigo-900/20 shadow-red-500/20">
              <h2 className="text-xl font-black mb-4 text-center text-white flex items-center justify-center gap-2">
                <Rocket size={24} />
                مغادرة المحطة
              </h2>
              <p className="text-gray-300 text-center text-sm mb-6 leading-relaxed">
                هل تريد حقاً المغادرة؟ التايمر الآن يعمل في وضع الدراسة. إذا غادرت الآن سيتم خصم 10 XP من رصيدك.
              </p>
              <div className="flex gap-4 flex-col sm:flex-row">
                <button
                  onClick={() => setShowExitDialog(false)}
                  className="flex-1 px-4 py-3 bg-indigo-500 hover:bg-indigo-700 rounded-xl text-white font-bold transition-all text-sm shadow-sm shadow-indigo-500/20"
                >
                  البقاء والمتابعة
                </button>
                <button
                  onClick={handleConfirmExit}
                  disabled={isExiting}
                  className="px-4 py-3 bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition-all text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExiting ? "جاري المغادرة..." : "مغادرة الآن"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next Mission Modal */}
      <AnimatePresence>
        {showNextMissionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/20 shadow-2xl shadow-indigo-900/20 backdrop-blur-lg bg-[#0a0b16]/60"
          >
            <div className="bg-[#0a0b16] border border-orange-500/30 rounded-3xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl shadow-orange-900/20 text-center">
              <h2 className="text-2xl font-black mb-4 text-orange-400">
                مهمتك القادمة 🚀
              </h2>
              <p className="text-gray-300 text-sm mb-6">
                تبقى دقيقة واحدة! حدد مهمتك المعلقة للجلسة القادمة لتبدأ بقوة.
              </p>

              <input
                type="text"
                maxLength={60}
                placeholder="اكتب جملة واحدة عن مهمتك..."
                value={nextMissionInput}
                onChange={(e) => setNextMissionInput(e.target.value)}
                autoFocus
                className="w-full bg-[#0a0b16] shadow-lg shadow-indigo-900/10 border border-white/10 rounded-2xl p-4 text-white placeholder-gray-500 mb-6 focus:outline-none focus:border-orange-500 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNextMissionSubmit();
                }}
              />

              <div className="flex gap-4">
                <button
                  onClick={handleNextMissionSubmit}
                  disabled={!nextMissionInput.trim()}
                  className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-bold transition-all text-sm shadow-sm shadow-orange-600/30"
                >
                  تعيين المهمة
                </button>
                <button
                  onClick={() => setShowNextMissionModal(false)}
                  className="px-6 py-3 bg-[#0a0b16] shadow-lg shadow-indigo-900/10 hover:bg-white/5 border border-white/5 rounded-xl text-white font-bold transition-all text-sm"
                >
                  تخطي
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showStudyLinkModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <div
              className="bg-[#0a0b16] border border-indigo-500/30 rounded-3xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl shadow-indigo-900/20 text-right"
              dir="rtl"
            >
              <h2 className="text-2xl font-black mb-4 text-indigo-400">
                الدراسة خارج المنصة 🌍
              </h2>
              <p className="text-gray-300 text-sm mb-2">
                لأن المتصفحات الحديثة تحمي خصوصيتك، لا يمكننا تتبع المنصات
                الأخرى التي تدرس عليها.
              </p>
              <p className="text-gray-400 text-xs mb-6">
                لكن إذا أضفت رابط المنصة هنا، سنقوم بتعطيل نظام الإنذار الصارم
                (تسرب الوقود) لكي تتمكن من الدراسة خارج علامة التبويب براحة.
              </p>

              <input
                type="url"
                dir="ltr"
                placeholder="https://example.com"
                value={studyLink}
                onChange={(e) => setStudyLink(e.target.value)}
                className="w-full bg-[#151624] border border-white/10 rounded-2xl p-4 text-white placeholder-gray-500 mb-6 focus:outline-none focus:border-indigo-500 transition-colors text-left"
              />

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    studyLinkRef.current = studyLink;
                    setShowStudyLinkModal(false);
                  }}
                  className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-bold transition-all text-sm shadow-sm shadow-indigo-600/30"
                >
                  حفظ الرابط
                </button>
                <button
                  onClick={() => {
                    setStudyLink("");
                    studyLinkRef.current = "";
                    setShowStudyLinkModal(false);
                  }}
                  className="px-6 py-3 bg-[#0a0b16] shadow-lg shadow-indigo-900/10 hover:bg-white/5 border border-white/5 rounded-xl text-white font-bold transition-all text-sm"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

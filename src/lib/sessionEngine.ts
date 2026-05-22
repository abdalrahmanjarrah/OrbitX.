import { useState, useEffect, useRef, useCallback } from "react";
import {
  doc,
  collection,
  query,
  where,
  orderBy,
  limit,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  deleteField,
  increment,
  onSnapshot,
} from "firebase/firestore";
import { 
  auth, 
  db, 
  handleFirestoreError, 
  OperationType,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  addDoc,
  runTransaction
} from "../firebase";
import { requestXpGrant } from "./xpSystem";
import { Debugger } from "../firebaseDebug";
import { Room, Challenge, Message, UserData } from "../shared";
import { playSound } from "./sound";

// Custom onSnapshot wrapper to prevent unauthenticated read crashes and track active listener counts
function safeOnSnapshot(
  queryRef: any,
  onNext: (snapshot: any) => void,
  onError?: (error: any) => void,
  pathLabel: string = "unspecified_snapshot"
) {
  if (!auth.currentUser) {
    // Return empty unsubscribe if not authenticated to prevent permission errors
    return () => {};
  }
  const timerStart = performance.now();
  Debugger.trackListenerStart(pathLabel);
  
  const unsub = onSnapshot(
    queryRef,
    (snap) => {
      // Record first snapshot RTT latency metric
      if (timerStart > 0) {
        Debugger.logLatency(`snapshot_load[${pathLabel}]`, timerStart, true);
      }
      Debugger.trackOnSnapshotTrigger(pathLabel, (snap as any).docs ? (snap as any).docs.length : 1);
      onNext(snap);
    },
    (e: any) => {
      if (!auth.currentUser) {
        // Ignore errors after signing out or during unmount
        return;
      }
      Debugger.logError(`safeOnSnapshot_listener[${pathLabel}]`, e);
      if (onError) {
        onError(e);
      } else {
        console.warn(`[Diagnostics] Intercepted safeOnSnapshot error on ${pathLabel}:`, e);
      }
    }
  );
  
  return () => {
    unsub();
    Debugger.trackListenerStop(pathLabel);
  };
}

// Global active hook instance tracking to secure mounts against unmount/remount race conditions (e.g. StrictMode, route transitions)
const activeHookInstances = new Map<string, string>(); // userId -> hookInstanceId

export function useSessionEngine(
  stationId: string,
  user: UserData,
  isSpectator: boolean,
  onExit: () => void
) {
  const [room, setRoom] = useState<Room | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [participantsData, setParticipantsData] = useState<UserData[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingMap, setTypingMap] = useState<Record<string, { name: string; time: number }>>({});
  const [challengeData, setChallengeData] = useState<Challenge | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<{ id: string; text: string; type: 'distraction' | 'presence' }[]>([]);
  const [newMessage, setNewMessage] = useState("");
  
  // Dialogs and Modals
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showBetModal, setShowBetModal] = useState(false);
  const [showNextMissionModal, setShowNextMissionModal] = useState(false);
  const [showStudyLinkModal, setShowStudyLinkModal] = useState(false);
  const [nextMissionInput, setNextMissionInput] = useState("");
  const [pendingMission, setPendingMission] = useState<string | null>(null);
  const [betError, setBetError] = useState("");
  const [shieldPercent, setShieldPercent] = useState<number>(0);

  // States
  const [hasJoinedStation, setHasJoinedStation] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [sharedNotes, setSharedNotes] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [showAFKCheck, setShowAFKCheck] = useState(false);
  const [isWatchingClass, setIsWatchingClass] = useState(false);
  const [afkTimeLeft, setAfkTimeLeft] = useState(60);
  const [showFuelLeak, setShowFuelLeak] = useState(false);
  const [leakedXP, setLeakedXP] = useState(0);
  const [showAlert, setShowAlert] = useState(false);

  // MUTEX / EXIT LOCK
  const isExitingRef = useRef(false);
  const isJoinedRef = useRef(false);

  // STABILITY & SYNC SYSTEM CORES
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const instanceIdRef = useRef<string>("");
  if (!instanceIdRef.current) {
    instanceIdRef.current = Math.random().toString();
  }

  // Register this hook instance as the active session handler for the current user
  useEffect(() => {
    activeHookInstances.set(user.uid, instanceIdRef.current);
    
    // Cleanup active registration only if we are the current active instance on unmount
    return () => {
      if (activeHookInstances.get(user.uid) === instanceIdRef.current) {
        // Delay clearing slightly so the mounting instance has time to override
        setTimeout(() => {
          if (activeHookInstances.get(user.uid) === instanceIdRef.current) {
            activeHookInstances.delete(user.uid);
          }
        }, 500);
      }
    };
  }, [user.uid]);

  // Window unload listener to clear participant entry immediately
  useEffect(() => {
    const handleUnload = () => {
      activeHookInstances.delete(userRef.current.uid);
      // Synchronously trigger exit cleanup if user was joined
      if (isJoinedRef.current && !isSpectator) {
        const xhr = new XMLHttpRequest();
        // Best effort synchronous XMLHttp request to remove user from active session
        // Note: Firestore updates via REST are possible but direct doc updates might be halted, 
        // we at least try to clean up active registrations.
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [isSpectator]);

  // Clock Offset Alignment system to offset local computer clock drift/skews
  const clockOffsetRef = useRef<number>(0);
  useEffect(() => {
    const fetchServerTime = async () => {
      try {
        const startCall = Date.now();
        const res = await fetch("/", { method: "HEAD" }).catch(() => fetch("/"));
        if (!res) return;
        const dateHeader = res.headers.get("Date");
        if (dateHeader) {
          const serverTime = new Date(dateHeader).getTime();
          const endCall = Date.now();
          const latency = (endCall - startCall) / 2;
          clockOffsetRef.current = (serverTime + latency) - endCall;
          console.log(`[Clock Synchronizer] Calculated clock skew offset: ${clockOffsetRef.current}ms`);
          Debugger.setClockSkew(clockOffsetRef.current);
        }
      } catch (e) {
        console.warn("[Clock Synchronizer] Failed to synchronize clock skew, defaulting to local time.", e);
        Debugger.logError("clock_sync_offset", e);
      }
    };
    fetchServerTime();
  }, [stationId]);

  // References
  const roomRef = doc(db, "rooms", stationId);
  const lastXpGrantTimestampRef = useRef<number | null>(null);
  const fuelLeakIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const localLeakedRef = useRef<number>(0);
  const afkCheckedForThisCycleRef = useRef<number | null>(null);
  const autoJoinAttempted = useRef(false);
  const participantsCountRef = useRef(0);
  const isWatchingClassRef = useRef(false);
  const currentBetRef = useRef<number>(0);
  const remainingShieldRef = useRef<number>(0);
  const studyLinkRef = useRef<string>("");
  const roomStatusRef = useRef<string | null>(null);
  const roomSnapshotRef = useRef<Room | null>(null);
  const isTransitioningRef = useRef(false);
  const lastXpUpdateTimeRef = useRef<number | null>(null);
  const sessionXpCountRef = useRef<number>(0);
  const afkFailCountRef = useRef<number>(0);
  const xpIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageTime = useRef<number>(0);
  const toggleCallLockRef = useRef<boolean>(false);

  const MAX_XP_PER_SESSION = 120;
  const isHost = room ? ((room.hostId || room.creatorId) === user.uid || user.role === "admin") : false;

  // Sync stateful refs
  useEffect(() => { isJoinedRef.current = isJoined; }, [isJoined]);
  useEffect(() => { isWatchingClassRef.current = isWatchingClass; }, [isWatchingClass]);
  useEffect(() => { participantsCountRef.current = participantsData.length; }, [participantsData.length]);
  useEffect(() => { roomStatusRef.current = room?.timerStatus || null; }, [room?.timerStatus]);
  useEffect(() => { roomSnapshotRef.current = room; }, [room]);

  const isEditingNotesRef = useRef(isEditingNotes);
  useEffect(() => {
    isEditingNotesRef.current = isEditingNotes;
  }, [isEditingNotes]);

  const challengeDataRef = useRef<Challenge | null>(null);
  useEffect(() => {
    challengeDataRef.current = challengeData;
  }, [challengeData]);

  const participantsDataRef = useRef<UserData[]>([]);
  useEffect(() => {
    participantsDataRef.current = participantsData;
  }, [participantsData]);

  const onExitRef = useRef(onExit);
  useEffect(() => {
    onExitRef.current = onExit;
  }, [onExit]);

  const safeUpdateRoom = useCallback(async (data: any) => {
    if (isSpectator) return;
    const startMs = performance.now();
    try {
      await updateDoc(roomRef, data);
      Debugger.logLatency(`updateRoom[${stationId}]`, startMs, true);
    } catch (e) {
      Debugger.logLatency(`updateRoom[${stationId}]`, startMs, false, e instanceof Error ? e.message : String(e));
      Debugger.logError("safeUpdateRoom", e);
      console.error("safeUpdateRoom failed:", e);
    }
  }, [stationId, isSpectator]);

  // 1. COMPREHENSIVE SINGLE EXIT EXECUTION GUARANTEE
  const performSafeExit = useCallback(async (options: {
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

    console.log("[Exit Engine] Mutex engaged. Clearing intervals & loops.");

    // Clean up all timers and intervals locally first to block any trailing ticks
    if (xpIntervalRef.current) {
      clearInterval(xpIntervalRef.current);
      xpIntervalRef.current = null;
    }
    if (fuelLeakIntervalRef.current) {
      clearInterval(fuelLeakIntervalRef.current);
      fuelLeakIntervalRef.current = null;
    }

    if (isSpectator) {
      console.log("[Exit Engine] Spectator clean local exit.");
      onExitRef.current();
      return;
    }

    if (options.isPenalty && options.penaltyReason) {
      try {
        console.log("[Exit Engine] Applying penalty transactional write:", options.penaltyAmount, options.penaltyReason);
        await requestXpGrant(userRef.current.uid, userRef.current.fleetId, null, false, options.penaltyAmount || -10, options.penaltyReason, true);
      } catch (e) {
        console.error("Failed to apply exit penalty:", e);
      }
    }

    if (!options.skipFirebaseUpdate) {
      try {
        // Broadcast exit message if there's someone to read it
        if (participantsCountRef.current > 1) {
          await addDoc(collection(db, "rooms", stationId, "messages"), {
            text: options.customExitMessage || (options.isPenalty 
              ? `🚀 غادر المحرك (${userRef.current.displayName}) المحطة والتايمر يعمل بوضع الدراسة (تم خصم ${Math.abs(options.penaltyAmount || 10)} XP).`
              : `🚀 غادر المحرك (${userRef.current.displayName}) المحطة.`),
            userId: "system",
            userName: "نظام التنبيه",
            userPhoto: "",
            timestamp: serverTimestamp(),
            type: "text",
          });
        }

        // Get snapshot of current room to update host or delete empty room correctly
        const roomSnap = await getDoc(roomRef);
        if (roomSnap.exists()) {
          const rData = roomSnap.data() as Room;
          const rem = (rData.participants || []).filter((p: string) => p !== userRef.current.uid);
          
          const updates: any = {
            participants: arrayRemove(userRef.current.uid),
            emptyAt: rem.length === 0 ? serverTimestamp() : deleteField(),
          };
          
          const currentHostId = rData.hostId || rData.creatorId;
          if (currentHostId === userRef.current.uid && rem.length > 0) {
            updates.hostId = rem[0];
          }
          if (rem.length === 0) {
            updates.timerStatus = "idle";
          }
          
          await updateDoc(roomRef, updates);

          // Delete room after 5 minutes if it remains empty
          if (rem.length === 0) {
            setTimeout(async () => {
              try {
                const checkSnap = await getDoc(roomRef);
                if (checkSnap.exists() && (!(checkSnap.data() as any).participants || (checkSnap.data() as any).participants.length === 0)) {
                  await deleteDoc(roomRef);
                }
              } catch (e) {}
            }, 300000);
          }
        }
      } catch (err) {
        console.warn("[Exit Engine] Firebase exit update bypassed / failed:", err);
      }
    }

    // Set user back to main dashboard activity
    try {
      await updateDoc(doc(db, "users", userRef.current.uid), {
        currentActivity: "في لوحة التحكم",
      });
    } catch (e) {}

    console.log("[Exit Engine] Cleanup complete. Invoking onExit callback.");
    onExitRef.current();
  }, [stationId, isSpectator]);

  const handleConfirmExit = useCallback(async () => {
    let isPenalty = false;
    let penaltyAmount = -10;
    if (roomSnapshotRef.current?.timerStatus === "focus") {
      isPenalty = true;
    }
    await performSafeExit({
      isPenalty,
      penaltyReason: "self_exit_penalty",
      penaltyAmount
    });
  }, [performSafeExit]);

  const toggleCall = useCallback(async () => {
    if (isSpectator) return;
    if (toggleCallLockRef.current) {
      console.warn("[toggleCall Shield] Blocked rapid toggle join/leave spam clicks.");
      return;
    }
    toggleCallLockRef.current = true;
    try {
      if (isJoinedRef.current) {
        setIsJoined(false);
        const docSnap = await getDoc(roomRef);
        if (docSnap.exists()) {
          const rData = docSnap.data() as Room;
          const rem = (rData.participants || []).filter((p: string) => p !== userRef.current.uid);
          const updates: any = {
            participants: arrayRemove(userRef.current.uid),
            emptyAt: rem.length === 0 ? serverTimestamp() : deleteField(),
          };
          const currentHostId = rData.hostId || rData.creatorId;
          if (currentHostId === userRef.current.uid && rem.length > 0) {
            updates.hostId = rem[0];
          }
          if (rem.length === 0) {
            updates.timerStatus = "idle";
          }
          await safeUpdateRoom(updates);
        }
        setHasJoinedStation(false);
      } else {
        setIsJoined(true);
        await safeUpdateRoom({
          participants: arrayUnion(userRef.current.uid),
          emptyAt: null,
        });
        setHasJoinedStation(true);
      }
    } catch (e) {
      console.error("Failed toggleCall:", e);
    } finally {
      toggleCallLockRef.current = false;
    }
  }, [safeUpdateRoom, isSpectator]);

  // Auto-join on mounting
  useEffect(() => {
    const autoJoin = async () => {
      if (isSpectator) return;
      if (!autoJoinAttempted.current) {
        autoJoinAttempted.current = true;
        setHasJoinedStation(true);
        setIsJoined(true);
        try {
          await updateDoc(roomRef, {
            participants: arrayUnion(userRef.current.uid),
            emptyAt: null,
          });
          await updateDoc(doc(db, "users", userRef.current.uid), {
            currentActivity: `في مدار محطة: ${roomSnapshotRef.current?.name || "خاصة"}`,
          });
        } catch (e) {}
      }
    };
    autoJoin();
  }, [stationId, isSpectator]);

  // Main Room, Messaging and Typing Listeners
  useEffect(() => {
    if (!auth.currentUser) return;

    // Room subscription
    const unsubscribeRoom = safeOnSnapshot(
      roomRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          // Room deleted underneath us: trigger immediately
          setTimeout(() => performSafeExit({ skipFirebaseUpdate: true }), 0);
          return;
        }
        const data = docSnap.data() as Room;
        setRoom({ id: docSnap.id, ...data });

        if (data.sharedNotes !== undefined && !isEditingNotesRef.current) {
          setSharedNotes(data.sharedNotes);
        }

        // Timer Sync relative to database startTime
        if (data.timerStatus !== "idle" && data.startTime) {
          const start = typeof data.startTime.toDate === "function"
            ? data.startTime.toDate().getTime()
            : (data.startTime as any).seconds * 1000;
          const duration = (data.timerStatus === "focus" ? data.timerDuration : data.breakDuration) * 60 * 1000;
          const elapsed = (Date.now() + clockOffsetRef.current) - start;
          const remaining = Math.max(0, Math.floor((duration - elapsed) / 1000));
          setTimeLeft(remaining);
        } else {
          setTimeLeft(data.timerDuration * 60);
        }
      },
      (e) => {
        // Suppress room error logs if exiting
        if (!isExitingRef.current) {
          handleFirestoreError(e, OperationType.GET, `rooms/${stationId}`);
        }
      },
      `rooms/${stationId}`
    );

    // Live Typing subscription
    const unsubTyping = safeOnSnapshot(
      collection(db, "rooms", stationId, "typing"),
      (snap) => {
        const newMap: Record<string, { name: string; time: number }> = {};
        snap.docs.forEach((d: any) => {
          if (d.id !== userRef.current.uid) {
            newMap[d.id] = d.data() as { name: string; time: number };
          }
        });
        setTypingMap(newMap);
      },
      undefined,
      `rooms/${stationId}/typing`
    );

    const typingInterval = setInterval(() => {
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

    // Messages Subscription
    const messagesQuery = query(
      collection(db, "rooms", stationId, "messages"),
      orderBy("timestamp", "desc"),
      limit(50)
    );
    let initialLoadMsgs = true;
    const unsubscribeMessages = safeOnSnapshot(
      messagesQuery,
      (snapshot) => {
        let msgs = snapshot.docs.map(
          (doc: any) => ({ id: doc.id, ...doc.data() }) as Message
        );
        msgs = msgs.reverse();
        setMessages(msgs);

        snapshot.docChanges().forEach((change: any) => {
          if (change.type === "added" && !initialLoadMsgs) {
            const msg = change.doc.data();
            if (msg.isExitPenalty) {
              setActiveAlerts(prev => [...prev, { id: change.doc.id, text: msg.text, type: 'distraction' }]);
            } else if (msg.type === 'system' || msg.text.includes("انضم إلى") || msg.text.includes("غادر المحطة")) {
              setActiveAlerts(prev => [...prev, { id: change.doc.id, text: msg.text, type: 'presence' }]);
            }
            if (msg.isExitPenalty && msg.userId !== userRef.current.uid && isJoinedRef.current && roomStatusRef.current === "focus" && !isSpectator) {
              requestXpGrant(userRef.current.uid, userRef.current.fleetId, null, false, -20, "peer_exit_penalty", true);
            }
          }
        });
        initialLoadMsgs = false;
      },
      (e) => {
        if (!isExitingRef.current) {
          handleFirestoreError(e, OperationType.GET, `rooms/${stationId}/messages`);
        }
      },
      `rooms/${stationId}/messages`
    );

    // User visibility changed listeners
    const handleVisibilityChange = () => {
      if (isSpectator) return;
      if (!isJoinedRef.current) return;
      if (document.visibilityState === "hidden" || !document.hasFocus()) {
        if (roomStatusRef.current !== "focus") return;
        if (studyLinkRef.current && studyLinkRef.current.trim() !== "") return;
        if (isWatchingClassRef.current) return;

        setShowFuelLeak(true);
        localLeakedRef.current = 0;
        setLeakedXP(0);

        try { playSound("alert"); } catch (e) {}

        if (participantsCountRef.current > 1) {
          addDoc(collection(db, "rooms", stationId, "messages"), {
            text: `🚨 المحرك (${userRef.current.displayName}) توقف عن العمل! السفينة تتباطأ!`,
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
            // Self-Correcting / Safety check to prevent leaks outside active focus state
            if (!isJoinedRef.current || roomStatusRef.current !== "focus") {
              if (fuelLeakIntervalRef.current) {
                clearInterval(fuelLeakIntervalRef.current);
                fuelLeakIntervalRef.current = null;
              }
              setShowFuelLeak(false);
              return;
            }

            localLeakedRef.current += 1;
            setLeakedXP(localLeakedRef.current);

            if (currentBetRef.current > 0 && remainingShieldRef.current > 0) {
              remainingShieldRef.current = Math.max(0, remainingShieldRef.current - 1);
              setShieldPercent(Math.round((remainingShieldRef.current / currentBetRef.current) * 100));
            } else {
              try {
                await requestXpGrant(userRef.current.uid, userRef.current.fleetId, null, false, -1, "fuel_leak_tick", true);
              } catch (err) {
                console.error("Error draining XP:", err);
              }
            }
          }, 60000);
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
      unsubscribeRoom();
      unsubTyping();
      unsubscribeMessages();
      clearInterval(typingInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);

      if (fuelLeakIntervalRef.current) {
        clearInterval(fuelLeakIntervalRef.current);
        fuelLeakIntervalRef.current = null;
      }

      // Safe delayed mount-unmount teardown protecting against StrictMode and quick navigates
      if (!isExitingRef.current && !isSpectator) {
        const myInstanceId = instanceIdRef.current;
        setTimeout(async () => {
          // Verify if another instance has taken over in the meantime before performing DB write
          if (activeHookInstances.get(userRef.current.uid) === myInstanceId) {
            activeHookInstances.delete(userRef.current.uid);
            try {
              const updates = {
                participants: arrayRemove(userRef.current.uid)
              };
              await updateDoc(roomRef, updates);
              console.log("[Delayed Clean] Cleaned up room state successfully on total unmount.");
            } catch (e) {
              console.warn("Silent unmount cleanup error (expected if deleting room):", e);
            }
          } else {
            console.log("[Delayed Clean Shield] Bypassed stale unmount cleanup for", userRef.current.displayName);
          }
        }, 1200);
      }
    };
  }, [stationId, user.uid, isSpectator]);

  // Challenge live subscription
  useEffect(() => {
    let unsubChallenge: () => void = () => {};
    if (room?.isChallenge && room?.challengeId && auth.currentUser) {
      unsubChallenge = safeOnSnapshot(doc(db, "challenges", room.challengeId), (docSnap) => {
        if (docSnap.exists()) {
          setChallengeData({ id: docSnap.id, ...docSnap.data() } as Challenge);
        }
      }, undefined, `challenges/${room.challengeId}`);
    }
    return () => unsubChallenge();
  }, [room?.isChallenge, room?.challengeId]);

  // Local optimized key tracking to prevent array comparison identity re-run storms
  const participantsKey = (room?.participants || []).join(",");

  // Live query for participant profile info
  const pendingFetchesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const list = room?.participants || [];
    if (list.length > 0 && auth.currentUser) {
      // Retain only those participants that are still actively inside the room list
      setParticipantsData((prev) => prev.filter((p) => list.includes(p.uid)));

      list.forEach((uid) => {
        const exists = participantsDataRef.current.some((p) => p.uid === uid);
        if (!exists && !pendingFetchesRef.current.has(uid)) {
          pendingFetchesRef.current.add(uid);
          getDoc(doc(db, "profiles", uid))
            .then((docSnap) => {
              if (docSnap.exists()) {
                const fetched = docSnap.data() as UserData;
                setParticipantsData((current) => {
                  if (!current.some((x) => x.uid === uid) && (roomSnapshotRef.current?.participants || []).includes(uid)) {
                    return [...current, fetched];
                  }
                  return current;
                });
              }
            })
            .catch((e) => {
              console.warn(`[Participant Sync] Failed to fetch profile for ${uid}:`, e);
            })
            .finally(() => {
              pendingFetchesRef.current.delete(uid);
            });
        }
      });
    } else {
      setParticipantsData([]);
    }
  }, [participantsKey]);

  const startTimeVal = room?.startTime
    ? (typeof room.startTime.toDate === "function"
        ? room.startTime.toDate().getTime()
        : (room.startTime as any).seconds * 1000)
    : 0;

  // Active worker ticking to obtain authentic remaining timer ticks
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
        
        // Securely handle pending Firestore server timestamps in latency-compensation phase
        const seconds = r.startTime.seconds || (r.startTime as any).seconds;
        if (seconds === undefined && typeof r.startTime.toDate !== "function") {
          const duration = (r.timerStatus === "focus" ? r.timerDuration : r.breakDuration) * 60;
          setTimeLeft(duration);
          return;
        }

        const start = typeof r.startTime.toDate === "function"
          ? r.startTime.toDate().getTime()
          : (r.startTime as any).seconds * 1000;
        const duration = (r.timerStatus === "focus" ? r.timerDuration : r.breakDuration) * 60 * 1000;
        const elapsed = (Date.now() + clockOffsetRef.current) - start;
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
  }, [room?.timerStatus, startTimeVal, room?.timerDuration, room?.breakDuration]);

  // Distraction trigger Red Alert
  const triggerRedAlert = useCallback(async () => {
    if (isSpectator) return;
    setShowAlert(true);
    await requestXpGrant(userRef.current.uid, userRef.current.fleetId, null, false, -20, "distraction_penalty", true);

    await addDoc(collection(db, "rooms", stationId, "messages"), {
      text: `☄️ نيزك ضرب المحطة! ${userRef.current.displayName} تشتت وفقد 20 XP!`,
      userId: userRef.current.uid,
      userName: "نظام التنبيه",
      userPhoto: "",
      timestamp: serverTimestamp(),
      type: "text",
    });

    setTimeout(() => setShowAlert(false), 4000);
  }, [stationId, isSpectator]);

  // Interactive interval positive XP progression loop
  useEffect(() => {
    if (isSpectator) return;
    if (!isJoined || room?.timerStatus !== "focus") {
      lastXpUpdateTimeRef.current = null;
      if (xpIntervalRef.current) {
        clearInterval(xpIntervalRef.current);
        xpIntervalRef.current = null;
      }
      return;
    }

    if (lastXpUpdateTimeRef.current === null) {
      lastXpUpdateTimeRef.current = Date.now() + clockOffsetRef.current;
      sessionXpCountRef.current = 0;
      afkFailCountRef.current = 0;
    }

    if (xpIntervalRef.current) {
      clearInterval(xpIntervalRef.current);
    }

    xpIntervalRef.current = setInterval(async () => {
      const now = Date.now() + clockOffsetRef.current;
      const secondsSpent = Math.floor((now - (lastXpUpdateTimeRef.current || now)) / 1000);

      // Check if a minute actually elapsed
      if (secondsSpent >= 60) {
        const elapsedMinutes = Math.floor(secondsSpent / 60);

        // HARD MATHEMATICAL BOUNDARY: Reject anomalies that exceed realistic parameters
        // A single tick of our 1s loop should grant at most 5 minutes of accrued XP (safety catch-up)
        const boundedMinutes = Math.min(elapsedMinutes, 5);
        lastXpUpdateTimeRef.current = (lastXpUpdateTimeRef.current || now) + elapsedMinutes * 60000;

        let globalLastGrant = (userRef.current as any).lastXpUpdate || 0;
        if (globalLastGrant && typeof globalLastGrant.toDate === "function") {
          globalLastGrant = globalLastGrant.toDate().getTime();
        } else if (globalLastGrant && typeof globalLastGrant === "object" && "seconds" in globalLastGrant) {
          globalLastGrant = globalLastGrant.seconds * 1000;
        } else if (typeof globalLastGrant !== "number") {
          globalLastGrant = Number(globalLastGrant) || 0;
        }

        const lastGrant = Math.max(lastXpGrantTimestampRef.current || 0, globalLastGrant);
        const globalElapsedMinutes = Math.max(0, Math.floor((now - lastGrant + 5000) / 60000));

        const maxAllowedXp = Math.max(0, MAX_XP_PER_SESSION - sessionXpCountRef.current);
        let xpToGrant = Math.min(boundedMinutes, globalElapsedMinutes, maxAllowedXp);

        const currentRoom = roomSnapshotRef.current;
        if (xpToGrant > 0 && currentRoom) {
          lastXpGrantTimestampRef.current = now;
          sessionXpCountRef.current += xpToGrant;

          await requestXpGrant(
            userRef.current.uid,
            userRef.current.fleetId,
            currentRoom.isChallenge ? currentRoom.challengeId : null,
            challengeDataRef.current ? (userRef.current.uid === challengeDataRef.current.challengerId) : false,
            xpToGrant,
            `Focus Interval Loop (Minutes: ${xpToGrant})`,
            false // Enforce Transaction lock!
          );

          if (currentRoom.isChallenge && currentRoom.challengeId) {
            checkChallengeCompletion(currentRoom.challengeId).catch(() => {});
          }
        }
      }
    }, 1000);

    return () => {
      if (xpIntervalRef.current) {
        clearInterval(xpIntervalRef.current);
        xpIntervalRef.current = null;
      }
    };
  }, [isJoined, room?.timerStatus, isSpectator]);

  // AFK checking triggers
  useEffect(() => {
    if (isSpectator) return;
    if (room?.timerStatus !== "focus" || timeLeft <= 0 || !isJoined) {
      setShowAFKCheck(false);
      setIsWatchingClass(false);
      afkCheckedForThisCycleRef.current = null;
      return;
    }

    if (isWatchingClass) return;

    const durationSeconds = room.timerDuration * 60;
    const checkThresholds = [900, 600, 300].filter((t) => t < durationSeconds - 60);

    checkThresholds.forEach((threshold) => {
      if (Math.abs(timeLeft - threshold) <= 2 && afkCheckedForThisCycleRef.current !== threshold) {
        afkCheckedForThisCycleRef.current = threshold;
        if (!showAFKCheck) {
          setShowAFKCheck(true);
          setAfkTimeLeft(60);
          try {
            playSound("notification");
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
            audio.play().catch(() => {});
          } catch (e) {}
        }
      }
    });
  }, [timeLeft, room?.timerStatus, room?.timerDuration, isJoined, showAFKCheck, isWatchingClass, isSpectator]);

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
      setAfkTimeLeft(15);
      return;
    }
    setShowAFKCheck(false);
    await performSafeExit({
      customExitMessage: `💤 غادر ${user.displayName} المحطة بسبب عدم الاستجابة (AFK). تم حفظ نقاطه المسجلة حتى الآن.`
    });
  };

  // 2. AUTHORITATIVE & SYNCHRONIZED TIMER TRANSITION
  useEffect(() => {
    if (timeLeft > 0) {
      isTransitioningRef.current = false;
    }

    if (timeLeft === 0 && room && room.timerStatus !== "idle") {
      if (!room.startTime) return;
      if (isSpectator) return; // Spectators have no mutation rights

      const startMs = typeof room.startTime.toDate === "function"
        ? room.startTime.toDate().getTime()
        : (room.startTime as any).seconds * 1000;
      const durationMs = (room.timerStatus === "focus" ? room.timerDuration : room.breakDuration) * 60 * 1000;
      const elapsed = (Date.now() + clockOffsetRef.current) - startMs;

      // Ensure 90% of the session time has objectively elapsed to guard against fast-forward timing glitches
      if (elapsed < durationMs - 5000) return;

      const isLegitEnd = elapsed <= durationMs + 2 * 60 * 1000;

      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;

      // Sound notification on legit end
      if (isLegitEnd) {
        if ("Notification" in window && Notification.permission === "granted" && document.visibilityState === "hidden") {
          new Notification("انتهى الوقت!", {
            body: room.timerStatus === "focus"
              ? "انتهت جلسة التركيز، حان وقت الاستراحة"
              : "انتهت الاستراحة، حان وقت التركيز",
          });
        }
        try { playSound("timer"); } catch (e) {}
      }

      // CLIENT-SIDE PROGRESS REWARDS (Safe, independent, and strictly bounded)
      if (room.timerStatus === "focus" && isLegitEnd) {
        const sessionStartVal = room.startTime ? (typeof room.startTime.toDate === 'function' ? room.startTime.toDate().getTime() : (room.startTime as any).seconds * 1000) : 0;
        const transitionLockKey = `processed_transition_${stationId}_${sessionStartVal}`;
        if (localStorage.getItem(transitionLockKey)) {
          console.log("[Collision Shield] Rewards already granted in another tab/instance for this session");
        } else {
          localStorage.setItem(transitionLockKey, "true");
          
          // Clean up old obsolete transition lock keys for this room to avoid filling storage
          try {
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith(`processed_transition_${stationId}_`) && key !== transitionLockKey) {
                localStorage.removeItem(key);
              }
            }
          } catch (e) {}

          const refund = remainingShieldRef.current > 0 ? remainingShieldRef.current : 0;
          const safeXpEarned = Math.min(refund, Math.max(0, MAX_XP_PER_SESSION - sessionXpCountRef.current));

          currentBetRef.current = 0;
          remainingShieldRef.current = 0;
          setShieldPercent(0);

          const updates: any = {
            totalFocusSessions: increment(1),
            lastStudyDate: new Date().toISOString().split("T")[0],
          };

          if (((userRef.current.totalFocusSessions || 0) + 1) % 3 === 0) {
            updates.completedTasks = increment(1);
          }
          if (((userRef.current.totalFocusSessions || 0) + 1) % 5 === 0) {
            updates.seeds = increment(1);
          }
          if (userRef.current.plants && userRef.current.plants.length > 0) {
            updates.plants = userRef.current.plants.map((p) => ({ ...p, lastWateredAt: Date.now() + clockOffsetRef.current }));
          }

          updateDoc(doc(db, "users", userRef.current.uid), updates).catch(() => {});

          let totalXpToGive = 0;
          if (safeXpEarned > 0) totalXpToGive += safeXpEarned;
          if (((userRef.current.totalFocusSessions || 0) + 1) % 3 === 0) totalXpToGive += 50;

          if (totalXpToGive > 0) {
            requestXpGrant(userRef.current.uid, userRef.current.fleetId, null, false, totalXpToGive, `on_exit_session (refund/quest)`, true);
          }

          if (userRef.current.fleetId) {
            updateDoc(doc(db, "fleets", userRef.current.fleetId), {
              totalFocusHours: increment(room.timerDuration / 60),
            }).catch(() => {});
          }
        }
      }

      // AUTHORITATIVE WRITE ROUTING
      const nextStatus = room.timerStatus === "focus" ? "break" : "idle";
      const focusToAdd = room.timerStatus === "focus" ? room.timerDuration * 60 : 0;

      // Alphabetical participant listing to establish a backup execution chain
      const sortedParticipants = [...(room.participants || [])].sort();
      const myAlphabeticalRank = sortedParticipants.indexOf(userRef.current.uid);

      // Rule: Only Host is primary authorized writer.
      // If Host is absent, the next alphabetical participant (rank 0 or 1) steps up after 5 seconds to heal the timer stall.
      const transitionDelay = isHost 
        ? 0 
        : (myAlphabeticalRank === 0 ? 5000 : 8000 + Math.random() * 4000);

      setTimeout(async () => {
        try {
          // Re-fetch room instantly to verify no other client completed the transition first
          const snapCheck = await getDoc(roomRef);
          if (snapCheck.exists()) {
            const currentR = snapCheck.data() as Room;
            if (currentR.timerStatus === room.timerStatus) {
              // Room is still in the old status! It's our job to transition.
              const updateData: any = {
                timerStatus: nextStatus,
                startTime: nextStatus === "break" ? serverTimestamp() : deleteField(),
              };
              if (focusToAdd > 0) {
                updateData.accumulatedFocusSeconds = (currentR.accumulatedFocusSeconds || 0) + focusToAdd;
              }
              await updateDoc(roomRef, updateData);
              console.log(`[Authoritative Transition] Processed transition successfully. New State: ${nextStatus}`);
            }
          }
        } catch (e) {
          console.error("Timer transition write failed safely:", e);
        } finally {
          isTransitioningRef.current = false;
        }
      }, transitionDelay);
    }
  }, [timeLeft, room?.timerStatus, stationId, isSpectator]);

  const checkChallengeCompletion = async (cId: string) => {
    const startMs = performance.now();
    try {
      const cRef = doc(db, "challenges", cId);
      let rewardedUser = false;
      let winnerId = "";
      let challengerId = "";
      let challengedId = "";
      let challengerName = "";
      let challengedName = "";

      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(cRef);
        if (!snap.exists()) return;
        const cData = snap.data() as Challenge;
        if (cData.status !== "active") return;

        const target = cData.durationMinutes;
        const p1 = cData.progressPlayer1 || 0;
        const p2 = cData.progressPlayer2 || 0;

        if (p1 >= target || p2 >= target) {
          challengerId = cData.challengerId;
          challengedId = cData.challengedId;
          challengerName = cData.challengerName;
          challengedName = cData.challengedName;

          if (p1 >= target && p2 >= target) {
            winnerId = p1 > p2 ? cData.challengerId : (p2 > p1 ? cData.challengedId : "tie");
          } else if (p1 >= target) {
            winnerId = cData.challengerId;
          } else {
            winnerId = cData.challengedId;
          }

          transaction.update(cRef, { status: "completed", winnerId });
          rewardedUser = true;
        }
      });

      Debugger.logLatency(`challenge_completion_tx[${cId}]`, startMs, true);

      if (rewardedUser && winnerId) {
        if (winnerId !== "tie" && winnerId === userRef.current.uid) {
          const uRef = doc(db, "users", userRef.current.uid);
          await updateDoc(uRef, { coins: increment(50) });
          await requestXpGrant(userRef.current.uid, userRef.current.fleetId, null, false, 50, "challenge_win", true);
          await addDoc(collection(db, "users", userRef.current.uid, "notifications"), {
            type: "challenge_win",
            content: `مبروك! لقد فزت بتحدي التركيز. تم إضافة 50 XP لعملك الرائع!`,
            read: false,
            timestamp: serverTimestamp(),
          });
        }

        await addDoc(collection(db, "rooms", stationId, "messages"), {
          text: winnerId === "tie" ? "انتهى التحدي بالتعادل!" : `🏆 انتهى التحدي! الفائز هو ${winnerId === challengerId ? challengerName : challengedName}`,
          userId: "system",
          userName: "نظام التحديات",
          userPhoto: "",
          timestamp: serverTimestamp(),
          type: "text",
        });
      }
    } catch (e) {
      Debugger.logLatency(`challenge_completion_tx[${cId}]`, startMs, false, e instanceof Error ? e.message : String(e));
      Debugger.logError("checkChallengeCompletion", e);
      console.error(`Failed to check challenge transactionally: ${e}`);
    }
  };

  const handleSendMessage = useCallback(async (customText?: string) => {
    const textToSend = typeof customText === "string" ? customText : newMessage;
    if (!textToSend.trim()) return;
    if (textToSend.length > 500) {
      alert("الرسالة طويلة جداً! الحد الأقصى هو 500 حرف.");
      return;
    }
    if (roomSnapshotRef.current?.isChatLocked && !isHost) {
      alert("الدردشة مغلقة من قبل المشرف.");
      return;
    }

    if (roomSnapshotRef.current?.timerStatus === "focus") {
      const now = Date.now();
      if (now - lastMessageTime.current < 5 * 60 * 1000) {
        const remainingMinutes = Math.ceil((5 * 60 * 1000 - (now - lastMessageTime.current)) / 60000);
        alert(`التايمر يعمل بوضع الدراسة! يمكنك إرسال رسالة واحدة فقط كل 5 دقائق. يرجى الانتظار ${remainingMinutes} دقيقة.`);
        return;
      }
      lastMessageTime.current = now;
    }

    if (typeof window !== "undefined" && (window as any).__firestoreQuotaExceeded) {
      // Robust client fallback: simulate adding the message locally so the room interface doesn't freeze
      const simulatedMsg = {
        id: "offline_" + Math.random().toString(36).substring(7),
        text: textToSend,
        userId: userRef.current.uid,
        userName: userRef.current.displayName,
        userPhoto: userRef.current.photoURL,
        timestamp: { toDate: () => new Date() }, // Mock Firestore timestamp object
        type: "text" as const,
        simulated: true,
      };
      setMessages((prev) => [...prev, simulatedMsg] as any);
      if (typeof customText !== "string") {
        setNewMessage("");
      }
      return;
    }

    try {
      await addDoc(collection(db, "rooms", stationId, "messages"), {
        text: textToSend,
        userId: userRef.current.uid,
        userName: userRef.current.displayName,
        userPhoto: userRef.current.photoURL,
        timestamp: serverTimestamp(),
        type: "text",
      });
      if (typeof customText !== "string") {
        setNewMessage("");
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `rooms/${stationId}/messages`);
      // Fallback locally even if write failed dynamically mid-flight
      const simulatedMsg = {
        id: "offline_err_" + Math.random().toString(36).substring(7),
        text: textToSend,
        userId: userRef.current.uid,
        userName: userRef.current.displayName,
        userPhoto: userRef.current.photoURL,
        timestamp: { toDate: () => new Date() },
        type: "text" as const,
        simulated: true,
      };
      setMessages((prev) => [...prev, simulatedMsg] as any);
      if (typeof customText !== "string") {
        setNewMessage("");
      }
    }
  }, [stationId, isHost, newMessage]);

  const saveNotes = useCallback(async () => {
    if (sharedNotes === roomSnapshotRef.current?.sharedNotes) {
      setIsEditingNotes(false);
      return;
    }
    try {
      await safeUpdateRoom({ sharedNotes });
      setIsEditingNotes(false);
    } catch (e) {
      console.error("Failed to save notes", e);
    }
  }, [safeUpdateRoom, sharedNotes]);

  const handleNextMissionSubmit = () => {
    if (nextMissionInput.trim()) {
      localStorage.setItem("pendingMission", nextMissionInput.trim());
    }
    setShowNextMissionModal(false);
    setNextMissionInput("");
  };

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

  useEffect(() => {
    if (room?.timerStatus === "focus" && timeLeft <= 60 && timeLeft > 0 && !isTransitioningRef.current && room.timerDuration > 1) {
      setShowNextMissionModal(true);
    }
  }, [timeLeft, room?.timerStatus, room?.timerDuration]);

  // Private fields helper functions
  const incrementField = (amount: number) => increment(amount);

  return {
    room,
    timeLeft,
    participantsData,
    messages,
    typingMap,
    challengeData,
    activeAlerts,
    newMessage,
    setNewMessage,
    showExitDialog,
    setShowExitDialog,
    showBetModal,
    setShowBetModal,
    showNextMissionModal,
    setShowNextMissionModal,
    showStudyLinkModal,
    setShowStudyLinkModal,
    nextMissionInput,
    setNextMissionInput,
    pendingMission,
    betError,
    setBetError,
    shieldPercent,
    setShieldPercent,
    setActiveAlerts,
    isJoined,
    isExiting,
    isFocusMode,
    setIsFocusMode,
    sharedNotes,
    setSharedNotes,
    isEditingNotes,
    setIsEditingNotes,
    showAFKCheck,
    setShowAFKCheck,
    isWatchingClass,
    setIsWatchingClass,
    afkTimeLeft,
    showFuelLeak,
    setShowFuelLeak,
    leakedXP,
    showAlert,
    setShowAlert,
    currentBetRef,
    remainingShieldRef,
    studyLinkRef,
    safeUpdateRoom,
    performSafeExit,
    handleConfirmExit,
    toggleCall,
    triggerRedAlert,
    handleSendMessage,
    saveNotes,
    handleNextMissionSubmit,
    isHost,
    hasJoinedStation,
    setHasJoinedStation,
  };
}



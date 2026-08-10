import { useState, useEffect, useRef } from "react";
import { Room, UserData } from "../shared";

export interface SessionCompletionData {
  stationId: string;
  stationName: string;
  durationMinutes: number;
  xpGained: number;
  completedAt: number;
}

export function useSessionCompletion(
  stationId: string,
  room: Room | null,
  user: UserData | null,
  isJoined: boolean
) {
  const [completionData, setCompletionData] = useState<SessionCompletionData | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  
  const prevStatusRef = useRef<string | null>(null);
  const prevStartTimeRef = useRef<any | null>(null);

  useEffect(() => {
    if (!room || !user || !isJoined) {
      if (room) {
        prevStatusRef.current = room.timerStatus;
        prevStartTimeRef.current = room.startTime;
      }
      return;
    }

    const currentStatus = room.timerStatus;
    const currentStartTime = room.startTime;

    const prevStatus = prevStatusRef.current;
    const prevStartTime = prevStartTimeRef.current;

    // We compute focusStartVal using the start time of the session that was JUST CURRENT (the completed focus session).
    // This is because the new currentStartTime will be overwritten with the break's start time, 
    // which starts out as an unresolved local serverTimestamp() placeholder (null).
    // Using the stable historical prevStartTime ensures a 100% correct, non-null identifier.
    const completedSessionStartTime = prevStartTime || currentStartTime;

    const focusStartVal = completedSessionStartTime 
      ? (typeof completedSessionStartTime.toDate === 'function' 
          ? completedSessionStartTime.toDate().getTime() 
          : (completedSessionStartTime.seconds ? completedSessionStartTime.seconds * 1000 : Number(completedSessionStartTime))) 
      : 0;

    const isTransitioningToRest = (currentStatus === "break" || currentStatus === "idle") && prevStatus === "focus";
    const isEligible = isTransitioningToRest && focusStartVal > 0;
    const storageKey = `celebrated_completion_${stationId}_${focusStartVal}`;
    const hasCelebrated = isEligible ? sessionStorage.getItem(storageKey) : null;

    if (isEligible) {
      if (!hasCelebrated) {
        sessionStorage.setItem(storageKey, "true");
        
        const duration = room.timerDuration || 25;
        const estimatedXp = duration;

        setCompletionData({
          stationId,
          stationName: room.name || "المحطة الاستكشافية",
          durationMinutes: duration,
          xpGained: estimatedXp,
          completedAt: Date.now()
        });
        setIsOpen(true);
      }
    }

    prevStatusRef.current = currentStatus;
    prevStartTimeRef.current = currentStartTime;
  }, [room?.timerStatus, room?.startTime, stationId, user?.totalFocusSessions, isJoined]);

  const closeCompletion = () => {
    setIsOpen(false);
    setCompletionData(null);
  };

  return {
    isOpen,
    completionData,
    closeCompletion
  };
}


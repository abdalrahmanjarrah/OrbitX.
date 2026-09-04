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

    // We compute focusStartVal using the start time of the segment that was JUST CURRENT
    // (the completed focus segment). Using the stable historical prevStartTime ensures a
    // 100% correct, non-null identifier for the segment that actually finished.
    const completedSessionStartTime = prevStartTime || currentStartTime;

    const resolveMs = (v: any): number =>
      v
        ? typeof v.toDate === "function"
          ? v.toDate().getTime()
          : typeof v === "string"
            ? new Date(v).getTime()
            : v.seconds
              ? v.seconds * 1000
              : Number(v)
        : 0;

    const focusStartVal = resolveMs(completedSessionStartTime);

    // A focus segment is considered completed when the room leaves "focus":
    // either it moves to break (the round continues through a natural rest)
    // or it moves to idle (the round was stopped).
    const segmentCompleted =
      prevStatus === "focus" && (currentStatus === "break" || currentStatus === "idle");
    const isEligible = segmentCompleted && focusStartVal > 0;
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


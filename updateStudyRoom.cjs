const fs = require('fs');
let code = fs.readFileSync('src/views/StudyRoomView.tsx', 'utf8');

// Add isExitingRef
code = code.replace(
  '  const [isExiting, setIsExiting] = useState(false);',
  '  const [isExiting, setIsExiting] = useState(false);\n  const isExitingRef = useRef(false);'
);

// Replace handleConfirmExit with performSafeExit
const handleConfirmExitStart = code.indexOf('  const handleConfirmExit = async () => {');
const handleConfirmExitEnd = code.indexOf('  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);', handleConfirmExitStart);

if (handleConfirmExitStart === -1 || handleConfirmExitEnd === -1) {
    console.error("Could not find handleConfirmExit boundaries");
    process.exit(1);
}

const safeExitLogic = `  const performSafeExit = async (options: {
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
          ? \`🚀 غادر المحرك (\${user.displayName}) المحطة والتايمر يعمل بوضع الدراسة (تم خصم \${Math.abs(options.penaltyAmount || 10)} XP).\`
          : \`🚀 غادر المحرك (\${user.displayName}) المحطة.\`),
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

`;

code = code.substring(0, handleConfirmExitStart) + safeExitLogic + code.substring(handleConfirmExitEnd);


// Replace onExit() calls that bypass performSafeExit

// 1. handleAFKFailure
code = code.replace(
  '    addDoc(collection(db, "rooms", stationId, "messages"), {\n      text: \`💤 غادر \${user.displayName} المحطة بسبب عدم الاستجابة (AFK). تم حفظ نقاطه المسجلة حتى الآن.\`,\n      userId: "system",\n      userName: "نظام المراقبة",\n      userPhoto: "",\n      timestamp: serverTimestamp(),\n      type: "text",\n    }).catch(() => {});\n\n    onExit();',
  '    performSafeExit({\n       customExitMessage: \`💤 غادر \${user.displayName} المحطة بسبب عدم الاستجابة (AFK). تم حفظ نقاطه المسجلة حتى الآن.\`\n    });'
);

// 2. private challenge rejection
code = code.replace(
  '        if (!isAllowed) {\n          alert("هذا التحدي خاص. لا يمكنك الدخول.");\n          onExit();\n          return;\n        }',
  '        if (!isAllowed) {\n          alert("هذا التحدي خاص. لا يمكنك الدخول.");\n          performSafeExit({ skipFirebaseUpdate: true });\n          return;\n        }'
);

// 3. Room deleted snapshot handler
code = code.replace(
  '        } else {\n          // Room was deleted or doesn\'t exist\n          setTimeout(() => onExit(), 0);\n        }',
  '        } else {\n          // Room was deleted or doesn\'t exist\n          setTimeout(() => performSafeExit({ skipFirebaseUpdate: true }), 0);\n        }'
);

// 4. Delete explicitly
code = code.replace(
  '                  onClick={async () => {\n                    setShowDeleteDialog(false);\n                    await deleteDoc(doc(db, "rooms", stationId));\n                    onExit();\n                  }}',
  '                  onClick={async () => {\n                    setShowDeleteDialog(false);\n                    await deleteDoc(doc(db, "rooms", stationId));\n                    performSafeExit({ skipFirebaseUpdate: true });\n                  }}'
);

// Write
fs.writeFileSync('src/views/StudyRoomView.tsx', code);
console.log("Done");

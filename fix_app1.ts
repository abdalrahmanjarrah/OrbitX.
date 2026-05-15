import * as fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Fix initialization of User 'profiles'
content = content.replace(
`            setDoc(userRef, newUserData).catch((e) =>
              handleFirestoreError(e, OperationType.WRITE, \`users/\${user.uid}\`),
            );`,
`            setDoc(userRef, newUserData).catch((e) =>
              handleFirestoreError(e, OperationType.WRITE, \`users/\${user.uid}\`),
            );
            setDoc(doc(db, "profiles", user.uid), newUserData).catch(() => {});`
);

// 2. Fix Tour to show once unconditionally
content = content.replace(
`  useEffect(() => {
    if (
      user &&
      user.level === 1 &&
      user.xp <= 10 &&
      !localStorage.getItem("hasSeenTour_v3")
    ) {
      // Delay slightly for render
      setTimeout(() => setRunTour(true), 1500);
    }
  }, [user]);`,
`  useEffect(() => {
    if (
      user &&
      !localStorage.getItem("hasSeenTour_v4")
    ) {
      localStorage.setItem("hasSeenTour_v4", "true");
      setTimeout(() => setRunTour(true), 1500);
    }
  }, [user]);`
);

// 3. Make the StudyRoomView join automatically and remove the join buttons
content = content.replace(
`    // We no longer join participants automatically on mount
    // This will be handled by the "Join" button`,
`    // Join automatically on mount
    if (!isJoinedRef.current) {
      setIsJoined(true);
      setHasJoinedStation(true);
      updateDoc(roomRef, {
        participants: arrayUnion(user.uid),
        emptyAt: null,
      }).catch(() => {});
    }`
);

// 4. Remove Join/Leave Orbit button in StudyRoomView
content = content.replace(
`          {/* Join/Leave Button */}
          <button
            onClick={toggleCall}
            className={cn(
              "px-6 py-2.5 rounded-2xl font-bold transition-all shadow-sm flex items-center gap-2 text-sm",
              isJoined
                ? "bg-red-600 hover:bg-red-700 shadow-red-600/20"
                : "bg-indigo-500 hover:bg-indigo-700 shadow-indigo-500/20",
            )}
          >
            <span>{isJoined ? "مغادرة المدار" : "انضم للمحطة"}</span>
          </button>`,
``
);

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log("Replaced stuff");

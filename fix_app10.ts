import * as fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. users creation
content = content.replace(
  `} else {
            // Initialize new user
            const newUserData: UserData = {
              uid: user.uid,
              displayName: user.displayName || "رائد فضاء",
              email: user.email || "",
              photoURL: user.photoURL || "",
              level: 1,
              xp: 0,
              role:
                user.email === "lumafashionhq@gmail.com" ||
                user.email === "abdalrahmanjarrah94@gmail.com"
                  ? "admin"
                  : "user",
              friendsCount: 0,
              banned: false,
              currentActivity: "في لوحة التحكم",
              streak: 1,
              lastActiveDate: new Date().toISOString().split("T")[0],
            };
            setDoc(userRef, newUserData).catch((e) =>
              handleFirestoreError(e, OperationType.WRITE, \`users/\${user.uid}\`),
            );
            setDoc(doc(db, "profiles", user.uid), newUserData).catch(() => {});
          }`,
  `} else {
            // Initialize new user
            const isAdminEmail =
              user.email === "lumafashionhq@gmail.com" ||
              user.email === "abdalrahmanjarrah94@gmail.com";

            const newUserData: UserData = {
              uid: user.uid,
              displayName: user.displayName || "رائد فضاء",
              email: user.email || "",
              photoURL: user.photoURL || "",
              level: 1,
              xp: 0,
              role: isAdminEmail ? "admin" : "user",
              friendsCount: 0,
              banned: false,
              currentActivity: "في لوحة التحكم",
              streak: 1,
              lastActiveDate: new Date().toISOString().split("T")[0],
            };

            const initUser = async () => {
                await setDoc(userRef, newUserData).catch((e) =>
                  handleFirestoreError(e, OperationType.WRITE, \`users/\${user.uid}\`),
                );

                const profileRef = doc(db, "profiles", user.uid);
                await setDoc(profileRef, {
                  uid: user.uid,
                  displayName: user.displayName || "رائد فضاء",
                  photoURL: user.photoURL || "",
                  bio: "",
                  level: 1,
                  xp: 0,
                  totalFocusSessions: 0,
                  friendsCount: 0,
                  role: isAdminEmail ? "admin" : "user",
                  banned: false,
                  currentActivity: "في لوحة التحكم",
                  streak: 1,
                  lastActiveDate: new Date().toISOString().split("T")[0],
                }, { merge: true }).catch((e) =>
                  handleFirestoreError(e, OperationType.WRITE, \`profiles/\${user.uid}\`)
                );
            };
            initUser();
          }`
);

// Add the ref for XP
content = content.replace(
  `  const [room, setRoom] = useState<Room | null>(null);`,
  `  const [room, setRoom] = useState<Room | null>(null);\n  const lastXpGrantTimestampRef = useRef<number | null>(null);`
);

// Fix XP logic
content = content.replace(
  `        if (secondsSpent >= 60) {
          const minutesSpent = Math.floor(secondsSpent / 60);
          lastXpUpdateTimeRef.current -= minutesSpent * 60;
          updateDoc(doc(db, "users", user.uid), {
            xp: increment(minutesSpent),
          }).catch(() => {});
          if (user.fleetId)
            updateDoc(doc(db, "fleets", user.fleetId), {
              xp: increment(minutesSpent),
            }).catch(() => {});
        }`,
  `        if (secondsSpent >= 60) {
          const minutesSpent = Math.floor(secondsSpent / 60);
          // سقف أمان: 1 XP لكل دقيقة كحد أقصى
          const safeMinutes = Math.min(minutesSpent, 1);
          lastXpUpdateTimeRef.current -= safeMinutes * 60;

          // تحقق من آخر وقت منح XP لمنع التكرار
          const now = Date.now();
          const lastGrant = lastXpGrantTimestampRef.current || 0;
          if (now - lastGrant >= 55000) {
              lastXpGrantTimestampRef.current = now;

              updateDoc(doc(db, "users", user.uid), {
                xp: increment(safeMinutes),
              }).catch(() => {});
              if (user.fleetId)
                updateDoc(doc(db, "fleets", user.fleetId), {
                  xp: increment(safeMinutes),
                }).catch(() => {});
          }
        }`
);

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log("Fixes applied successfully");

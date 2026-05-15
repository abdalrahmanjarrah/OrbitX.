import * as fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add displayName to ProfileView state
content = content.replace(
  `  const [bio, setBio] = useState(user.bio || "");`,
  `  const [bio, setBio] = useState(user.bio || "");\n  const [displayName, setDisplayName] = useState(user.displayName || "");`
);

// 2. Add input for displayName when isEditing
content = content.replace(
  `                {isEditing ? (
                  <input
                    type="text"
                    value={missionRoleStr}
                    onChange={(e) => setMissionRoleStr(e.target.value)}
                    placeholder="وظيفتك الطموحة (مثل: دكتور قلب)"
                    className="bg-[#0f1021] text-gray-300 px-4 py-2 rounded-xl text-xs sm:text-sm border border-indigo-400/20 focus:outline-none focus:border-indigo-400 w-full mb-3"
                  />
                ) : (`,
  `                {isEditing ? (
                  <>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="الاسم"
                    className="bg-[#0f1021] text-white px-4 py-2 rounded-xl text-sm border border-indigo-400/20 focus:outline-none focus:border-indigo-400 w-full mb-3 font-bold"
                  />
                  <input
                    type="text"
                    value={missionRoleStr}
                    onChange={(e) => setMissionRoleStr(e.target.value)}
                    placeholder="وظيفتك الطموحة (مثل: دكتور قلب)"
                    className="bg-[#0f1021] text-gray-300 px-4 py-2 rounded-xl text-xs sm:text-sm border border-indigo-400/20 focus:outline-none focus:border-indigo-400 w-full mb-3"
                  />
                  </>
                ) : (`
);

// 3. Update the displayName in DB on Save
content = content.replace(
  `                  onClick={async () => {
                    setContentChanging(true);
                    try {
                      await updateDoc(doc(db, "users", user.uid), {
                        bio,
                        missionRole: missionRoleStr.trim(),
                      });
                      setIsEditing(false);`,
  `                  onClick={async () => {
                    setContentChanging(true);
                    try {
                      await updateDoc(doc(db, "users", user.uid), {
                        bio,
                        missionRole: missionRoleStr.trim(),
                      });
                      await updateDoc(doc(db, "profiles", user.uid), {
                        displayName: displayName.trim() || user.displayName,
                      }).catch(() => {});
                      await updateDoc(doc(db, "users", user.uid), {
                        displayName: displayName.trim() || user.displayName,
                      });
                      setIsEditing(false);`
);

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log("Replaced stuff for ProfileView");

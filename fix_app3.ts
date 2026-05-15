import * as fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Add displayName to Admin Edit
content = content.replace(
  `              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 block text-right">
                    مستوى (ج)
                  </label>`,
  `              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 block text-right">الاسم</label>
                  <input
                    type="text"
                    value={editingUser.displayName}
                    onChange={(e) => setEditingUser({...editingUser, displayName: e.target.value})}
                    className="w-full bg-[#0a0b16] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500 text-right"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 block text-right">
                    مستوى (ج)
                  </label>`
);

content = content.replace(
  `                  onClick={() => {
                    handleUpdateUser(editingUser.uid, {
                      level: editingUser.level,
                      xp: editingUser.xp,
                      role: editingUser.role,
                      banned: editingUser.banned,
                    });
                  }}`,
  `                  onClick={() => {
                    handleUpdateUser(editingUser.uid, {
                      displayName: editingUser.displayName,
                      level: editingUser.level,
                      xp: editingUser.xp,
                      role: editingUser.role,
                      banned: editingUser.banned,
                    });
                  }}`
);

content = content.replace(
  `  const handleUpdateUser = async (uid: string, data: Partial<UserData>) => {
    try {
      await updateDoc(doc(db, "users", uid), data);`,
  `  const handleUpdateUser = async (uid: string, data: Partial<UserData>) => {
    try {
      await updateDoc(doc(db, "users", uid), data);
      await updateDoc(doc(db, "profiles", uid), data).catch(() => {});`
);


fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log("Replaced stuff for AdminView");

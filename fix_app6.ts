import * as fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add ChatEnable toggle in Admin Panel
content = content.replace(
  `function AdminView({ user }: { user: UserData }) {`,
  `function AdminView({ user }: { user: UserData }) {
  const [isChatEnabled, setIsChatEnabled] = useState(true);
  
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "system", "settings"), (docSnap) => {
       if (docSnap.exists()) {
          setIsChatEnabled(docSnap.data().isChatEnabled !== false);
       }
    });
    return () => unsub();
  }, []);
  
  const toggleChat = async () => {
    try {
      await updateDoc(doc(db, "system", "settings"), { isChatEnabled: !isChatEnabled }).catch(async () => {
         await setDoc(doc(db, "system", "settings"), { isChatEnabled: !isChatEnabled });
      });
    } catch(e) {}
  };`
);

content = content.replace(
`        <div className="flex gap-4">
          <button
            onClick={() => setView("users")}
            className={cn(
              "px-6 py-3 rounded-2xl font-bold transition-all border outline-none",
              view === "users"
                ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10",
            )}
          >
            رواد الفضاء`,
`        <div className="flex gap-2 w-full justify-between">
          <div className="flex gap-4">
            <button
              onClick={() => setView("users")}
              className={cn(
                "px-6 py-3 rounded-2xl font-bold transition-all border outline-none",
                view === "users"
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                  : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10",
              )}
            >
              رواد الفضاء
            </button>
            <button
              onClick={() => setView("content")}
              className={cn(
                "px-6 py-3 rounded-2xl font-bold transition-all border outline-none",
                view === "content"
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                  : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10",
              )}
            >
              المحتوى
            </button>
          </div>
          <div>
            <button
              onClick={toggleChat}
              className={cn(
                "px-6 py-3 rounded-2xl font-bold transition-all border outline-none",
                isChatEnabled ? "bg-green-600 border-green-500 text-white" : "bg-red-600 border-red-500 text-white"
              )}
            >
              {isChatEnabled ? "إيقاف الشات العام" : "تشغيل الشات العام"}
            </button>
          </div>
        </div>
        <div className="flex gap-4 hidden">
          <button` 
);

content = content.replace(
`function ChatView({
  user,
  onSelectUser,
}: {
  user: UserData;
  onSelectUser: (id: string) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);`,
`function ChatView({
  user,
  onSelectUser,
}: {
  user: UserData;
  onSelectUser: (id: string) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isChatEnabled, setIsChatEnabled] = useState(true);
  
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "system", "settings"), (docSnap) => {
       if (docSnap.exists()) setIsChatEnabled(docSnap.data().isChatEnabled !== false);
    });
    return () => unsub();
  }, []);`
);

content = content.replace(
`  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;`,
`  const handleSendMessage = async () => {
    if (!isChatEnabled && user.role !== 'admin') {
       alert("الشات العام موقف حالياً من قبل الإدارة.");
       return;
    }
    if (!newMessage.trim()) return;`
);

content = content.replace(
`          <input
            type="text"
            value={newMessage}
            onChange={(e) => {`,
`          <input
            type="text"
            value={newMessage}
            disabled={!isChatEnabled && user.role !== 'admin'}
            onChange={(e) => {`
);

content = content.replace(
`            placeholder="اكتب رسالة للجميع..."`,
`            placeholder={!isChatEnabled && user.role !== 'admin' ? "الشات موقف حالياً..." : "اكتب رسالة للجميع..."}`
);


// And fix the sound in StudyRoomView
content = content.replace(
`        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const msg = change.doc.data();
            if (!initialLoadMsgs && msg.userId !== user.uid) {
              playSound("message");
            }`,
`        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const msg = change.doc.data();
            // User requested no chat sound inside Study Rounds. So we mute it.
            // if (!initialLoadMsgs && msg.userId !== user.uid) { playSound("message"); }`
);

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log("Chat toggle and sound fix done");

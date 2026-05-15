import * as fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Fix 1: Add isAdmin to destructured props of StationCard
content = content.replace(
  `function StationCard({
  room,
  activeUsers,
  onEnter,
}: {`,
  `function StationCard({
  room,
  activeUsers,
  onEnter,
  isAdmin,
}: {`
);

// Fix 2: Revert StudyRoomView's handleSendMessage
content = content.replace(
  `  const handleSendMessage = async () => {
    if (!isChatEnabled && user.role !== 'admin') {
       alert("الشات العام موقف حالياً من قبل الإدارة.");
       return;
    }
    if (!newMessage.trim()) return;
    if (newMessage.length > 500) {`,
  `  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    if (newMessage.length > 500) {`
);

// Fix 3: Revert StudyRoomView's input
content = content.replace(
  `              <input
                type="text"
                value={newMessage}
                disabled={!isChatEnabled && user.role !== 'admin'}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}`,
  `              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}`
);

content = content.replace(
  `                placeholder={!isChatEnabled && user.role !== 'admin' ? "الشات موقف حالياً..." : "اكتب رسالة للجميع..."}
                className="flex-1 bg-[#0a0b16] border border-white/10 rounded-2xl px-4 py-3 text-right focus:outline-none focus:border-indigo-500 text-sm"`,
  `                placeholder="اكتب رسالة للغرفة (اكتب /help للأوامر)..."
                className="flex-1 bg-[#0a0b16] border border-white/10 rounded-2xl px-4 py-3 text-right focus:outline-none focus:border-indigo-500 text-sm"`
);

// Wait, the input in StudyRoomView placeholder was "اكتب رسالة للغرفة (اكتب /help للأوامر)..."
// And in ChatView the placeholder was "اكتب رسالة للجميع..."
// So ChatView actually got its replacement modified if the first occurrence was StudyRoomView?
// Wait, `fix_app6.ts` replaced ONLY the FIRST occurrence of those strings!
// StudyRoomView comes BEFORE ChatView in the file!!
// So I need to apply them to ChatView correctly.
fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log("Fixed errors");

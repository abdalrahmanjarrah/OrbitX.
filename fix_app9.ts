import * as fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  `  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    if (newMessage.length > 500) {
      alert("الرسالة طويلة جداً! الحد الأقصى هو 500 حرف.");
      return;
    }
    const now = Date.now();
    if (now - lastMsgTime.current < 2000) {`,
  `  const handleSendMessage = async () => {
    if (!isChatEnabled && user.role !== 'admin') {
       alert("الشات العام موقف حالياً من قبل الإدارة.");
       return;
    }
    if (!newMessage.trim()) return;
    if (newMessage.length > 500) {
      alert("الرسالة طويلة جداً! الحد الأقصى هو 500 حرف.");
      return;
    }
    const now = Date.now();
    if (now - lastMsgTime.current < 2000) {`
);

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log("ChatView handleSendMessage updated");

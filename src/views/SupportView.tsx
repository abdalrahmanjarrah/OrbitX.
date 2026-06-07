import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Info,
  HelpCircle,
  Mail,
  Send,
  Activity,
  MessageSquare,
} from "lucide-react";
import { UserData } from "../shared";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { cn } from "../lib/utils";
import { useLanguage } from "../context/LanguageContext";

export default function SupportView({ user }: { user: UserData }) {
  const { isAr, t } = useLanguage();
  const [tab, setTab] = useState<"support" | "suggestions">("support");
  const [ticketText, setTicketText] = useState("");
  const [suggestionText, setSuggestionText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitTicket = async () => {
    if (!ticketText.trim()) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "support_tickets"), {
        text: ticketText,
        userId: user.uid,
        userName: user.displayName,
        userEmail: user.email || "None",
        timestamp: serverTimestamp(),
        status: "open",
      });
      setTicketText("");
      alert(
        isAr
          ? "تم إرسال طلب الدعم بنجاح. سنقوم بالرد عليك قريباً."
          : "Support ticket sent successfully. We will reply to you soon."
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "support_tickets");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitSuggestion = async () => {
    if (!suggestionText.trim()) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "suggestions"), {
        text: suggestionText,
        userId: user.uid,
        userName: user.displayName,
        timestamp: serverTimestamp(),
      });
      setSuggestionText("");
      alert(
        isAr
          ? "تم إرسال اقتراحك بنجاح. شكراً لمساهمتك في تطوير OrbitX!"
          : "Your suggestion was submitted successfully. Thank you for contributing to OrbitX!"
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "suggestions");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-8 max-w-5xl mx-auto space-y-8"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0c0c16] to-[#050510] border border-white/10 p-8 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="flex flex-col md:flex-row gap-6 justify-between items-start relative z-10">
          <div className="space-y-4">
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <Info className="text-indigo-400" size={32} />
              {isAr ? "مركز الملاحة والدعم الفني" : "Navigation & Cosmic Support"}
            </h1>
            <p className="text-gray-400 max-w-xl text-sm leading-relaxed">
              {isAr
                ? "هنا يمكنك التواصل مع طاقم OrbitX للإبلاغ عن أي خلل تقني أو تقديم مقترحات لتطوير المحطة الفضائية الخاصة بنا."
                : "Get in touch with the OrbitX crew to report technical anomalies or suggest new components for our space station."}
            </p>
          </div>
          <div className="flex bg-[#050510] border border-white/10 rounded-2xl p-1">
            <button
              onClick={() => setTab("support")}
              className={cn(
                "px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all text-xs md:text-sm",
                tab === "support"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-white/5",
              )}
            >
              <HelpCircle size={18} />
              {isAr ? "الدعم الفني" : "Helpdesk"}
            </button>
            <button
              onClick={() => setTab("suggestions")}
              className={cn(
                "px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all text-xs md:text-sm",
                tab === "suggestions"
                  ? "bg-fuchsia-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-white/5",
              )}
            >
              <Activity size={18} />
              {isAr ? "المقترحات" : "Suggestions"}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          {tab === "support" ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#0b0c16] border border-white/10 rounded-3xl p-6 md:p-8"
            >
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Mail className="text-indigo-400" />
                {isAr ? "إرسال تذكرة دعم فني" : "Transmit Support Signal"}
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                {isAr
                  ? "يرجى وصف المشكلة التقنية التي تواجهها بالتفصيل السطحي، وسيقوم فريق الدعم بمراجعتها ومعالجتها."
                  : "Please describe the technical variance anomaly you are experiencing. The cosmic dispatch team will analyze the telemetry."}
              </p>

              <div className="space-y-4">
                <textarea
                  value={ticketText}
                  onChange={(e) => setTicketText(e.target.value)}
                  placeholder={isAr ? "وصف المشكلة... (الرجاء ذكر الخطوات التي أدت للمشكلة إن أمكن)" : "Describe the anomaly parameters... (what steps led to the issue)"}
                  className="w-full bg-[#050510] border border-white/10 rounded-2xl p-6 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[200px] transition-all resize-none shadow-inner"
                />
                <button
                  onClick={handleSubmitTicket}
                  disabled={isSubmitting || !ticketText.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={18} />
                      {isAr ? "إرسال التذكرة" : "Transmit Signal"}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#0b0c16] border border-white/10 rounded-3xl p-6 md:p-8"
            >
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <MessageSquare className="text-fuchsia-400" />
                {isAr ? "صندوق الاقتراحات" : "Suggestions Module"}
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                {isAr
                  ? "نحن نستمع دوماً! شاركنا أفكارك، ميزات تتمنى وجودها، أو طرق لتحسين تجربة OrbitX."
                  : "We always listen! Share your ideas, cosmic payloads, or optimizations to refine the OrbitX orbit."}
              </p>

              <div className="space-y-4">
                <textarea
                  value={suggestionText}
                  onChange={(e) => setSuggestionText(e.target.value)}
                  placeholder={isAr ? "اقتراحك يهمنا... (شاركنا أفكارك بحرية، فريق الإدارة يقرأ كل المقترحات)" : "Your suggestion counts... (Feel free to share anything, we read every frequency)"}
                  className="w-full bg-[#050510] border border-white/10 rounded-2xl p-6 text-white text-sm focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 min-h-[200px] transition-all resize-none shadow-inner"
                />
                <button
                  onClick={handleSubmitSuggestion}
                  disabled={isSubmitting || !suggestionText.trim()}
                  className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(192,38,211,0.3)] hover:shadow-[0_0_30px_rgba(192,38,211,0.5)] flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={18} />
                      {isAr ? "إرسال الاقتراح" : "Launch Suggestion"}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-900/40 to-blue-900/20 border border-indigo-500/30 p-6 rounded-3xl">
            <h3 className="text-indigo-300 font-bold mb-4">
              {isAr ? "هل تعلم؟ 💡" : "Did you know? 💡"}
            </h3>
            <p className="text-indigo-200/80 text-sm leading-relaxed">
              {isAr
                ? "الكثير من ميزاتنا الحالية (مثل نظام الثقوب السوداء وجدول العادات) بدأت كاقتراحات من مستخدمين مثلك. نحن نبني هذه المنصة لكم وبكم."
                : "Many of our modern systems (such as Black Holes and the habit grid) began as whispers in the Suggestion Box. We build OrbitX together."}
            </p>
          </div>

          <div className="bg-[#0b0c16] border border-white/10 p-6 rounded-3xl">
            <h3 className="font-bold text-white mb-4">
              {isAr ? "أسئلة شائعة" : "Space FAQ"}
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-gray-300 mb-1">
                  {isAr ? "كيف أحصل على XP أكثر؟" : "How do I earn more XP?"}
                </h4>
                <p className="text-xs text-gray-500">
                  {isAr
                    ? "حاول الدراسة في محطات مشتركة، والمشاركة في التحديات والنزالات الودية."
                    : "Commence study sprints inside public rooms, accept galactic challenges, and engage in friendly focus battles."}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-300 mb-1">
                  {isAr ? "لم أستلم الإشعارات؟" : "Not receiving transmissions?"}
                </h4>
                <p className="text-xs text-gray-500">
                  {isAr
                    ? "تأكد من تفعيل صلاحيات الإشعارات في متصفحك أو جهازك."
                    : "Ensure notification telemetry privileges are authorized inside your web browser or terminal settings."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

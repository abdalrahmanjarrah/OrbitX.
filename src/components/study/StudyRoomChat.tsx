import React, { useRef, useEffect, useState } from "react";
import { useRenderLog } from "../../firebaseDebug";
import { AnimatePresence, motion } from "motion/react";
import { MessageCircle, Send, Trash2, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { doc, deleteDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../firebase";
import { Room, Message, UserData } from "../../shared";
import { setDoc } from "firebase/firestore";

export interface StudyRoomChatProps {
  room: Room;
  messages: Message[];
  typingNames: string[];
  user: UserData;
  stationId: string;
  isHost: boolean;
  handleSendMessage: (customText?: string) => void;
  onSelectUser: (id: string) => void;
  isChatDrawerOpen: boolean;
  setIsChatDrawerOpen: (open: boolean) => void;
  safeUpdateRoom: (data: any) => Promise<void>;
}

function StudyRoomChatComponent({
  room,
  messages,
  typingNames,
  user,
  stationId,
  isHost,
  handleSendMessage,
  onSelectUser,
  isChatDrawerOpen,
  setIsChatDrawerOpen,
  safeUpdateRoom,
}: StudyRoomChatProps) {
  useRenderLog("StudyRoomChat", { messagesCount: messages.length, typingNames, isChatDrawerOpen });
  const [localNewMessage, setLocalNewMessage] = useState("");
  const [deletingMsgId, setDeletingMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastTypingUpdate = useRef(0);
  const typingTimeoutRef = useRef<any>(null);

  const onSend = () => {
    if (!localNewMessage.trim()) return;
    handleSendMessage(localNewMessage);
    setLocalNewMessage("");
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    deleteDoc(doc(db, "rooms", stationId, "typing", user.uid)).catch(() => {});
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (user?.uid) {
        deleteDoc(doc(db, "rooms", stationId, "typing", user.uid)).catch(() => {});
      }
    };
  }, [user?.uid, stationId]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isChatDrawerOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: 20 }}
            animate={{ height: "500px", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: 20 }}
            className="w-96 bg-gradient-to-br from-[#0c0c16]/95 to-[#050510]/95 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl shadow-indigo-900/40 mb-4 flex flex-col"
          >
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-space-dark/80 shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <MessageCircle
                    size={18}
                    className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                  />
                  <h3 className="font-bold text-right text-sm tracking-wide">
                    دردشة المحطة
                  </h3>
                </div>
                {isHost && (
                  <button
                    onClick={async () => {
                      await safeUpdateRoom({ isChatLocked: !room?.isChatLocked });
                    }}
                    className={cn(
                      "text-[10px] px-2 py-1 rounded-full font-bold transition-all",
                      room?.isChatLocked
                        ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                    )}
                  >
                    {room?.isChatLocked ? "دردشة مغلقة 🔒" : "دردشة مفتوحة 🔓"}
                  </button>
                )}
              </div>
              <button
                onClick={() => setIsChatDrawerOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-3 relative custom-scrollbar">
              {typingNames.length > 0 && (
                <div
                  className="sticky top-0 z-10 text-[10px] text-indigo-400 italic mb-2 animate-pulse text-right bg-[#0a0b16]/80 p-1.5 rounded-lg backdrop-blur-sm self-start inline-block"
                  dir="rtl"
                >
                  {typingNames.slice(0, 3).join(" و ")}{" "}
                  {typingNames.length > 3
                    ? "وآخرون يكتبون..."
                    : typingNames.length > 1
                      ? "يكتبون الآن..."
                      : "يكتب الآن..."}
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col",
                    msg.userId === user.uid ? "items-end" : "items-start",
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {(user.role === "admin" || msg.userId === user.uid) &&
                      (deletingMsgId === msg.id ? (
                        <div className="flex items-center gap-1.5 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/30">
                          <button
                            onClick={async () => {
                              try {
                                await deleteDoc(
                                  doc(
                                    db,
                                    "rooms",
                                    stationId,
                                    "messages",
                                    msg.id,
                                  ),
                                );
                                setDeletingMsgId(null);
                              } catch (e) {
                                handleFirestoreError(
                                  e,
                                  OperationType.DELETE,
                                  `rooms/${stationId}/messages/${msg.id}`,
                                );
                              }
                            }}
                            className="text-[9px] text-red-500 hover:text-white font-bold"
                          >
                            نعم
                          </button>
                          <button
                            onClick={() => setDeletingMsgId(null)}
                            className="text-[9px] text-gray-400"
                          >
                            لا
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingMsgId(msg.id)}
                          className="text-red-500 hover:text-red-400 p-1"
                        >
                          <Trash2 size={10} />
                        </button>
                      ))}
                    <button
                      onClick={() =>
                        msg.userId !== "system" &&
                        onSelectUser(msg.userId)
                      }
                      className={cn(
                        "flex items-center gap-1.5",
                        msg.userId !== "system" &&
                          "hover:text-indigo-500 transition-colors",
                      )}
                    >
                      <span className="text-[9px] text-gray-400 font-medium">
                        {msg.userName}
                      </span>
                      {msg.userPhoto && (
                        <img
                          src={msg.userPhoto}
                          className="w-3.5 h-3.5 rounded-full"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </button>
                  </div>
                  <div
                    className={cn(
                      "px-4 py-2 rounded-2xl text-sm max-w-[85%] leading-relaxed",
                      msg.userId === user.uid
                        ? "bg-indigo-500 text-white rounded-tr-none"
                        : "bg-white/10 text-gray-200 rounded-tl-none",
                      msg.userId === "system" &&
                        "bg-red-500/20 text-red-400 border border-red-500/30 italic w-full max-w-full text-center",
                    )}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 bg-[#0a0b16]/80 border-t border-white/10 shrink-0">
              <div className="relative">
                {room?.isChatLocked && !isHost ? (
                  <div className="w-full bg-[#050510] border border-red-500/30 rounded-xl px-4 py-3 text-center text-sm text-red-400 font-bold bg-opacity-50">
                    الدردشة مغلقة من قبل المشرف 🔒
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={localNewMessage}
                      onChange={(e) => {
                        setLocalNewMessage(e.target.value);
                        const now = Date.now();
                        if (typeof window !== "undefined" && (window as any).__firestoreQuotaExceeded) {
                          return; // Guard typing indicator when Firestore quota has run out
                        }
                        if (now - lastTypingUpdate.current > 10000) {
                          lastTypingUpdate.current = now;
                          setDoc(
                            doc(db, "rooms", stationId, "typing", user.uid),
                            { name: user.displayName, time: now },
                          ).catch(() => {});
                        }
                        if (typingTimeoutRef.current) {
                          clearTimeout(typingTimeoutRef.current);
                        }
                        typingTimeoutRef.current = setTimeout(() => {
                          if (user?.uid) {
                            deleteDoc(doc(db, "rooms", stationId, "typing", user.uid)).catch(() => {});
                          }
                        }, 4000);
                      }}
                      onKeyDown={(e) =>
                        e.key === "Enter" && onSend()
                      }
                      placeholder="اكتب رسالة..."
                      className="w-full bg-[#050510] shadow-inner border border-white/5 rounded-xl px-4 py-3 text-right text-sm focus:outline-none focus:border-indigo-500/50 text-white placeholder:text-gray-600"
                      dir="rtl"
                    />
                    <button
                      onClick={onSend}
                      className="absolute left-1.5 top-1.5 bottom-1.5 px-3 bg-indigo-500 rounded-lg hover:bg-indigo-600 transition-colors flex items-center justify-center"
                    >
                      <Send size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsChatDrawerOpen(!isChatDrawerOpen)}
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-xl",
          isChatDrawerOpen
            ? "bg-indigo-600 text-white shadow-indigo-900/50"
            : "bg-[#0a0b16] border border-white/10 text-cyan-400 hover:bg-white/5 shadow-black/50",
        )}
      >
        <MessageCircle
          size={20}
          className={cn(
            !isChatDrawerOpen &&
              "drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]",
          )}
        />
      </button>
    </div>
  );
}

export default React.memo(StudyRoomChatComponent);

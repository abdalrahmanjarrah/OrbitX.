import React, { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  Send,
  Trash2,
  Shield,
  Flame,
  MapPin,
  Search,
  ChevronDown,
  ChevronUp,
  Reply,
  Smile,
  Plus,
  Camera,
  Bell,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import {
  db,
  handleFirestoreError,
  OperationType,
  auth,
  addDoc,
  deleteDoc,
  updateDoc,
  setDoc,
} from "../firebase";
import {
  collection,
  doc,
  serverTimestamp,
  query,
  orderBy,
  limit as firestoreLimit,
  onSnapshot as originalOnSnapshot,
  increment,
} from "firebase/firestore";
import { Message, UserData, getAstronautRank } from "../shared";
import { playSound } from "../lib/sound";
import { useLanguage } from "../context/LanguageContext";

// Custom wrapper to intercept onSnapshot errors safely
function onSnapshot(...args: any[]) {
  if (args.length === 2 && typeof args[1] === "function") {
    return originalOnSnapshot(args[0], args[1], (e: any) => {
      console.error("Intercepted onSnapshot error", e, args[0]);
      handleFirestoreError(e, OperationType.GET, "snapshot_unknown");
    });
  }
  if (
    args.length === 3 &&
    typeof args[1] === "function" &&
    typeof args[2] === "function"
  ) {
    const originalError = args[2];
    args[2] = (e: any) => {
      console.error("Intercepted onSnapshot error", e, args[0]);
      originalError(e);
    };
    return originalOnSnapshot(args[0], args[1], args[2]);
  }
  return (originalOnSnapshot as any)(...args);
}

import Markdown from "react-markdown";

const EMOJI_CATEGORIES = [
  {
    id: "space",
    label: "فضاء 🪐",
    emojis: [
      "🚀",
      "🪐",
      "🔭",
      "🛸",
      "🛰️",
      "👾",
      "⭐️",
      "🌟",
      "✨",
      "☄️",
      "🌍",
      "🌞",
      "👩‍🚀",
      "👨‍🚀",
      "🌌",
      "🌙",
      "☀️",
    ],
  },
  {
    id: "faces",
    label: "وجوه 😂",
    emojis: [
      "😀",
      "😃",
      "😄",
      "😁",
      "😆",
      "😅",
      "😂",
      "🤣",
      "😊",
      "😇",
      "🙂",
      "🙃",
      "😉",
      "😌",
      "😍",
      "🥰",
      "😘",
      "😗",
      "😙",
      "😚",
      "😋",
      "😛",
      "😝",
      "😜",
      "🤪",
      "🤨",
      "🧐",
      "🤓",
      "😎",
      "🤩",
      "🥳",
      "😏",
      "😒",
      "😞",
      "😔",
      "😟",
      "😕",
      "🙁",
      "☹️",
      "😣",
      "😖",
      "😫",
      "😩",
      "🥺",
      "😢",
      "😭",
      "😤",
      "😠",
      "😡",
      "🤬",
      "🤯",
      "😳",
      "🥵",
      "🥶",
      "😱",
      "😨",
      "😰",
      "😥",
      "😓",
      "🤗",
      "🤔",
      "🤭",
      "🤫",
      "🤥",
      "😶",
      "😐",
      "😑",
      "😬",
      "🙄",
      "😯",
      "😦",
      "😧",
      "😮",
      "😲",
      "🥱",
      "😴",
      "🤤",
      "😪",
      "😵",
      "🤐",
      "🥴",
      "🤢",
      "🤮",
      "🤧",
      "😷",
      "🤒",
      "🤕",
    ],
  },
  {
    id: "hands",
    label: "تفاعل 👍",
    emojis: [
      "👍",
      "👎",
      "👊",
      "✊",
      "🤛",
      "🤜",
      "🤞",
      "✌️",
      "🤟",
      "🤘",
      "👌",
      "🤌",
      "🤏",
      "👈",
      "👉",
      "👆",
      "👇",
      "☝️",
      "✋",
      "🤚",
      "🖐️",
      "🖖",
      "👋",
      "🤙",
      "💪",
      "🦾",
      "🙏",
      "🤝",
      "👏",
      "🙌",
      "👐",
      "🤲",
      "👑",
      "💅",
      "🤳",
      "👂",
      "👃",
      "🧠",
    ],
  },
  {
    id: "symbols",
    label: "رموز ✨",
    emojis: [
      "❤️",
      "🧡",
      "💛",
      "💚",
      "💙",
      "💜",
      "🖤",
      "🤍",
      "💔",
      "❤️‍🔥",
      "❤️‍🩹",
      "❣️",
      "💕",
      "💞",
      "💓",
      "💗",
      "💖",
      "💘",
      "💝",
      "🎯",
      "💡",
      "🔥",
      "✨",
      "🎉",
      "🎁",
      "🎈",
      "🔔",
      "⭐",
      "🌟",
      "🌠",
      "🌈",
      "☀️",
      "🌙",
      "⚡",
      "❄️",
      "💤",
      "💬",
      "💭",
      "⚙️",
      "🔧",
      "🔑",
      "🔒",
      "🔓",
      "🔍",
      "🔎",
      "📚",
      "📝",
      "🗓️",
      "🇸🇦",
      "🕋",
      "🕌",
      "✅",
      "❌",
      "💯",
    ],
  },
];

// Module-level variables to persist scroll state across re-mounts
let savedScrollPosition = -1;
let savedIsAtBottom = true;
let unreadCountSinceAway = 0;

export default function ChatView({
  user,
  onSelectUser,
}: {
  user: UserData;
  onSelectUser: (id: string) => void;
}) {
  const { isAr, t, lang } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isChatEnabled, setIsChatEnabled] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [replyTo, setReplyTo] = useState<{
    id: string;
    text: string;
    userName: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const initialLoad = useRef(true);
  const prevCount = useRef(0);
  const lastMsgTime = useRef(0);

  // States for Emojis and File Attachments
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiTab, setEmojiTab] = useState("space");
  const [attachment, setAttachment] = useState<{
    name: string;
    type: string;
    dataUrl: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Refs for custom elements and caret handling
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Click outside to close emoji picker
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setNewMessage((prev) => prev + emoji);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    setNewMessage(before + emoji + after);

    // Put caret right after the inserted emoji on next tick
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 10);
  };

  const handlePlusClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");

    // Non-images must be under 1MB, images are compressed dynamically
    if (!isImage && file.size > 1024 * 1024) {
      alert(
        "حجم الملف كبير جداً! يجب أن يكون أقل من 1 ميغابايت لتخزينه بسلاسة في المحطة.",
      );
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;

      if (isImage) {
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
          // Dynamic compression with canvas (downscale to max 500px width/height and quality 0.3)
          const canvas = document.createElement("canvas");
          const max_width = 500;
          const max_height = 500;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > max_width) {
              height *= max_width / width;
              width = max_width;
            }
          } else {
            if (height > max_height) {
              width *= max_height / height;
              height = max_height;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                alert("فشل معالجة الصورة.");
                setIsUploading(false);
                return;
              }
              const reader = new FileReader();
              reader.onload = (e) => {
                const compressed = e.target?.result as string;
                if (compressed.length > 700000) {
                  alert("الصورة كبيرة جداً حتى بعد الضغط. جرب صورة أصغر.");
                  setIsUploading(false);
                  return;
                }
                setAttachment({
                  name: file.name,
                  type: "image",
                  dataUrl: compressed,
                });
                setIsUploading(false);
              };
              reader.readAsDataURL(blob);
            },
            "image/jpeg",
            0.3,
          );
        };
        img.onerror = () => {
          if (file.size > 1024 * 1024) {
            alert("عذراً، فشل تحميل ومعالجة هذه الصورة الضخمة.");
            setIsUploading(false);
            return;
          }
          setAttachment({
            name: file.name,
            type: "image",
            dataUrl: dataUrl,
          });
          setIsUploading(false);
        };
      } else {
        setAttachment({
          name: file.name,
          type: file.type.includes("pdf") ? "pdf" : "file",
          dataUrl: dataUrl,
        });
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "system", "settings"), (docSnap) => {
      if (docSnap.exists())
        setIsChatEnabled(docSnap.data().isChatEnabled !== false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "global_chat"),
      orderBy("timestamp", "desc"),
      firestoreLimit(30),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let msgs = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Message,
        );
        msgs = msgs.reverse();

        if (!initialLoad.current && msgs.length > prevCount.current) {
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg && lastMsg.userId !== user.uid) {
            playSound("message");
            if (!savedIsAtBottom) {
              setUnreadCount((prev) => prev + 1);
            }
          }
        }

        prevCount.current = msgs.length;
        setMessages(msgs);
        setLoading(false);
      },
      (e) => {
        handleFirestoreError(e, OperationType.GET, "global_chat");
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, [user.uid]);

  // Handle restoring scroll position
  useEffect(() => {
    if (!loading && initialLoad.current) {
      initialLoad.current = false;
      setTimeout(() => {
        if (scrollRef.current) {
          if (savedScrollPosition > -1 && !savedIsAtBottom) {
            scrollRef.current.scrollTop = savedScrollPosition;
            setShowScrollBottom(true);
            setUnreadCount(unreadCountSinceAway);
          } else {
            scrollToBottom(false);
          }
        }
      }, 50);
    } else if (!loading && !initialLoad.current) {
      // New message arrived
      if (scrollRef.current) {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg && lastMsg.userId === user.uid) {
          scrollToBottom(true);
        } else if (savedIsAtBottom) {
          scrollToBottom(true);
        }
      }
    }
  }, [messages, loading]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    savedScrollPosition = target.scrollTop;

    const isBottom =
      Math.abs(target.scrollHeight - target.clientHeight - target.scrollTop) <
      20;
    savedIsAtBottom = isBottom;

    if (isBottom) {
      setShowScrollBottom(false);
      setUnreadCount(0);
      unreadCountSinceAway = 0;
    } else {
      setShowScrollBottom(true);
    }
  };

  useEffect(() => {
    // Persist unread count if we unmount while away from bottom
    return () => {
      unreadCountSinceAway = unreadCount;
    };
  }, [unreadCount]);

  const scrollToBottom = (smooth = true) => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
      });
      savedIsAtBottom = true;
    }
  };

  const handleSendMessage = async () => {
    if (!isChatEnabled && user.role !== "admin") {
      alert("الشات العام موقف حالياً من قبل الإدارة.");
      return;
    }
    if (!newMessage.trim() && !attachment) return;
    if (newMessage.length > 500) {
      alert("الرسالة طويلة جداً! الحد الأقصى هو 500 حرف.");
      return;
    }
    const now = Date.now();
    if (now - lastMsgTime.current < 2000) {
      alert("الرجاء الانتظار قليلاً قبل إرسال رسالة أخرى.");
      return;
    }
    lastMsgTime.current = now;

    let finalMessageText = newMessage.trim();
    if (attachment) {
      if (attachment.type === "image") {
        finalMessageText +=
          (finalMessageText ? "\n\n" : "") +
          `![${attachment.name}](${attachment.dataUrl})`;
      } else {
        finalMessageText +=
          (finalMessageText ? "\n\n" : "") +
          `[📎 تحميل الملف: ${attachment.name}](${attachment.dataUrl})`;
      }
    }

    const messageData = {
      text: finalMessageText,
      userId: user.uid,
      userName: user.displayName,
      userPhoto: user.photoURL,
      userRankTitle: getAstronautRank(user.xp).title,
      userRankColor: getAstronautRank(user.xp).color,
      userRankIcon: getAstronautRank(user.xp).icon,
      timestamp: serverTimestamp(),
      type: "text",
      ...(replyTo ? { replyTo } : {}),
    };

    setNewMessage("");
    setReplyTo(null);
    setAttachment(null);

    try {
      await addDoc(collection(db, "global_chat"), messageData);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, "global_chat");
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    try {
      await deleteDoc(doc(db, "global_chat", msgId));
    } catch (e: any) {
      if (e?.code === "permission-denied") {
        alert("انتهت صلاحية الجلسة. أعد تسجيل الدخول.");
      } else {
        alert("فشل الحذف. حاول مرة ثانية.");
      }
      handleFirestoreError(e, OperationType.DELETE, `global_chat/${msgId}`);
    }
  };

  // Group messages by day
  const groupedMessages = messages.reduce(
    (acc, msg) => {
      const date = msg.timestamp?.toDate() || new Date();
      const dateStr = date.toLocaleDateString("ar-EG", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(msg);
      return acc;
    },
    {} as Record<string, Message[]>,
  );

  return (
    <div
      className="max-w-5xl mx-auto h-[calc(100vh-140px)] flex flex-col bg-gradient-to-br from-[#0a0b16]/95 to-[#0e1021]/95 shadow-2xl border border-indigo-500/20 rounded-3xl overflow-hidden relative backdrop-blur-3xl shadow-indigo-500/5"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Ambient background glow */}
      <div className="absolute top-0 inset-x-0 h-32 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/10 blur-3xl rounded-full pointer-events-none" />

      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-black/20 relative z-10">
        <div className="flex items-center gap-4">
          {user.role === "admin" && (
            <button
              onClick={async () => {
                try {
                  await setDoc(
                    doc(db, "system", "settings"),
                    { isChatEnabled: !isChatEnabled },
                    { merge: true },
                  );
                } catch (e) {
                  // handle errors silently in ui
                }
              }}
              className={cn(
                "text-xs px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 shadow-lg",
                !isChatEnabled
                  ? "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20",
              )}
            >
              <Shield size={14} />
              {!isChatEnabled
                ? isAr
                  ? "مغلق"
                  : "Closed"
                : isAr
                  ? "مفتوح"
                  : "Open"}
            </button>
          )}
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </div>
            <span className="text-xs text-emerald-400 font-bold tracking-wide">
              {isAr ? "متصل الآن" : "Online"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-white flex items-center gap-2">
            {t("chat.title", "Star Chat Global Broadcast")}
            <PlanetIcon />
          </h2>
        </div>
      </div>

      {/* Messages Area */}
      <div
        className="flex-1 p-4 md:p-6 overflow-y-auto relative z-10 custom-scrollbar scroll-smooth"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-4 animate-pulse",
                  i % 2 === 0 ? "flex-row-reverse" : "flex-row",
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 shrink-0" />
                <div className="w-48 h-16 bg-white/5 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6 pb-2">
            {Object.entries(groupedMessages).map(([date, msgs]) => (
              <div key={date} className="space-y-5">
                <div className="flex justify-center sticky top-2 z-20">
                  <span className="px-3 py-1 bg-[#101223]/90 border border-white/10 rounded-full text-xs text-gray-400 font-bold shadow-lg backdrop-blur-md">
                    {date}
                  </span>
                </div>
                {msgs.map((msg, index) => {
                  const isMe = msg.userId === user.uid;
                  const showAvatar =
                    index === 0 || msgs[index - 1].userId !== msg.userId;
                  const isUnreadBoundary =
                    unreadCount > 0 &&
                    msg.id ===
                      messages[Math.max(0, messages.length - unreadCount)]?.id;

                  return (
                    <div key={msg.id}>
                      {isUnreadBoundary && (
                        <div className="flex items-center gap-3 my-6">
                          <div className="flex-1 h-px bg-gradient-to-r from-pink-500/0 to-pink-500/50" />
                          <span className="text-xs font-bold text-pink-400 bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20 shadow-lg shadow-pink-500/20">
                            رسائل جديدة
                          </span>
                          <div className="flex-1 h-px bg-gradient-to-l from-pink-500/0 to-pink-500/50" />
                        </div>
                      )}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "flex gap-3",
                          isMe ? "flex-row-reverse" : "flex-row",
                        )}
                      >
                        {/* Avatar */}
                        <div className="w-10 flex flex-col items-center shrink-0">
                          {showAvatar ? (
                            <button
                              onClick={() => onSelectUser(msg.userId)}
                              className="relative group"
                            >
                              <div className="absolute -inset-0.5 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
                              <img
                                src={
                                  msg.userPhoto ||
                                  `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.userId}`
                                }
                                className="w-10 h-10 rounded-xl relative z-10 border border-white/10 object-cover bg-[#0a0b16]"
                                referrerPolicy="no-referrer"
                                alt={msg.userName}
                              />
                            </button>
                          ) : (
                            <div className="w-10" />
                          )}
                        </div>

                        {/* Message Content */}
                        <div
                          className={cn(
                            "flex flex-col max-w-[85%] md:max-w-[70%]",
                            isMe ? "items-end" : "items-start",
                          )}
                        >
                          {/* Headers */}
                          {showAvatar && (
                            <div className="flex flex-row-reverse items-center gap-2 mb-1.5 px-1">
                              <button
                                onClick={() => onSelectUser(msg.userId)}
                                className="font-bold text-sm text-gray-200 hover:text-indigo-300 transition-colors"
                              >
                                {msg.userName}
                              </button>
                              {msg.userRankIcon && (
                                <span
                                  className="text-xs"
                                  title={msg.userRankTitle}
                                >
                                  {msg.userRankIcon}
                                </span>
                              )}
                              {msg.userRankTitle && (
                                <span
                                  className={cn(
                                    "text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/5 border border-white/5",
                                    msg.userRankColor,
                                  )}
                                >
                                  {msg.userRankTitle}
                                </span>
                              )}
                              <span
                                className="text-[10px] text-gray-500 font-mono"
                                dir="ltr"
                              >
                                {msg.timestamp
                                  ?.toDate()
                                  .toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                              </span>
                            </div>
                          )}

                          {/* Bubble */}
                          <div className="group relative">
                            {/* Reply Preview */}
                            {(msg as any).replyTo && (
                              <div
                                className={cn(
                                  "text-xs text-gray-400 mb-1 flex items-center gap-2 p-1.5 rounded-lg bg-black/20 border-l-2 border-indigo-500 w-max max-w-full opacity-80",
                                  isMe
                                    ? "flex-row"
                                    : "flex-row-reverse ms-auto",
                                )}
                              >
                                <Reply size={12} className="shrink-0" />
                                <span className="font-bold truncate max-w-[100px]">
                                  {(msg as any).replyTo.userName}
                                </span>
                                <span className="truncate max-w-[150px] opacity-70">
                                  {(msg as any).replyTo.text}
                                </span>
                              </div>
                            )}

                            <div
                              className={cn(
                                "px-4 py-2.5 text-[15px] leading-relaxed relative z-10 shadow-sm transition-all markdown-body whitespace-pre-wrap",
                                isMe
                                  ? "bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-3xl rounded-tr-sm"
                                  : "bg-[#181a2e] border border-white/5 text-gray-100 rounded-3xl rounded-tl-sm",
                              )}
                              dir={isAr ? "rtl" : "ltr"}
                              style={{ wordBreak: "break-word" }}
                            >
                              <Markdown
                                components={{
                                  img: ({ ...props }) => {
                                    if (!props.src) return null;
                                    return (
                                      <img
                                        {...props}
                                        src={props.src || undefined}
                                        className="max-h-60 rounded-xl mt-2 border border-white/10 hover:scale-[1.01] transition-all cursor-zoom-in object-cover max-w-full block shadow-md"
                                        referrerPolicy="no-referrer"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (props.src)
                                            setLightboxImage(props.src);
                                        }}
                                      />
                                    );
                                  },
                                  a: ({ ...props }) => {
                                    const isDataUrl =
                                      props.href?.startsWith("data:");
                                    return (
                                      <a
                                        {...props}
                                        download={
                                          isDataUrl
                                            ? props.children?.toString() ||
                                              "file"
                                            : undefined
                                        }
                                        className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-300 font-bold px-3 py-1.5 rounded-xl border border-indigo-500/20 hover:bg-indigo-500/20 transition-all mt-2 max-w-full truncate text-xs"
                                      >
                                        {props.children}
                                      </a>
                                    );
                                  },
                                }}
                              >
                                {msg.text}
                              </Markdown>
                            </div>

                            {/* Context Menu (Hover) */}
                            <div
                              className={cn(
                                "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1",
                                isMe
                                  ? "-left-12 pr-2"
                                  : "-right-12 pl-2 flex-row-reverse",
                              )}
                            >
                              <button
                                onClick={() =>
                                  setReplyTo({
                                    id: msg.id,
                                    text: msg.text,
                                    userName: msg.userName,
                                  })
                                }
                                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 transition-colors backdrop-blur-md border border-white/5"
                                title="رد"
                              >
                                <Reply size={14} />
                              </button>
                              {(user.role === "admin" ||
                                msg.userId === user.uid) && (
                                <button
                                  onClick={async () => {
                                    if (
                                      confirm(
                                        "هل أنت متأكد من حذف هذه الرسالة؟",
                                      )
                                    ) {
                                      await handleDeleteMessage(msg.id);
                                    }
                                  }}
                                  className="p-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors backdrop-blur-md border border-red-500/10"
                                  title="حذف"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Floating Scroll to Bottom button */}
      <AnimatePresence>
        {showScrollBottom && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-24 right-8 z-30 w-10 h-10 bg-indigo-500 text-white rounded-full shadow-xl shadow-indigo-900/50 flex items-center justify-center border border-indigo-400 hover:bg-indigo-400 transition-colors group"
          >
            <ChevronDown
              size={20}
              className="group-hover:translate-y-0.5 transition-transform"
            />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#101223] shadow-md animate-bounce">
                {unreadCount > 9 ? "+9" : unreadCount}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="p-4 bg-[#0a0b16]/80 border-t border-white/5 relative z-20 backdrop-blur-xl">
        {!isChatEnabled && user.role !== "admin" ? (
          <div className="w-full bg-red-500/10 border border-red-500/30 rounded-2xl px-6 py-4 text-center text-red-400 font-bold flex items-center justify-center gap-2">
            <Shield size={18} />
            الدردشة العامة مغلقة حالياً من قبل الإدارة للإزعاج
          </div>
        ) : (
          <div className="relative">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,application/pdf,text/plain"
            />

            {/* Loader */}
            {isUploading && (
              <div
                className="text-xs text-indigo-400 font-bold flex items-center gap-1.5 justify-start px-4 py-2 animate-pulse"
                dir={isAr ? "rtl" : "ltr"}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                {isAr ? "جاري تحميل ومعالجة الملف..." : "Uploading and processing file..."}
              </div>
            )}

            {/* Attachment Thumbnail View */}
            {attachment && (
              <div
                className="mb-3 ms-4 me-16 flex items-center justify-between text-sm bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-2 text-gray-300 relative group backdrop-blur-md"
                dir={isAr ? "rtl" : "ltr"}
              >
                <div className="flex items-center gap-3">
                  {attachment.type === "image" ? (
                    <img
                      src={attachment.dataUrl}
                      className="w-10 h-10 rounded-lg object-cover border border-white/10 cursor-pointer hover:opacity-80 transition-all"
                      title={isAr ? "اضغط لتكبير الصورة" : "Click to enlarge image"}
                      onClick={() => setLightboxImage(attachment.dataUrl)}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-semibold text-xs animate-bounce">
                      {attachment.type === "pdf" ? "PDF" : "📁"}
                    </div>
                  )}
                  <div className={isAr ? "text-right" : "text-left"}>
                    <p className="text-xs font-bold text-white max-w-[200px] truncate">
                      {attachment.name}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {isAr ? "مستعد للإرسال كملف مرفق" : "Ready to send as attachment"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAttachment(null)}
                  className="p-1.5 hover:bg-white/10 inline-flex items-center justify-center rounded-full transition-colors text-red-400 hover:text-red-300"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Lightbox / Full-screen Image Modal */}
            <AnimatePresence>
              {lightboxImage && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setLightboxImage(null)}
                  className="fixed inset-0 z-[100] bg-[#060713]/90 backdrop-blur-xl flex items-center justify-center p-4 cursor-zoom-out"
                  dir={isAr ? "rtl" : "ltr"}
                >
                  {/* Top Close Button */}
                  <button
                    onClick={() => setLightboxImage(null)}
                    className="absolute top-6 right-6 p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all duration-300 transform hover:scale-105 cursor-pointer"
                  >
                    <X size={20} />
                  </button>

                  {/* Display Image */}
                  <motion.img
                    initial={{ scale: 0.95, y: 15 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 15 }}
                    transition={{ type: "spring", damping: 25, stiffness: 350 }}
                    src={lightboxImage}
                    alt={isAr ? "مشاهدة بملء الشاشة" : "Full screen photo view"}
                    className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10 select-none cursor-default"
                    onClick={(e) => e.stopPropagation()}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Emoji Picker Popover */}
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  ref={emojiPickerRef}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute bottom-16 right-2 md:right-4 z-40 w-72 md:w-80 h-64 bg-[#0e1021]/95 text-white rounded-2xl border border-indigo-500/30 shadow-[0_15px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl flex flex-col overflow-hidden"
                  dir={isAr ? "rtl" : "ltr"}
                >
                  {/* Category Tabs */}
                  <div className="flex border-b border-white/10 bg-black/40 p-1.5 gap-1 shrink-0 scrollbar-none overflow-x-auto">
                    {EMOJI_CATEGORIES.map((cat) => {
                      const catLabel =
                        cat.id === "space"
                          ? isAr
                            ? "فضاء 🪐"
                            : "Space 🪐"
                          : cat.id === "faces"
                            ? isAr
                              ? "وجوه 😂"
                              : "Faces 😂"
                            : cat.id === "hands"
                              ? isAr
                                ? "تفاعل 👍"
                                : "React 👍"
                              : isAr
                                ? "رموز ✨"
                                : "Symbols ✨";
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setEmojiTab(cat.id)}
                          className={cn(
                            "px-2.5 py-1 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer",
                            emojiTab === cat.id
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-100"
                              : "text-gray-400 hover:text-white hover:bg-white/5 scale-95",
                          )}
                        >
                          {catLabel}
                        </button>
                      );
                    })}
                  </div>

                  {/* Emoji Grid */}
                  <div className="flex-1 p-3 overflow-y-auto grid grid-cols-6 gap-2 content-start custom-scrollbar">
                    {EMOJI_CATEGORIES.find(
                      (c) => c.id === emojiTab,
                    )?.emojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => insertEmoji(emoji)}
                        className="text-2xl p-1.5 hover:bg-white/10 rounded-xl transition-all hover:scale-125 duration-150 active:scale-90 flex items-center justify-center cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {replyTo && (
                <motion.div
                  initial={{ opacity: 0, y: 10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: 10, height: 0 }}
                  className="mb-2 ms-4 me-16 flex items-center justify-between text-sm bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-2 text-indigo-300"
                >
                  <button
                    onClick={() => setReplyTo(null)}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                  <div className="flex items-center gap-2 flex-row-reverse overflow-hidden">
                    <Reply size={14} className="shrink-0" />
                    <span className="font-bold shrink-0">
                      رد على {replyTo.userName}:
                    </span>
                    <span className="truncate opacity-75">{replyTo.text}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className={cn("flex gap-2 items-end", isAr ? "flex-row-reverse" : "flex-row")}>
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() && !attachment}
                className="w-12 h-12 shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                <Send size={20} className={cn("-ml-1 text-white", !isAr && "rotate-180")} />
              </button>
              <div className={cn("flex-1 bg-black/40 border border-white/10 rounded-2xl flex items-center p-1 focus-within:border-indigo-500/50 focus-within:bg-black/60 transition-colors shadow-inner relative", isAr ? "flex-row-reverse" : "flex-row")}>
                <button
                  onClick={handlePlusClick}
                  className="w-10 h-10 shrink-0 flex items-center justify-center text-gray-500 hover:text-indigo-400 transition-colors hover:bg-white/5 rounded-xl cursor-pointer"
                >
                  <Plus size={20} />
                </button>
                <textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={isAr ? "اكتب رسالة للجميع... (Shift+Enter لسطر جديد)" : "Write a message to everyone... (Shift+Enter for new line)"}
                  className={cn("flex-1 bg-transparent border-none px-3 py-3 max-h-32 min-h-[44px] focus:outline-none text-white placeholder:text-gray-600 resize-none custom-scrollbar", isAr ? "text-right" : "text-left")}
                  dir={isAr ? "rtl" : "ltr"}
                  rows={1}
                  style={{ height: "auto" }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                  }}
                />
                <div className="flex shrink-0">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={cn(
                      "w-10 h-10 flex items-center justify-center transition-colors hover:bg-white/5 rounded-xl cursor-pointer",
                      showEmojiPicker
                        ? "text-indigo-400 bg-white/5"
                        : "text-gray-500 hover:text-indigo-400",
                    )}
                  >
                    <Smile size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PlanetIcon() {
  return <span className="text-xl inline-block -translate-y-0.5">🪐</span>;
}

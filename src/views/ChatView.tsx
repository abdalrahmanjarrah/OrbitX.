import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
  X,
  Heart,
  Share2,
  MessageSquare,
  ThumbsUp,
  Image,
  Paperclip,
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

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  text: string;
  timestamp: number;
}

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
  const [loading, setLoading] = useState(true);
  const [isFallbackMode, setIsFallbackMode] = useState(false);

  // Helper to load fallback messages from the local server REST API
  const loadFallbackMessages = async () => {
    try {
      const response = await fetch("/api/chat/messages");
      if (response.ok) {
        const data = await response.json();
        if (data && data.messages) {
          setMessages(data.messages);
        }
      }
    } catch (err) {
      console.error("Failed to load fallback messages:", err);
    }
  };

  // Expanded comments section state per-post
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

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

  // In-app success feedback
  const [toast, setToast] = useState<string | null>(null);

  // Custom delete confirmation modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Refs for custom elements
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

    if (!isImage && file.size > 1024 * 1024) {
      alert(
        isAr
          ? "حجم الملف كبير جداً! يجب أن يكون أقل من 1 ميغابايت لتخزينه بسلاسة في المحطة."
          : "File size is too large! It must be under 1MB to store it safely on the station."
      );
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;

      if (isImage) {
        const img = new window.Image();
        img.src = dataUrl;
        img.onload = () => {
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
                alert(isAr ? "فشل معالجة الصورة." : "Failed to process image.");
                setIsUploading(false);
                return;
              }
              const reader = new FileReader();
              reader.onload = (e) => {
                const compressed = e.target?.result as string;
                if (compressed.length > 700000) {
                  alert(
                    isAr
                      ? "الصورة كبيرة جداً حتى بعد الضغط. جرب صورة أصغر."
                      : "Image is too large even after compression. Please try a smaller image."
                  );
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
            0.3
          );
        };
        img.onerror = () => {
          if (file.size > 1024 * 1024) {
            alert(
              isAr
                ? "عذراً، فشل تحميل ومعالجة هذه الصورة الضخمة."
                : "Sorry, failed to load and process this large image."
            );
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

  // Load initial fallback messages on mount
  useEffect(() => {
    loadFallbackMessages().finally(() => {
      setLoading(false);
    });
  }, []);

  // Fetch posts sorted from newest to oldest via real-time subscription
  useEffect(() => {
    const q = query(
      collection(db, "global_chat"),
      orderBy("timestamp", "desc"),
      firestoreLimit(50)
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setIsFallbackMode(false);
        const msgs = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Message
        );

        if (msgs.length > prevCount.current && prevCount.current > 0) {
          const newestMsg = msgs[0];
          if (newestMsg && newestMsg.userId !== user.uid) {
            playSound("message");
          }
        }

        prevCount.current = msgs.length;
        setMessages(msgs);
        setLoading(false);
      },
      (e) => {
        console.warn("Firestore snapshot subscription failed (quota limit?), activating REST fallback mode:", e);
        setIsFallbackMode(true);
        loadFallbackMessages().finally(() => {
          setLoading(false);
        });
      }
    );
    return () => unsubscribe();
  }, [user.uid]);

  // REST polling fallback when Firestore subscription is blocked/offline
  useEffect(() => {
    if (!isFallbackMode) return;
    const interval = setInterval(() => {
      loadFallbackMessages();
    }, 4000);
    return () => clearInterval(interval);
  }, [isFallbackMode]);

  const handlePostMessage = async () => {
    if (!isChatEnabled && user.role !== "admin") {
      alert(
        isAr
          ? "الشات العام موقف حالياً من قبل الإدارة."
          : "Public chat is currently disabled by administrators."
      );
      return;
    }
    if (!newMessage.trim() && !attachment) return;
    if (newMessage.length > 500) {
      alert(
        isAr
          ? "الرسالة طويلة جداً! الحد الأقصى هو 500 حرف."
          : "Message is too long! The limit is 500 characters."
      );
      return;
    }
    const now = Date.now();
    if (now - lastMsgTime.current < 2000) {
      alert(
        isAr
          ? "الرجاء الانتظار قليلاً قبل نشر منشور آخر."
          : "Please wait a moment before publishing another post."
      );
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
          `[📎 ${isAr ? "تحميل الملف" : "Download File"}: ${attachment.name}](${attachment.dataUrl})`;
      }
    }

    const messageId = "msg_local_temp_" + Date.now();
    const messageData = {
      id: messageId,
      text: finalMessageText,
      userId: user.uid,
      userName: user.displayName,
      userPhoto: user.photoURL,
      userRankTitle: getAstronautRank(user.xp, undefined, lang).title,
      userRankColor: getAstronautRank(user.xp, undefined, lang).color,
      userRankIcon: getAstronautRank(user.xp, undefined, lang).icon,
      timestamp: Date.now(),
      type: "text",
      likes: [],
      comments: [],
    };

    setNewMessage("");
    setAttachment(null);
    setShowEmojiPicker(false);

    try {
      // Optimistic state addition
      setMessages((prev) => [messageData as any, ...prev]);

      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/chat/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          text: finalMessageText,
          userName: user.displayName,
          userPhoto: user.photoURL,
          userRankTitle: getAstronautRank(user.xp, undefined, lang).title,
          userRankColor: getAstronautRank(user.xp, undefined, lang).color,
          userRankIcon: getAstronautRank(user.xp, undefined, lang).icon,
          type: "text",
        }),
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData && resData.message) {
          setMessages((prev) =>
            prev.map((m) => (m.id === messageId ? resData.message : m))
          );
        }
        showToast(isAr ? "تم نشر المنشور كصورة نجمية!" : "Post published to the cosmos!");
      } else {
        // Direct write fallback
        await addDoc(collection(db, "global_chat"), {
          ...messageData,
          timestamp: serverTimestamp(),
        });
        showToast(isAr ? "تم نشر المنشور كصورة نجمية!" : "Post published to the cosmos!");
      }
    } catch (e: any) {
      console.warn("API write failed, trying direct Firestore write:", e.message || e);
      try {
        await addDoc(collection(db, "global_chat"), {
          ...messageData,
          timestamp: serverTimestamp(),
        });
        showToast(isAr ? "تم نشر المنشور كصورة نجمية!" : "Post published to the cosmos!");
      } catch (dbErr) {
        handleFirestoreError(dbErr, OperationType.WRITE, "global_chat");
        showToast(isAr ? "فشل النشر الفضائي بسبب حدود الحصص اليومية." : "Posting failed due to database limit bounds.");
      }
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    // Optimistic delete
    setMessages((prev) => prev.filter((msg) => msg.id !== msgId));

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/chat/delete/${msgId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
      });
      if (response.ok) {
        showToast(isAr ? "تم حذف المنشور بنجاح!" : "Post has been deleted.");
      } else {
        await deleteDoc(doc(db, "global_chat", msgId)).catch(() => null);
        showToast(isAr ? "تم حذف المنشور بنجاح!" : "Post has been deleted.");
      }
    } catch (e: any) {
      console.warn("API delete failed, trying direct delete:", e.message || e);
      try {
        await deleteDoc(doc(db, "global_chat", msgId));
        showToast(isAr ? "تم حذف المنشور بنجاح!" : "Post has been deleted.");
      } catch (dbErr) {
        showToast(isAr ? "فشل حذف المنشور." : "Failed to delete post.");
      }
    }
  };

  const handleClearAllPosts = async () => {
    setDeleteConfirmId(null);
    setMessages([]); // Optimistically clear all instantly so screen never turns black
    showToast(isAr ? "جاري إعادة بناء الفضاء وتصفية المنشورات..." : "Clearing space and sweeping posts...");
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/chat/delete-all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        showToast(isAr ? "تم تنظيف الساحة الفضائية بالكامل بنجاح!" : "Galaxy feed cleared successfully!");
      } else {
        const promises = messages.map((msg) => deleteDoc(doc(db, "global_chat", msg.id)).catch(() => null));
        await Promise.all(promises);
        showToast(isAr ? "تم تنظيف الساحة الفضائية بالكامل بنجاح!" : "Galaxy feed cleared successfully!");
      }
    } catch (e: any) {
      console.warn("API delete-all failed, trying direct batch delete:", e.message || e);
      try {
        const promises = messages.map((msg) => deleteDoc(doc(db, "global_chat", msg.id)));
        await Promise.all(promises);
        showToast(isAr ? "تم تنظيف الساحة الفضائية بالكامل بنجاح!" : "Galaxy feed cleared successfully!");
      } catch (dbErr) {
        showToast(isAr ? "تم تصفية الساحة الفضائية محلياً." : "Galaxy feed cleared locally.");
      }
    }
  };

  // Liking a post
  const handleLikePost = async (postId: string, currentLikes: string[] = []) => {
    const hasLiked = currentLikes.includes(user.uid);
    const updatedLikes = hasLiked
      ? currentLikes.filter((id) => id !== user.uid)
      : [...currentLikes, user.uid];

    // Optimistic update
    setMessages((prev) =>
      prev.map((msg) => (msg.id === postId ? { ...msg, likes: updatedLikes } : msg))
    );

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/chat/like/${postId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
      });
      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }
    } catch (e) {
      console.warn("REST like failed, falling back to direct write:", e);
      try {
        await updateDoc(doc(db, "global_chat", postId), { likes: updatedLikes });
        
        // Direct notification fallback
        const post = messages.find((m) => m.id === postId);
        if (post && post.userId && post.userId !== user.uid && !hasLiked) {
          await addDoc(collection(db, "users", post.userId, "notifications"), {
            type: "like",
            content: isAr 
              ? `أعجب ${user.displayName} بمنشورك في الشات الكوني!` 
              : `${user.displayName} liked your post in the cosmic chat!`,
            read: false,
            timestamp: serverTimestamp()
          }).catch(() => {});
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Commenting on a post
  const handleAddComment = async (postId: string, commentsList: any[] = []) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    const tempCommentId = "cmt_temp_" + Date.now();
    const newComment: Comment = {
      id: tempCommentId,
      userId: user.uid,
      userName: user.displayName,
      userPhoto: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
      text: text,
      timestamp: Date.now(),
    };

    const updatedComments = [...commentsList, newComment];

    // Optimistic UI update
    setMessages((prev) =>
      prev.map((msg) => (msg.id === postId ? { ...msg, comments: updatedComments } : msg))
    );
    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/chat/comment/${postId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({ text }),
      });
      if (response.ok) {
        const resData = await response.json();
        if (resData && resData.comments) {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === postId ? { ...msg, comments: resData.comments } : msg))
          );
        }
      } else {
        throw new Error("HTTP error " + response.status);
      }
    } catch (e) {
      console.warn("REST comment failed, falling back to direct write:", e);
      try {
        await updateDoc(doc(db, "global_chat", postId), {
          comments: updatedComments.map(c => c.id === tempCommentId ? { ...c, id: Math.random().toString(36).substring(2, 9) + Date.now() } : c),
        });

        // Direct notification fallback
        const post = messages.find((m) => m.id === postId);
        if (post && post.userId && post.userId !== user.uid) {
          await addDoc(collection(db, "users", post.userId, "notifications"), {
            type: "reply",
            content: isAr 
              ? `علق ${user.displayName} على منشورك: "${text.substring(0, 30)}${text.length > 30 ? "..." : ""}"`
              : `${user.displayName} commented on your post: "${text.substring(0, 30)}${text.length > 30 ? "..." : ""}"`,
            read: false,
            timestamp: serverTimestamp()
          }).catch(() => {});
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string, commentsList: any[]) => {
    const updated = commentsList.filter((c) => c.id !== commentId);

    // Optimistic UI update
    setMessages((prev) =>
      prev.map((msg) => (msg.id === postId ? { ...msg, comments: updated } : msg))
    );

    try {
      const idToken = await auth.currentUser?.getIdToken();
      await fetch(`/api/chat/comment/delete/${postId}/${commentId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
      });
    } catch (e) {
      console.error("REST comment delete failed, falling back to direct write:", e);
      try {
        await updateDoc(doc(db, "global_chat", postId), { comments: updated });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleShareClick = (msgText: string) => {
    // Strip markdown image urls for cleaner share
    const cleanText = msgText.replace(/!\[.*?\]\(.*?\)/g, "").trim();
    navigator.clipboard.writeText(cleanText);
    showToast(isAr ? "تم نسخ المنشور إلى الحافظة بنجاح!" : "Post text copied to clipboard!");
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div
      className="max-w-4xl mx-auto flex flex-col bg-transparent shadow-none"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Toast alert overlay */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[110] bg-[#1a1c38] border-2 border-indigo-500/50 text-white font-bold px-6 py-3 rounded-2xl shadow-[0_10px_30px_rgba(99,102,241,0.25)] flex items-center gap-2"
          >
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-black/20 rounded-3xl mb-6 backdrop-blur-md relative z-10">
        <div className="flex items-center gap-4">
          {user.role === "admin" && (
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  try {
                    await setDoc(
                      doc(db, "system", "settings"),
                      { isChatEnabled: !isChatEnabled },
                      { merge: true }
                    );
                  } catch (e) {
                    // handle errors silently in ui
                  }
                }}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 shadow-lg cursor-pointer",
                  !isChatEnabled
                    ? "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
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
              <button
                onClick={() => setDeleteConfirmId("ALL_MESSAGES")}
                className="text-xs px-3 py-1.5 rounded-xl font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/25 transition-all flex items-center gap-1.5 shadow-lg cursor-pointer"
                title={isAr ? "حذف جميع المنشورات من المحطة" : "Clear All Posts"}
              >
                <Trash2 size={13} />
                <span>{isAr ? "مسح الساحة" : "Clear Feed"}</span>
              </button>
            </div>
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
          <h2 className="text-xl md:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-white flex items-center gap-2">
            {isAr ? "منشورات رواد الفضاء" : "Astronaut Feed"}
            <span className="text-xl">🪐</span>
          </h2>
        </div>
      </div>

      {/* FEED LIST & COMPOSE */}
      <div className="space-y-6 pb-20">
        {/* Compose Box (At the Top) */}
        {(!isChatEnabled && user.role !== "admin") ? (
          <div className="w-full bg-red-500/10 border border-red-500/30 rounded-3xl px-6 py-4 text-center text-red-400 font-bold flex items-center justify-center gap-2 shadow-lg">
            <Shield size={18} />
            {isAr ? "تم إغلاق ساحة النشر مؤقتاً من قبل الإدارة" : "Feed postings are currently disabled by management"}
          </div>
        ) : (
          <div className="bg-[#0e1021]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 shadow-2xl relative overflow-visible">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,application/pdf,text/plain"
            />

            <div className={cn("flex gap-3 items-start", isAr ? "flex-row" : "flex-row-reverse")}>
              {/* Text Inputs */}
              <div className="flex-1 space-y-3">
                <div className={cn("flex gap-3", isAr ? "flex-row" : "flex-row-reverse")}>
                  <img
                    src={user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`}
                    className="w-10 h-10 rounded-xl border border-white/10 shrink-0 bg-[#0a0b16]"
                    alt={user.displayName}
                  />
                  <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={isAr ? "اكتب منشوراً جديداً ليراه جميع المستكشفين..." : "Write a new post for all explorers to see..."}
                    className={cn("flex-1 bg-transparent border-none py-2 text-white placeholder:text-gray-500 text-base focus:outline-none resize-none custom-scrollbar min-h-[60px] max-h-48", isAr ? "text-right" : "text-left")}
                    dir={isAr ? "rtl" : "ltr"}
                    rows={2}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = "auto";
                      target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
                    }}
                  />
                </div>

                {/* Loader status */}
                {isUploading && (
                  <div className="text-xs text-indigo-400 font-bold flex items-center gap-1.5 justify-start animate-pulse px-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                    {isAr ? "جاري تحميل ومعالجة الملف..." : "Uploading and processing file..."}
                  </div>
                )}

                {/* Selected Attachment Preview */}
                {attachment && (
                  <div className="flex items-center justify-between text-sm bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-3 text-gray-300 relative group backdrop-blur-md">
                    <div className="flex items-center gap-3">
                      {attachment.type === "image" ? (
                        <img
                          src={attachment.dataUrl}
                          className="w-12 h-12 rounded-xl object-cover border border-white/10 cursor-pointer hover:opacity-80 transition-all"
                          title={isAr ? "اضغط لتكبير الصورة" : "Click to enlarge image"}
                          onClick={() => setLightboxImage(attachment.dataUrl)}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-semibold text-xs animate-bounce">
                          {attachment.type === "pdf" ? "PDF" : "📁"}
                        </div>
                      )}
                      <div className={isAr ? "text-right" : "text-left"}>
                        <p className="text-xs font-bold text-white max-w-[200px] truncate">
                          {attachment.name}
                        </p>
                        <p className="text-[10px] text-indigo-300 font-semibold">
                          {isAr ? "جاهز للإرفاق بالمنشور" : "Ready to attach to post"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setAttachment(null)}
                      className="p-1.5 hover:bg-white/10 inline-flex items-center justify-center rounded-full transition-colors text-red-500 hover:text-red-400"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions Partition */}
            <div className="border-t border-white/5 mt-4 pt-3 flex flex-wrap gap-2 items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Media Attachment buttons */}
                <button
                  type="button"
                  onClick={handlePlusClick}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Camera size={14} className="text-indigo-400" />
                  <span>{isAr ? "إرفاق وسائط" : "Attach Media"}</span>
                </button>

                {/* Emojis toggle */}
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={cn(
                    "px-4 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-2 cursor-pointer",
                    showEmojiPicker
                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-400"
                      : "bg-white/5 border-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
                  )}
                >
                  <Smile size={14} className="text-yellow-400" />
                  <span>{isAr ? "رموز" : "Emojis"}</span>
                </button>
              </div>

              {/* POST BTN */}
              <button
                onClick={handlePostMessage}
                disabled={!newMessage.trim() && !attachment}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/25 transition-all disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed cursor-pointer"
              >
                <Send size={14} className={isAr ? "" : "rotate-180"} />
                <span>{isAr ? "نشر" : "Post"}</span>
              </button>
            </div>

            {/* Inline Emoji Panel */}
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full mt-4 bg-black/45 border border-indigo-500/20 rounded-2xl flex flex-col overflow-hidden shadow-inner"
                >
                  {/* Tabs */}
                  <div className="flex border-b border-white/5 bg-black/20 p-2 gap-1.5 shrink-0 overflow-x-auto scrollbar-none">
                    {EMOJI_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setEmojiTab(cat.id)}
                        className={cn(
                          "px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer",
                          emojiTab === cat.id
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                        )}
                      >
                        {cat.id === "space"
                          ? isAr ? "فضاء 🪐" : "Space 🪐"
                          : cat.id === "faces"
                            ? isAr ? "وجوه 😂" : "Faces 😂"
                            : cat.id === "hands"
                              ? isAr ? "تفاعل 👍" : "React 👍"
                              : isAr ? "رموز ✨" : "Symbols ✨"}
                      </button>
                    ))}
                  </div>
                  {/* Grid */}
                  <div className="p-3 max-h-[160px] overflow-y-auto grid grid-cols-8 md:grid-cols-12 gap-1.5 content-start custom-scrollbar">
                    {EMOJI_CATEGORIES.find((c) => c.id === emojiTab)?.emojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => insertEmoji(emoji)}
                        className="text-2xl p-1.5 hover:bg-white/10 rounded-xl transition-all hover:scale-115 flex items-center justify-center cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* POST FEED LIST */}
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-[#0e1021]/50 border border-white/5 rounded-3xl p-6 space-y-4 animate-pulse relative"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/5 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-white/5 rounded-full w-24" />
                    <div className="h-3 bg-white/5 rounded-full w-32" />
                  </div>
                </div>
                <div className="h-20 bg-white/5 rounded-2xl w-full" />
                <div className="h-6 bg-white/5 rounded-full w-48" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20 bg-[#0e1021]/40 border border-dashed border-white/10 rounded-3xl p-8 max-w-lg mx-auto flex flex-col items-center justify-center gap-4">
            <MessageSquare className="w-16 h-16 text-gray-650 animate-bounce" />
            <h3 className="text-lg font-black text-white">
              {isAr ? "الساحة فارغة تماماً" : "The galaxy is quiet"}
            </h3>
            <p className="text-gray-500 text-sm">
              {isAr ? "كن أول من ينشئ منشوراً فضائياً ويتركه يعوم في المحطة!" : "Be the first to publish a cosmic post in the station!"}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.userId === user.uid;
            const postLikes = (msg as any).likes || [];
            const hasLiked = postLikes.includes(user.uid);
            const postComments: Comment[] = (msg as any).comments || [];

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0e1021]/60 border border-white/10 rounded-3xl p-5 md:p-6 shadow-xl relative overflow-hidden group hover:border-indigo-500/20 hover:bg-[#0e1021]/85 transition-all duration-300 flex flex-col gap-4"
              >
                {/* Subtle soft blue/indigo cosmic spotlight effect trailing behind the card */}
                <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 blur-3xl rounded-full pointer-events-none" />

                {/* POST HEADER: User credentials + action bar on the right */}
                <div className="flex items-center justify-between relative z-10 gap-4">
                  <div className={cn("flex items-center gap-3.5", isAr ? "text-right" : "text-left")}>
                    <button
                      onClick={() => onSelectUser(msg.userId)}
                      className="relative shrink-0"
                    >
                      <div className="absolute -inset-0.5 bg-gradient-to-b from-indigo-500/40 to-purple-500/40 rounded-xl opacity-0 hover:opacity-100 transition-opacity blur-xs" />
                      <img
                        src={msg.userPhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.userId}`}
                        className="w-11 h-11 rounded-xl relative z-10 border border-white/10 object-cover bg-[#0a0b16] shadow-md"
                        alt={msg.userName}
                        referrerPolicy="no-referrer"
                      />
                    </button>
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          onClick={() => onSelectUser(msg.userId)}
                          className="font-black text-sm text-gray-100 hover:text-indigo-400 transition-colors"
                        >
                          {msg.userName}
                        </button>
                        {msg.userRankIcon && (
                          <span className="text-xs" title={msg.userRankTitle}>
                            {msg.userRankIcon}
                          </span>
                        )}
                        {msg.userRankTitle && (
                          <span
                            className={cn(
                              "text-[9px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/5 border border-white/5 shadow-inner scale-95",
                              msg.userRankColor
                            )}
                          >
                            {msg.userRankTitle}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                        {(() => {
                          if (!msg.timestamp) return isAr ? "الآن" : "Now";
                          try {
                            let date: Date;
                            if (typeof msg.timestamp.toDate === "function") {
                              date = msg.timestamp.toDate();
                            } else if (typeof msg.timestamp === "number") {
                              date = new Date(msg.timestamp);
                            } else if (msg.timestamp.seconds) {
                              date = new Date(msg.timestamp.seconds * 1000);
                            } else {
                              date = new Date(msg.timestamp);
                            }
                            return date.toLocaleString(isAr ? "ar-EG" : "en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            });
                          } catch (err) {
                            return isAr ? "الآن" : "Now";
                          }
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Actions - Share next to Delete */}
                  <div className="flex items-center gap-1.5 shrink-0 z-10">
                    {/* Share icon button */}
                    <button
                      onClick={() => handleShareClick(msg.text)}
                      className="p-1.5 rounded-xl bg-white/5 text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10 border border-white/5 hover:border-indigo-500/20 transition-all cursor-pointer shadow-sm relative"
                      title={isAr ? "مشاركة" : "Share"}
                    >
                      <Share2 size={13} />
                    </button>

                    {/* Delete icon button */}
                    {(user.role === "admin" || isMe) && (
                      <button
                        onClick={() => setDeleteConfirmId(msg.id)}
                        className="p-1.5 rounded-xl bg-white/5 text-gray-400 hover:text-red-400 hover:bg-red-500/15 border border-white/5 hover:border-red-500/25 transition-all cursor-pointer shadow-sm"
                        title={isAr ? "حذف المنشور" : "Delete Post"}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* POST CONTENT */}
                <div className="text-gray-100 text-[15px] leading-relaxed relative z-10 markdown-body break-words select-text px-1">
                  <Markdown
                    components={{
                      img: ({ ...props }) => {
                        if (!props.src) return null;
                        return (
                          <div className="w-full max-h-[440px] rounded-2xl overflow-hidden border border-white/10 mt-3 relative group/image bg-black/40 flex items-center justify-center">
                            <img
                              {...props}
                              src={props.src || undefined}
                              className="max-h-[440px] max-w-full rounded-2xl pointer-events-auto cursor-zoom-in object-contain select-none transition-transform hover:scale-[1.01]"
                              referrerPolicy="no-referrer"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (props.src) setLightboxImage(props.src);
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity pointer-events-none flex items-end p-4">
                              <span className="text-[10px] text-white/50 backdrop-blur-md bg-black/40 px-3 py-1 rounded-full border border-white/10">
                                {isAr ? "انقر لتكبير الصورة" : "Click to view full screen"}
                              </span>
                            </div>
                          </div>
                        );
                      },
                      a: ({ ...props }) => {
                        const isDataUrl = props.href?.startsWith("data:");
                        return (
                          <a
                            {...props}
                            download={isDataUrl ? props.children?.toString() || "file" : undefined}
                            className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-300 font-bold px-4 py-2 rounded-2xl border border-indigo-500/15 hover:bg-indigo-500/20 hover:text-indigo-200 transition-all mt-3 max-w-full truncate text-xs"
                          >
                            <Paperclip size={12} className="text-indigo-400 shrink-0" />
                            <span className="truncate">{props.children}</span>
                          </a>
                        );
                      },
                    }}
                  >
                    {msg.text}
                  </Markdown>
                </div>

                {/* POST FOOTER: Simple Like & Comment button stats bar */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/5 relative z-10 mt-1">
                  <div className="flex items-center gap-2">
                    {/* Simplified Liking Interaction */}
                    <button
                      onClick={() => handleLikePost(msg.id, postLikes)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all font-extrabold text-xs cursor-pointer border",
                        hasLiked
                          ? "bg-red-500/10 text-red-400 border-red-500/20 shadow-md shadow-red-500/5 shrink-0"
                          : "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border-white/5 shrink-0"
                      )}
                      title={isAr ? "أعجبني" : "Like"}
                    >
                      <Heart size={14} className={cn(hasLiked ? "fill-red-400 stroke-red-400" : "stroke-current")} />
                      <span>{postLikes.length}</span>
                    </button>

                    {/* Comment Stats toggling comments expand */}
                    <button
                      onClick={() => {
                        setExpandedComments((prev) => ({
                          ...prev,
                          [msg.id]: !prev[msg.id],
                        }));
                      }}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all font-extrabold text-xs cursor-pointer border shrink-0",
                        expandedComments[msg.id]
                          ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                          : "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border-white/5"
                      )}
                      title={isAr ? "التعليقات" : "Comments"}
                    >
                      <MessageSquare size={14} />
                      <span>{postComments.length}</span>
                    </button>
                  </div>

                  {postComments.length > 0 && !expandedComments[msg.id] && (
                    <button
                      onClick={() => {
                        setExpandedComments((prev) => ({ ...prev, [msg.id]: true }));
                      }}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline transition-all cursor-pointer font-bold shrink-0"
                    >
                      {isAr ? `عرض ${postComments.length} تعليقات` : `View ${postComments.length} comments`}
                    </button>
                  )}
                </div>

                {/* EXPANDABLE COMMENTS WINDOW */}
                <AnimatePresence>
                  {expandedComments[msg.id] && postComments.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-2.5 overflow-hidden border-t border-white/5 pt-3 mt-1.5"
                    >
                      <div className="space-y-2.5 max-h-56 overflow-y-auto custom-scrollbar pr-1 pl-1">
                        {postComments.map((comment) => (
                          <div
                            key={comment.id}
                            className="bg-black/20 rounded-2xl p-3 border border-white/5 hover:bg-black/35 transition-colors relative"
                          >
                            <div className="flex items-start justify-between gap-3 mb-1">
                              <div className="flex items-center gap-2">
                                <img
                                  src={comment.userPhoto}
                                  className="w-6.5 h-6.5 rounded-lg border border-white/5 bg-gray-950"
                                  alt={comment.userName}
                                />
                                <div className={cn("text-[11px] font-black", comment.userId === user.uid ? "text-indigo-400" : "text-gray-200")}>
                                  {comment.userName}
                                </div>
                              </div>
                              <span className="text-[8px] text-gray-500 font-mono">
                                {new Date(comment.timestamp).toLocaleTimeString(isAr ? "ar-EG" : "en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <p className="text-xs text-gray-300 leading-relaxed pl-1 whitespace-pre-wrap select-text">
                              {comment.text}
                            </p>

                            {/* Delete Comment */}
                            {(user.role === "admin" || comment.userId === user.uid) && (
                              <button
                                onClick={() => handleDeleteComment(msg.id, comment.id, postComments)}
                                className="absolute bottom-2 left-2 p-1 text-gray-600 hover:text-red-400 transition-colors rounded hover:bg-red-500/5 cursor-pointer"
                                title={isAr ? "حذف التعليق" : "Delete Comment"}
                              >
                                <Trash2 size={10} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* PERMANENT INLINE COMMENT BAR: caption "أضف تعليقًا" under the post actions */}
                <div className="flex gap-2.5 items-center mt-1 pt-3 border-t border-white/5 relative z-10 w-full">
                  <img
                    src={user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`}
                    className="w-8 h-8 rounded-lg border border-white/10 shrink-0 bg-[#0a0b16] shadow-inner object-cover"
                    alt={user.displayName}
                  />
                  <div className="flex-1 bg-black/45 border border-white/10 rounded-2xl flex items-center p-1 focus-within:border-indigo-500/50 transition-all shadow-inner relative overflow-visible">
                    <input
                      type="text"
                      value={commentInputs[msg.id] || ""}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({ ...prev, [msg.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddComment(msg.id, postComments);
                        }
                      }}
                      placeholder={isAr ? "أضف تعليقًا..." : "Add a comment..."}
                      className="flex-1 bg-transparent border-none text-xs px-3 py-2 focus:outline-none text-white placeholder:text-gray-500 min-w-0"
                    />
                    <button
                      onClick={() => handleAddComment(msg.id, postComments)}
                      disabled={!(commentInputs[msg.id] || "").trim()}
                      className="p-1.5 bg-indigo-650 hover:bg-indigo-500 text-white rounded-xl transition-all disabled:opacity-30 cursor-pointer text-center flex items-center justify-center shrink-0"
                    >
                      <Send size={11} className={isAr ? "" : "rotate-180"} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && typeof document !== "undefined" && createPortal(
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmId(null)}
              className="absolute inset-0 bg-[#060713]/80 backdrop-blur-md cursor-pointer z-40"
            />
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-50 w-full max-w-sm bg-[#0e1021] border border-red-500/25 p-5 md:p-6 rounded-3xl shadow-[0_20px_50px_rgba(239,68,68,0.18)] text-center flex flex-col gap-4 pointer-events-auto"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400 shrink-0">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-white mb-1.5">
                  {deleteConfirmId === "ALL_MESSAGES"
                    ? isAr ? "تطهير الساحة الفضائية؟" : "Clear Cosmic Feed?"
                    : isAr ? "حذف المنشور؟" : "Delete Post?"}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed font-sans">
                  {deleteConfirmId === "ALL_MESSAGES"
                    ? isAr
                      ? "هل أنت متأكد تماماً من رغبتك في حذف جميع المنشورات من الفضاء؟ هذا الإجراء فوري ولا يمكن التراجع عنه."
                      : "Are you absolutely sure you want to delete all posts from the feed? This action is immediate and permanent."
                    : isAr
                      ? "هل أنت متأكد من رغبتك في حذف هذا المنشور؟ لا يمكن التراجع عن هذه الخطوة في الفضاء الخارجي."
                      : "Are you sure you want to delete this post? This step cannot be undone in deep space."}
                </p>
              </div>
              <div className="flex gap-2.5 justify-center">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4.5 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs transition-all cursor-pointer"
                >
                  {isAr ? "إلغاء التراجع" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    const targetId = deleteConfirmId;
                    setDeleteConfirmId(null); // Close modal first so progress toast is clean and modal disappears
                    if (targetId === "ALL_MESSAGES") {
                      await handleClearAllPosts();
                    } else {
                      await handleDeleteMessage(targetId);
                    }
                  }}
                  className="px-4.5 py-2 rounded-xl bg-red-650 hover:bg-red-500 text-white font-black text-xs transition-all cursor-pointer shadow-md shadow-red-650/15"
                >
                  {deleteConfirmId === "ALL_MESSAGES"
                    ? isAr ? "نعم، تطهير الكل" : "Yes, Clear All"
                    : isAr ? "تأكيد الحذف" : "Confirm Delete"}
                </button>
              </div>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxImage && typeof document !== "undefined" && createPortal(
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-[99999] bg-[#060713]/90 backdrop-blur-xl flex items-center justify-center p-4 cursor-zoom-out"
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-6 right-6 p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all duration-300 pointer-events-auto cursor-pointer"
            >
              <X size={20} />
            </button>

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
          </motion.div>,
          document.body
        )}
      </AnimatePresence>
    </div>
  );
}

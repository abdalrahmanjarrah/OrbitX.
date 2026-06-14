import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc, getDoc, arrayRemove, deleteField, deleteDoc, collection, addDoc } from "firebase/firestore";
import * as admin from "firebase-admin";
import { initializeApp as initializeAdminApp, getApps as getAdminApps } from "firebase-admin/app";
import { getFirestore as getAdminFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth as getAdminAuth } from "firebase-admin/auth";

dotenv.config();

// Initialize Firebase for server-side cleanups
const firebaseConfig = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8")
);
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Admin globally once
let adminDb: any;
try {
  let adminApp;
  if (getAdminApps().length === 0) {
    adminApp = initializeAdminApp({
      projectId: firebaseConfig.projectId,
    });
  } else {
    adminApp = getAdminApps()[0];
  }
  adminDb = getAdminFirestore(adminApp, firebaseConfig.firestoreDatabaseId);
  console.log("[SYSTEM] Firebase Admin initialized globally on database:", firebaseConfig.firestoreDatabaseId);
} catch (e) {
  console.log("[SYSTEM] Firebase Admin already initialized. Reusing connection.", e);
  adminDb = getAdminFirestore(undefined as any, firebaseConfig.firestoreDatabaseId);
}

// Local JSON file and memory cache for fallback in case of Firestore quota limits or downtime
const CACHE_FILE = path.join(process.cwd(), "global_chat_cache.json");
let localChatCache: any[] = [];
let lastCacheFetchTime = 0;
const CACHE_TTL = 15000; // 15 seconds rate-limiting / offloading cache TTL
let isFirestoreAdminPermitted = true; // Dynamically disable server-side Firestore on permission issues to keep logs clean

// Helper to save cache to disk
function saveChatCacheToDisk() {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(localChatCache, null, 2), "utf8");
  } catch (e) {
    console.error("[SYSTEM] Error saving chat cache to disk:", e);
  }
}

// Helper to load cache from disk
function loadChatCacheFromDisk() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, "utf8");
      localChatCache = JSON.parse(data);
      console.log(`[SYSTEM] Loaded ${localChatCache.length} cached chat messages from disk.`);
    } else {
      localChatCache = [];
      console.log("[SYSTEM] No local chat cache found, starting fresh.");
    }
  } catch (e) {
    console.error("[SYSTEM] Error reading chat cache from disk:", e);
    localChatCache = [];
  }
}
loadChatCacheFromDisk();

// Populate cache from Firestore on startup if Firestore is functional
async function syncCacheFromFirestoreOnBoot() {
  try {
    console.log("[SYSTEM] Syncing local feed cache from Firestore...");
    const snapshot = await adminDb.collection("global_chat")
      .orderBy("timestamp", "desc")
      .limit(100)
      .get();
    
    if (!snapshot.empty) {
      const fetched: any[] = [];
      snapshot.forEach((docSnap: any) => {
        const data = docSnap.data();
        let ts = data.timestamp;
        // Handle firestore Timestamp objects
        if (ts && typeof ts.toDate === "function") {
          ts = ts.toDate().getTime();
        } else if (ts && (ts._seconds || ts.seconds)) {
          const secs = ts._seconds || ts.seconds;
          const nsecs = ts._nanoseconds || ts.nanoseconds || 0;
          ts = secs * 1000 + nsecs / 1000000;
        } else if (typeof ts === "string") {
          ts = new Date(ts).getTime();
        } else if (!ts) {
          ts = Date.now();
        }
        
        fetched.push({
          id: docSnap.id,
          ...data,
          timestamp: ts,
        });
      });
      localChatCache = fetched;
      saveChatCacheToDisk();
      console.log(`[SYSTEM] Successfully synced ${fetched.length} posts from Firestore.`);
    }
  } catch (error: any) {
    const errorStr = String(error.message || error);
    const isPermissionOrQuota = errorStr.includes("PERMISSION_DENIED") || 
                                errorStr.includes("permission-denied") || 
                                errorStr.includes("7") ||
                                errorStr.toLowerCase().includes("quota") ||
                                errorStr.toLowerCase().includes("resource-exhausted") ||
                                errorStr.toLowerCase().includes("exhausted") ||
                                errorStr.toLowerCase().includes("limit");
    if (isPermissionOrQuota) {
      isFirestoreAdminPermitted = false;
      console.log("[SYSTEM] Firestore Admin SDK lacks permission or quota is exceeded. Switched server to high-performance local fallback storage.");
    } else {
      console.warn("[SYSTEM] Firestore sync on boot failed. Using existing disk backup.", errorStr);
    }
  }
}
syncCacheFromFirestoreOnBoot();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Helper to verify ID token and return user info
  async function verifyUserToken(req: express.Request) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    const token = authHeader.split("Bearer ")[1];
    try {
      const decodedToken = await getAdminAuth().verifyIdToken(token);
      return decodedToken;
    } catch (e) {
      console.error("[Auth] Error verifying user token:", e);
      return null;
    }
  }

  // API Route to fetch messages (Highly durable fallback)
  app.get("/api/chat/messages", async (req, res) => {
    const now = Date.now();
    if (isFirestoreAdminPermitted && (now - lastCacheFetchTime > CACHE_TTL)) {
      try {
        const snapshot = await adminDb.collection("global_chat")
          .orderBy("timestamp", "desc")
          .limit(100)
          .get();
        
        if (!snapshot.empty) {
          const fetched: any[] = [];
          snapshot.forEach((docSnap: any) => {
            const data = docSnap.data();
            let ts = data.timestamp;
            if (ts && typeof ts.toDate === "function") {
              ts = ts.toDate().getTime();
            } else if (ts && (ts._seconds || ts.seconds)) {
              ts = (ts._seconds || ts.seconds) * 1000;
            } else if (!ts) {
              ts = Date.now();
            }
            fetched.push({
              id: docSnap.id,
              ...data,
              timestamp: ts,
            });
          });
          localChatCache = fetched;
          lastCacheFetchTime = now;
          saveChatCacheToDisk();
          console.log("[API] Refreshed local global_chat cache from Firestore.");
        }
      } catch (e: any) {
        const errorStr = String(e.message || e);
        const isPermissionOrQuota = errorStr.includes("PERMISSION_DENIED") || 
                                    errorStr.includes("permission-denied") || 
                                    errorStr.includes("7") ||
                                    errorStr.toLowerCase().includes("quota") ||
                                    errorStr.toLowerCase().includes("resource-exhausted") ||
                                    errorStr.toLowerCase().includes("exhausted") ||
                                    errorStr.toLowerCase().includes("limit");
        if (isPermissionOrQuota) {
          isFirestoreAdminPermitted = false;
          console.log("[API] Firestore Admin SDK permission or quota boundary. Defaulting Server REST API to high-performance local fallback storage.");
        } else {
          console.warn("[API] GET /api/chat/messages Firestore fetch failed (using local cache):", errorStr);
        }
      }
    } else {
      // Throttle logged to reduce output noise, but active in offloading
    }
    res.json({ success: true, messages: localChatCache });
  });

  // API Route to post a message (Durable fallback)
  app.post("/api/chat/post", async (req, res) => {
    try {
      const user = await verifyUserToken(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { text, userName, userPhoto, userRankTitle, userRankColor, userRankIcon, type } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Empty message" });
      }

      const messageId = "msg_local_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
      const messageData = {
        id: messageId,
        text,
        userId: user.uid,
        userName: userName || user.name || "Astronaut",
        userPhoto: userPhoto || user.picture || "",
        userRankTitle: userRankTitle || "",
        userRankColor: userRankColor || "",
        userRankIcon: userRankIcon || "",
        timestamp: Date.now(),
        type: type || "text",
        likes: [],
        comments: [],
      };

      // Add to local cache first
      localChatCache.unshift(messageData);
      saveChatCacheToDisk();

      if (isFirestoreAdminPermitted) {
        try {
          await adminDb.collection("global_chat").doc(messageId).set({
            ...messageData,
            timestamp: FieldValue.serverTimestamp()
          });
        } catch (err: any) {
          console.warn("[API-DB] Foreground set failed:", err.message || err);
          const errStr = String(err.message || err);
          if (errStr.includes("PERMISSION_DENIED") || errStr.toLowerCase().includes("quota") || errStr.includes("7")) {
            isFirestoreAdminPermitted = false;
          }
          throw err;
        }
      } else {
        throw new Error("Firestore Admin SDK is currently disabled (Perm/Quota Limits).");
      }

      res.json({ success: true, message: messageData });
    } catch (error: any) {
      console.error("[API] Error in post messages:", error);
      res.status(500).json({ error: error.message || "Failed to post message" });
    }
  });

  // API Route to clear all posts (Administrative only)
  app.post("/api/chat/delete-all", async (req, res) => {
    try {
      const user = await verifyUserToken(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const email = user.email || "";
      const isAdmin = (
        email === "lumafashionhq@gmail.com" ||
        email === "abdalrahmanjarrah94@gmail.com" ||
        email === "abdalrahmanjarrah1@gmail.com"
      );

      if (!isAdmin) {
        return res.status(403).json({ error: "Only administrators can clear the entire chat feed" });
      }

      console.log(`[API] Admin ${email} requested static chat database purge.`);
      
      const count = localChatCache.length;
      localChatCache = [];
      saveChatCacheToDisk();

      // Background wipe of Firestore collection
      const snapshot = await adminDb.collection("global_chat").get().catch(() => null);
      if (snapshot && !snapshot.empty) {
        const batch = adminDb.batch();
        snapshot.forEach((docSnap: any) => {
          batch.delete(docSnap.ref);
        });
        batch.commit().then(() => {
          console.log("[API-DB] Successfully purged Firestore global_chat in background.");
        }).catch((err: any) => {
          console.warn("[API-DB] Background Firestore database purge failed:", err.message || err);
        });
      }

      res.json({ success: true, count });
    } catch (error: any) {
      console.error("[API] Error in delete-all:", error);
      res.status(500).json({ error: error.message || "Failed to delete all posts" });
    }
  });

  // API Route to delete a single post
  app.post("/api/chat/delete/:msgId", async (req, res) => {
    const { msgId } = req.params;
    try {
      const user = await verifyUserToken(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const postIndex = localChatCache.findIndex(p => p.id === msgId);
      if (postIndex === -1) {
        // Find in Firestore in case it's not cached
        const postRef = adminDb.collection("global_chat").doc(msgId);
        const postSnap = await postRef.get().catch(() => null);
        if (postSnap && postSnap.exists) {
          const postData = postSnap.data();
          const email = user.email || "";
          const isAdmin = (
            email === "lumafashionhq@gmail.com" ||
            email === "abdalrahmanjarrah94@gmail.com" ||
            email === "abdalrahmanjarrah1@gmail.com"
          );
          if (postData.userId !== user.uid && !isAdmin) {
            return res.status(403).json({ error: "Unauthorized" });
          }
          await postRef.delete().catch(() => null);
        }
        return res.json({ success: true });
      }

      const postData = localChatCache[postIndex];
      const email = user.email || "";
      const isAdmin = (
        email === "lumafashionhq@gmail.com" ||
        email === "abdalrahmanjarrah94@gmail.com" ||
        email === "abdalrahmanjarrah1@gmail.com"
      );
      const isOwner = postData.userId === user.uid;

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: "You are not authorized to delete this post" });
      }

      // Delete from local cache
      localChatCache.splice(postIndex, 1);
      saveChatCacheToDisk();

      // Delete from Firestore
      if (isFirestoreAdminPermitted) {
        try {
          await adminDb.collection("global_chat").doc(msgId).delete();
        } catch (err: any) {
          console.warn("[API-DB] Foreground delete failed for post:", err.message || err);
          const errStr = String(err.message || err);
          if (errStr.includes("PERMISSION_DENIED") || errStr.toLowerCase().includes("quota") || errStr.includes("7")) {
            isFirestoreAdminPermitted = false;
          }
          throw err;
        }
      } else {
        throw new Error("Firestore Admin SDK is currently disabled (Perm/Quota Limits).");
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("[API] Error in delete single post:", error);
      res.status(500).json({ error: error.message || "Failed to delete post" });
    }
  });

  // API Route to like a post
  app.post("/api/chat/like/:msgId", async (req, res) => {
    const { msgId } = req.params;
    try {
      const user = await verifyUserToken(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const postIndex = localChatCache.findIndex(p => p.id === msgId);
      if (postIndex !== -1) {
        const post = localChatCache[postIndex];
        const likes = post.likes || [];
        const hasLiked = likes.includes(user.uid);
        const updatedLikes = hasLiked 
          ? likes.filter((uid: string) => uid !== user.uid)
          : [...likes, user.uid];
        
        post.likes = updatedLikes;
        saveChatCacheToDisk();

        // Await background update if permitted to escalate any write errors
        if (isFirestoreAdminPermitted) {
          try {
            await adminDb.collection("global_chat").doc(msgId).update({ likes: updatedLikes });
          } catch (err: any) {
            console.warn("[API-DB] Foreground update failed for like:", err.message || err);
            const errStr = String(err.message || err);
            if (errStr.includes("PERMISSION_DENIED") || errStr.toLowerCase().includes("quota") || errStr.includes("7")) {
              isFirestoreAdminPermitted = false;
            }
            throw err;
          }
        } else {
          throw new Error("Firestore Admin SDK is currently disabled (Perm/Quota Limits).");
        }

        // Trigger Notification if it's a new like, and not liking own post
        if (!hasLiked && post.userId && post.userId !== user.uid && isFirestoreAdminPermitted) {
          const userName = user.name || "رائد فضاء";
          adminDb.collection("users").doc(post.userId).collection("notifications").add({
            type: "like",
            content: `أعجب ${userName} بمنشورك في الشات الكوني!`,
            read: false,
            timestamp: FieldValue.serverTimestamp()
          }).catch((err: any) => {
            console.warn("[API-DB] Background Firestore notification like failed:", err.message || err);
          });
        }

        return res.json({ success: true, likes: updatedLikes });
      }
      res.status(404).json({ error: "Post not found" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API Route to add comment
  app.post("/api/chat/comment/:msgId", async (req, res) => {
    const { msgId } = req.params;
    try {
      const user = await verifyUserToken(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Empty comment" });
      }

      const postIndex = localChatCache.findIndex(p => p.id === msgId);
      if (postIndex !== -1) {
        const post = localChatCache[postIndex];
        const comments = post.comments || [];
        const newComment = {
          id: Math.random().toString(36).substring(2, 9) + Date.now(),
          userId: user.uid,
          userName: user.name || "Astronaut",
          userPhoto: user.picture || "",
          text,
          timestamp: Date.now(),
        };

        const updatedComments = [...comments, newComment];
        post.comments = updatedComments;
        saveChatCacheToDisk();

        // Await background update if permitted to escalate write errors
        if (isFirestoreAdminPermitted) {
          try {
            await adminDb.collection("global_chat").doc(msgId).update({ comments: updatedComments });
          } catch (err: any) {
            console.warn("[API-DB] Foreground update failed for comment:", err.message || err);
            const errStr = String(err.message || err);
            if (errStr.includes("PERMISSION_DENIED") || errStr.toLowerCase().includes("quota") || errStr.includes("7")) {
              isFirestoreAdminPermitted = false;
            }
            throw err;
          }
        } else {
          throw new Error("Firestore Admin SDK is currently disabled (Perm/Quota Limits).");
        }

        // Trigger Notification if original poster is not the commenter
        if (post.userId && post.userId !== user.uid && isFirestoreAdminPermitted) {
          const userName = user.name || "رائد فضاء";
          adminDb.collection("users").doc(post.userId).collection("notifications").add({
            type: "reply",
            content: `علق ${userName} على منشورك: "${text.substring(0, 30)}${text.length > 30 ? "..." : ""}"`,
            read: false,
            timestamp: FieldValue.serverTimestamp()
          }).catch((err: any) => {
            console.warn("[API-DB] Background Firestore notification reply failed:", err.message || err);
          });
        }

        return res.json({ success: true, comments: updatedComments });
      }
      res.status(404).json({ error: "Post not found" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API Route to delete a comment
  app.post("/api/chat/comment/delete/:msgId/:commentId", async (req, res) => {
    const { msgId, commentId } = req.params;
    try {
      const user = await verifyUserToken(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const postIndex = localChatCache.findIndex(p => p.id === msgId);
      if (postIndex !== -1) {
        const post = localChatCache[postIndex];
        const comments = post.comments || [];
        const comment = comments.find((c: any) => c.id === commentId);

        if (!comment) {
          return res.status(404).json({ error: "Comment not found" });
        }

        const email = user.email || "";
        const isAdmin = (
          email === "lumafashionhq@gmail.com" ||
          email === "abdalrahmanjarrah94@gmail.com" ||
          email === "abdalrahmanjarrah1@gmail.com"
        );
        const isOwner = comment.userId === user.uid;

        if (!isOwner && !isAdmin) {
          return res.status(403).json({ error: "Unauthorized to delete comment" });
        }

        const updatedComments = comments.filter((c: any) => c.id !== commentId);
        post.comments = updatedComments;
        saveChatCacheToDisk();

        // Background update
        adminDb.collection("global_chat").doc(msgId).update({ comments: updatedComments }).catch((err: any) => {
          console.warn("[API-DB] Background Firestore comment delete failed:", err.message || err);
        });

        return res.json({ success: true, comments: updatedComments });
      }
      res.status(404).json({ error: "Post not found" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Daily.co API Key
  const DAILY_API_KEY = process.env.DAILY_API_KEY;

  // API Route to leave a room immediately (used for keepalive beacon during tab close)
  app.post("/api/leave-room", async (req, res) => {
    const { userId, roomId, userName } = req.body;
    if (!userId || !roomId) {
      return res.status(400).json({ error: "Missing userId or roomId" });
    }

    try {
      console.log(`[Server API] User ${userId} (${userName}) leaving room ${roomId}`);

      const doLeaveRoom = async () => {
        const roomRef = doc(db, "rooms", roomId);
        const roomSnap = await getDoc(roomRef);

        if (roomSnap.exists()) {
          const rData = roomSnap.data();
          const participants = rData.participants || [];
          const rem = participants.filter((p: string) => p !== userId);

          const updates: any = {
            participants: arrayRemove(userId),
            emptyAt: rem.length === 0 ? new Date() : deleteField(),
          };

          const currentHostId = rData.hostId || rData.creatorId;
          if (currentHostId === userId && rem.length > 0) {
            updates.hostId = rem[0];
          }
          if (rem.length === 0) {
            updates.timerStatus = "idle";
          }

          await updateDoc(roomRef, updates);

          // Optional: add system message if there are other participants
          if (rem.length > 0) {
            const msgCol = collection(db, "rooms", roomId, "messages");
            await addDoc(msgCol, {
              text: `🚀 غادر المحرك (${userName || userId}) المحطة (إغلاق التبويب/المتصفح).`,
              userId: "system",
              userName: "نظام التنبيه",
              userPhoto: "",
              timestamp: new Date(),
              type: "text",
            });
          }

          // Delete empty room after 5 minutes
          if (rem.length === 0) {
            setTimeout(async () => {
              try {
                const checkSnap = await getDoc(roomRef);
                if (checkSnap.exists() && (!(checkSnap.data() as any).participants || (checkSnap.data() as any).participants.length === 0)) {
                  await deleteDoc(roomRef);
                }
              } catch (e) {}
            }, 300000);
          }
        }

        // Also reset currentActivity for the user
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          currentActivity: "في لوحة التحكم",
        });

        // Instantly delete typing indicator document on the server as well
        try {
          const typingRef = doc(db, "rooms", roomId, "typing", userId);
          await deleteDoc(typingRef);
        } catch (e) {}
      };

      await Promise.race([
        doLeaveRoom(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000))
      ]);

      res.json({ success: true });
    } catch (error: any) {
      console.error("[Server API] Error or Timeout leaving room:", error.message || error);
      res.status(500).json({ error: "Failed to process leave room" });
    }
  });

  // API Route to create a Daily.co room
  app.post("/api/create-daily-room", async (req, res) => {
    if (!DAILY_API_KEY) {
      console.error("DAILY_API_KEY is not set in environment variables.");
      return res.status(500).json({ error: "Daily.co API key is missing" });
    }

    try {
      const response = await axios.post(
        "https://api.daily.co/v1/rooms",
        {
          properties: {
            enable_chat: true,
            start_video_off: true,
            start_audio_off: false,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${DAILY_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      res.json({ url: response.data.url });
    } catch (error: any) {
      console.error("Error creating Daily.co room:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to create voice room" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

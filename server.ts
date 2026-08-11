import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import crypto from "crypto";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc, getDoc, arrayRemove, deleteField, deleteDoc, collection, addDoc } from "firebase/firestore";
import * as admin from "firebase-admin";
import { initializeApp as initializeAdminApp, getApps as getAdminApps } from "firebase-admin/app";
import { getFirestore as getAdminFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import webpush from "web-push";

dotenv.config();

// Web Push (VAPID) configuration
const vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:orbitx@example.com";
if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  console.log("[SYSTEM] Web Push (VAPID) configured.");
} else {
  console.log("[SYSTEM] VAPID keys missing — Web Push disabled.");
}

// Initialize Supabase Admin client if credentials are provided
import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = supabaseUrl && supabaseServiceKey && supabaseServiceKey !== "your-service-role-key" && supabaseServiceKey !== ""
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

if (supabaseAdmin) {
  console.log("[SYSTEM] Supabase Admin active for backend database operations and token verification.");
} else {
  console.log("[SYSTEM] Supabase Admin is inactive. Defaulting backend to Firebase.");
}

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

// Server-side database operation wrappers
async function compatGetDoc(docRef: any): Promise<any> {
  if (supabaseAdmin) {
    const docPath = typeof docRef === "string" ? docRef : docRef.path;
    const parts = docPath.split("/");
    const id = parts[parts.length - 1];
    try {
      const { data, error } = await supabaseAdmin.from("documents").select("data").eq("path", docPath).maybeSingle();
      if (error) throw error;
      return {
        exists: () => !!data,
        data: () => data?.data || null,
        id
      };
    } catch (err) {
      console.error("[Supabase Server compatGetDoc] failed:", err);
      return { exists: () => false, data: () => null, id };
    }
  }
  return await getDoc(docRef);
}

async function compatUpdateDoc(docRef: any, updates: any): Promise<void> {
  if (supabaseAdmin) {
    const docPath = typeof docRef === "string" ? docRef : docRef.path;
    const parts = docPath.split("/");
    const collectionName = parts[parts.length - 2];
    const id = parts[parts.length - 1];
    try {
      // Fetch current
      const { data: current, error: getErr } = await supabaseAdmin.from("documents").select("data").eq("path", docPath).maybeSingle();
      if (getErr) throw getErr;
      
      let mergedData = current?.data || {};
      for (const key in updates) {
        const val = updates[key];
        // Handle deleteField sentinel and arrayRemove mock
        if (val && typeof val === "object" && val._methodName === "FieldValue.delete") {
          delete mergedData[key];
        } else if (val && typeof val === "object" && val._methodName === "FieldValue.arrayRemove") {
          const arr = Array.isArray(mergedData[key]) ? mergedData[key] : [];
          const toRemove = val._elements || [];
          mergedData[key] = arr.filter((item: any) => !toRemove.includes(item));
        } else {
          mergedData[key] = val;
        }
      }

      const { error } = await supabaseAdmin.from("documents").upsert({
        path: docPath,
        collection: collectionName,
        id,
        data: mergedData,
        updated_at: new Date().toISOString()
      }, { onConflict: "path" });
      if (error) throw error;
      return;
    } catch (err) {
      console.error("[Supabase Server compatUpdateDoc] failed:", err);
      throw err;
    }
  }
  return await updateDoc(docRef, updates);
}

async function compatAddDoc(colRef: any, docData: any): Promise<any> {
  if (supabaseAdmin) {
    const colPath = typeof colRef === "string" ? colRef : colRef.path;
    const parts = colPath.split("/");
    const collectionName = parts[parts.length - 1];
    const randomId = "id_srv_" + Math.random().toString(36).substr(2, 9);
    const docPath = colPath + "/" + randomId;
    try {
      const { error } = await supabaseAdmin.from("documents").upsert({
        path: docPath,
        collection: collectionName,
        id: randomId,
        data: docData,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      return { id: randomId, path: docPath };
    } catch (err) {
      console.error("[Supabase Server compatAddDoc] failed:", err);
      throw err;
    }
  }
  return await addDoc(colRef, docData);
}

async function compatDeleteDoc(docRef: any): Promise<void> {
  if (supabaseAdmin) {
    const docPath = typeof docRef === "string" ? docRef : docRef.path;
    try {
      const { error } = await supabaseAdmin.from("documents").delete().eq("path", docPath);
      if (error) throw error;
      return;
    } catch (err) {
      console.error("[Supabase Server compatDeleteDoc] failed:", err);
      throw err;
    }
  }
  return await deleteDoc(docRef);
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
  if (supabaseAdmin) {
    try {
      console.log("[SYSTEM] Syncing local feed cache from Supabase PostgreSQL...");
      const { data, error } = await supabaseAdmin
        .from("documents")
        .select("id, data")
        .eq("collection", "global_chat");
      
      if (error) throw error;
      if (data && data.length > 0) {
        let fetched = data.map(row => {
          const timestamp = row.data?.timestamp ? new Date(row.data.timestamp).getTime() : Date.now();
          return {
            id: row.id,
            ...row.data,
            timestamp
          };
        });
        // Sort descending by timestamp
        fetched.sort((a, b) => b.timestamp - a.timestamp);
        localChatCache = fetched.slice(0, 100);
        saveChatCacheToDisk();
        console.log(`[SYSTEM] Successfully synced ${localChatCache.length} posts from Supabase.`);
      }
      return;
    } catch (err) {
      console.warn("[SYSTEM] Supabase cache sync on boot failed, using existing disk backup:", err.message || err);
      return;
    }
  }

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
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json());

  // ── Security headers ──────────────────────────────────────────────
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader(
      "Permissions-Policy",
      "geolocation=(), payment=(), accelerometer=(), gyroscope=(), magnetometer=()"
    );
    if (process.env.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
      res.setHeader(
        "Content-Security-Policy",
        [
          "default-src 'self'",
          "script-src 'self'",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com data:",
          "img-src 'self' data: blob: https://api.dicebear.com https://images.unsplash.com https://www.transparenttextures.com https://grainy-gradients.vercel.app https://raw.githubusercontent.com https://unpkg.com",
          "media-src 'self' blob: https://server*.mp3quran.net https://archive.org https://assets.mixkit.co",
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
          "worker-src 'self' blob:",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'",
        ].join("; ")
      );
    }
    next();
  });

  // Helper to verify ID token and return user info
  async function verifyUserToken(req: express.Request) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    const token = authHeader.split("Bearer ")[1];

    if (supabaseAdmin) {
      try {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        if (!error && user) {
          return {
            uid: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.user_metadata?.name || "رائد فضاء",
            picture: user.user_metadata?.avatar_url || "",
          };
        }
      } catch (err) {
        // Fall back to Firebase verification if token is a Firebase token
      }
    }

    try {
      const decodedToken = await getAdminAuth().verifyIdToken(token);
      return decodedToken;
    } catch (e) {
      console.error("[Auth] Error verifying user token:", e);
    }

    // Last resort: verify a Supabase JWT using the public anon key as the HS256 secret.
    // Works even when the service-role key is not configured (e.g. local/preview runs).
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      const header = JSON.parse(Buffer.from(parts[0], "base64url").toString());
      if (header.alg !== "HS256") return null;
      const secret = process.env.VITE_SUPABASE_ANON_KEY || "";
      if (!secret) return null;
      const expected = crypto.createHmac("sha256", secret).update(`${parts[0]}.${parts[1]}`).digest("base64url");
      if (expected !== parts[2]) return null;
      const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
      if (payload.exp && Date.now() / 1000 > payload.exp) return null;
      if (!payload.sub) return null;
      return {
        uid: payload.sub,
        email: payload.email || null,
        name: payload.user_metadata?.full_name || payload.user_metadata?.name || "رائد فضاء",
        picture: payload.user_metadata?.avatar_url || "",
      };
    } catch (e) {
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
    const { userId, roomId, userName, token } = req.body;
    if (!userId || !roomId) {
      return res.status(400).json({ error: "Missing userId or roomId" });
    }

    // Beacons can't set Authorization headers, so the token travels in the body.
    if (token) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        req.headers.authorization = `Bearer ${token}`;
      }
    }
    const verified = await verifyUserToken(req);
    if (!verified || verified.uid !== userId) {
      return res.status(403).json({ error: "Unauthorized: can only leave on your own behalf" });
    }

    try {
      console.log(`[Server API] User ${userId} (${userName}) leaving room ${roomId}`);

      const doLeaveRoom = async () => {
        const roomRef = doc(db, "rooms", roomId);
        const roomSnap = await compatGetDoc(roomRef);

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

          await compatUpdateDoc(roomRef, updates);

          // Optional: add system message if there are other participants
          if (rem.length > 0) {
            const msgCol = collection(db, "rooms", roomId, "messages");
            await compatAddDoc(msgCol, {
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
                const checkSnap = await compatGetDoc(roomRef);
                if (checkSnap.exists() && (!(checkSnap.data() as any).participants || (checkSnap.data() as any).participants.length === 0)) {
                  await compatDeleteDoc(roomRef);
                }
              } catch (e) {}
            }, 300000);
          }
        }

        // Also reset currentActivity for the user
        const userRef = doc(db, "users", userId);
        await compatUpdateDoc(userRef, {
          currentActivity: "في لوحة التحكم",
        });

        // Instantly delete typing indicator document on the server as well
        try {
          const typingRef = doc(db, "rooms", roomId, "typing", userId);
          await compatDeleteDoc(typingRef);
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

  // ── Web Push endpoints ─────────────────────────────────────────────
  app.post("/api/push/subscribe", async (req, res) => {
    try {
      const verified = await verifyUserToken(req);
      if (!verified) return res.status(401).json({ error: "Unauthorized" });
      const { uid, subscription } = req.body || {};
      if (verified.uid !== uid) return res.status(403).json({ error: "Can only subscribe your own uid" });
      if (!subscription || !subscription.endpoint || !subscription.keys) {
        return res.status(400).json({ error: "subscription is required" });
      }
      const docPath = `push_subscriptions/${uid}`;
      const snap = await compatGetDoc(docPath as any);
      const existing: any[] = snap?.data?.()?.subscriptions || [];
      const filtered = existing.filter((s) => s.endpoint !== subscription.endpoint);
      filtered.push(subscription);
      await compatUpdateDoc(docPath as any, { subscriptions: filtered });
      res.json({ success: true });
    } catch (error: any) {
      console.error("[Push] subscribe failed:", error.message || error);
      res.status(500).json({ error: "Failed to subscribe" });
    }
  });

  app.post("/api/push/unsubscribe", async (req, res) => {
    try {
      const verified = await verifyUserToken(req);
      if (!verified) return res.status(401).json({ error: "Unauthorized" });
      const { uid, endpoint } = req.body || {};
      if (verified.uid !== uid) return res.status(403).json({ error: "Can only unsubscribe your own uid" });
      if (!endpoint) return res.status(400).json({ error: "endpoint is required" });
      const docPath = `push_subscriptions/${uid}`;
      const snap = await compatGetDoc(docPath as any);
      const existing: any[] = snap?.data?.()?.subscriptions || [];
      await compatUpdateDoc(docPath as any, {
        subscriptions: existing.filter((s) => s.endpoint !== endpoint),
      });
      res.json({ success: true });
    } catch (error: any) {
      console.error("[Push] unsubscribe failed:", error.message || error);
      res.status(500).json({ error: "Failed to unsubscribe" });
    }
  });

  app.post("/api/push/send", async (req, res) => {
    if (!vapidPublicKey || !vapidPrivateKey) {
      return res.status(503).json({ error: "Web Push not configured" });
    }
    try {
      const verified = await verifyUserToken(req);
      if (!verified) return res.status(401).json({ error: "Unauthorized" });
      const { uid, title, body, url } = req.body || {};
      if (!uid || !title) return res.status(400).json({ error: "uid and title are required" });
      const docPath = `push_subscriptions/${uid}`;
      const snap = await compatGetDoc(docPath as any);
      const subscriptions: any[] = snap?.data?.()?.subscriptions || [];
      if (subscriptions.length === 0) return res.json({ success: true, sent: 0 });

      const payload = JSON.stringify({ title, body: body || "", url: url || "/OrbitX../" });
      const results = await Promise.allSettled(
        subscriptions.map((sub) =>
          webpush.sendNotification(sub, payload).catch(async (err: any) => {
            if (err?.statusCode === 404 || err?.statusCode === 410) {
              await compatUpdateDoc(docPath as any, {
                subscriptions: subscriptions.filter((s) => s.endpoint !== sub.endpoint),
              });
            }
            throw err;
          })
        )
      );
      const sent = results.filter((r) => r.status === "fulfilled").length;
      res.json({ success: true, sent });
    } catch (error: any) {
      console.error("[Push] send failed:", error.message || error);
      res.status(500).json({ error: "Failed to send push" });
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

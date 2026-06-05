import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc, getDoc, arrayRemove, deleteField, deleteDoc, collection, addDoc } from "firebase/firestore";

dotenv.config();

// Initialize Firebase for server-side cleanups
const firebaseConfig = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8")
);
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

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

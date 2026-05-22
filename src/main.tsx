/// <reference types="vite/client" />
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// --- GLOBAL FIRESTORE WRITE PROTECTION / CIRCUIT BREAKER ---
import('firebase/firestore').then((firestore) => {
  try {
    const originalUpdateDoc = firestore.updateDoc;
    (firestore as any).updateDoc = function(...args: any[]) {
      if (typeof window !== "undefined" && (window as any).__firestoreQuotaExceeded) {
        console.warn("[Quota Fallback] Intercepted updateDoc to prevent Firebase server hammering.");
        return Promise.resolve();
      }
      
      const data = args[1] || {};
      if (import.meta.env.DEV && (data.xp !== undefined || data.level !== undefined)) {
        const stack = new Error().stack || '';
        if (!stack.includes('xpSystem.ts') && !stack.includes('xpSystem.js')) {
           console.warn("%c[DEV WARNING] ILLEGAL XP MUTATION DETECTED OUTSIDE xpSystem.ts!", "color: red; font-size: 16px; font-weight: bold;");
           console.warn("Direct XP mutations are forbidden. Use requestXpGrant() from xpSystem.ts.");
        }
      }
      return originalUpdateDoc.apply(this, args);
    };
    
    const originalSetDoc = firestore.setDoc;
    (firestore as any).setDoc = function(...args: any[]) {
      if (typeof window !== "undefined" && (window as any).__firestoreQuotaExceeded) {
        console.warn("[Quota Fallback] Intercepted setDoc to prevent Firebase server hammering.");
        return Promise.resolve();
      }

      const data = args[1] || {};
      if (import.meta.env.DEV && (data.xp !== undefined || data.level !== undefined)) {
        const stack = new Error().stack || '';
        if (!stack.includes('xpSystem')) {
           console.warn("%c[DEV WARNING] ILLEGAL XP MUTATION DETECTED DURING setDoc OUTSIDE xpSystem.ts!", "color: red; font-size: 16px; font-weight: bold;");
        }
      }
      return originalSetDoc.apply(this, args);
    };

    const originalAddDoc = firestore.addDoc;
    (firestore as any).addDoc = function(...args: any[]) {
      if (typeof window !== "undefined" && (window as any).__firestoreQuotaExceeded) {
        console.warn("[Quota Fallback] Intercepted addDoc to prevent Firebase server hammering.");
        return Promise.resolve({
          id: "simulated_quota_" + Math.random().toString(36).substring(7),
          path: "simulated/quota",
        });
      }
      return originalAddDoc.apply(this, args);
    };

    const originalRunTransaction = firestore.runTransaction;
    if (typeof (firestore as any).runTransaction === "function") {
      (firestore as any).runTransaction = function(...args: any[]) {
        if (typeof window !== "undefined" && (window as any).__firestoreQuotaExceeded) {
          console.warn("[Quota Fallback] Intercepted runTransaction to prevent Firestore server hammering.");
          return Promise.resolve();
        }
        return originalRunTransaction.apply(this, args);
      };
    }
  } catch (e) {
    // Ignored if ESM is strictly sealed or locked
  }
}).catch(() => {});
// -------------------------------------------------------------

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

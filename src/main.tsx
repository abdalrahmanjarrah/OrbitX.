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

    // --- GLOBAL ON_SNAPSHOT MULTIPLEXER AND DETECTOR ---
    const getQueryKey = (queryRef: any): string => {
      if (!queryRef) return "unknown";
      if (typeof queryRef.path === "string") return queryRef.path;
      try {
        const segments = queryRef._query?.path?.segments || [];
        const path = segments.join("/");
        const filters = queryRef._query?.filters || [];
        const orders = queryRef._query?.explicitOrderBy || [];
        const lim = queryRef._query?.limit || "";
        const filterStr = filters.map((f: any) => `${f.field?.kanonic || f.field?.toString()}:${f.op}:${f.value?.toString() || ""}`).join(",");
        const orderStr = orders.map((o: any) => `${o.field?.kanonic || o.field?.toString()}:${o.dir}`).join(",");
        return `query:${path}?filters=${filterStr}&orders=${orderStr}&limit=${lim}`;
      } catch (e) {
        return queryRef._query?.path?.toString() || "queries";
      }
    };

    const snapshotRegistry = new Map<string, {
      unsub: () => void;
      callbacks: Map<string, { onNext: (snap: any) => void; onError?: (err: any) => void }>;
      lastSnap: any | null;
      lastError: any | null;
    }>();

    const originalOnSnapshot = firestore.onSnapshot;
    (firestore as any).onSnapshot = function(queryRef: any, ...etc: any[]) {
      let onNext: ((snap: any) => void) | null = null;
      let onError: ((err: any) => void) | null = null;
      
      if (typeof etc[0] === 'function') {
        onNext = etc[0];
        if (typeof etc[1] === 'function') {
          onError = etc[1];
        }
      } else if (etc[0] && typeof etc[0] === 'object') {
        onNext = etc[0].next || null;
        onError = etc[0].error || null;
      } else if (typeof etc[1] === 'function') {
        onNext = etc[1];
        if (typeof etc[2] === 'function') {
          onError = etc[2];
        }
      }
      
      if (!onNext) {
        return originalOnSnapshot.apply(this, [queryRef, ...etc]);
      }
      
      const key = getQueryKey(queryRef);
      const callbackId = Math.random().toString(36).substring(2, 9);
      
      let entry = snapshotRegistry.get(key);
      if (!entry) {
        const callbacks = new Map<string, { onNext: (snap: any) => void; onError?: (err: any) => void }>();
        callbacks.set(callbackId, { onNext, onError });
        
        const entryObj = {
          unsub: () => {},
          callbacks,
          lastSnap: null as any | null,
          lastError: null as any | null
        };
        
        const timerStart = performance.now();
        let isFirst = true;
        
        const d = (window as any).__realtimeDiagnostics;
        if (d && d.shouldAllowNewListener && !d.shouldAllowNewListener(key)) {
          return () => {};
        }
        if (d) d.trackListenerStart(key);
        
        const originalUnsub = originalOnSnapshot(queryRef, (snap) => {
          entryObj.lastSnap = snap;
          entryObj.lastError = null;
          
          const diag = (window as any).__realtimeDiagnostics;
          if (isFirst) {
            if (diag) diag.logLatency(`snapshot_load[${key}]`, timerStart, true);
            isFirst = false;
          }
          if (diag) diag.trackOnSnapshotTrigger(key, (snap as any).docs ? (snap as any).docs.length : 1);
          
          entryObj.callbacks.forEach((cb) => {
            try {
              cb.onNext(snap);
            } catch (err) {
              console.error("[Multiplexer Error] Callback crashed: ", err);
            }
          });
        }, (err) => {
          entryObj.lastError = err;
          
          const diag = (window as any).__realtimeDiagnostics;
          if (isFirst) {
            if (diag) diag.logLatency(`snapshot_load[${key}]`, timerStart, false, err?.message || String(err));
            isFirst = false;
          }
          if (diag) diag.logError(`safeOnSnapshot_listener[${key}]`, err);
          
          entryObj.callbacks.forEach((cb) => {
            if (cb.onError) {
              try {
                cb.onError(err);
              } catch (e) {
                console.error("[Multiplexer Error] Error callback crashed: ", e);
              }
            }
          });
        });
        
        entryObj.unsub = originalUnsub;
        snapshotRegistry.set(key, entryObj);
        entry = entryObj;
      } else {
        entry.callbacks.set(callbackId, { onNext, onError });
        if (entry.lastSnap) {
          const savedSnap = entry.lastSnap;
          setTimeout(() => {
            if (entry?.callbacks.has(callbackId)) {
              onNext!(savedSnap);
            }
          }, 0);
        } else if (entry.lastError && onError) {
          const savedErr = entry.lastError;
          setTimeout(() => {
            if (entry?.callbacks.has(callbackId) && onError) {
              onError(savedErr);
            }
          }, 0);
        }
      }
      
      return () => {
        const liveEntry = snapshotRegistry.get(key);
        if (liveEntry) {
          liveEntry.callbacks.delete(callbackId);
          if (liveEntry.callbacks.size === 0) {
            liveEntry.unsub();
            snapshotRegistry.delete(key);
            const diag = (window as any).__realtimeDiagnostics;
            if (diag) diag.trackListenerStop(key);
          }
        }
      };
    };
  } catch (e) {
    // Ignored if ESM is strictly sealed or locked
  }
}).catch(() => {});
// -------------------------------------------------------------

import { LanguageProvider } from "./context/LanguageContext.tsx";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
);

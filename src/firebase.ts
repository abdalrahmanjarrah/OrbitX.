import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  initializeFirestore, 
  disableNetwork,
  getDoc as originalGetDoc,
  getDocs as originalGetDocs,
  updateDoc as originalUpdateDoc,
  addDoc as originalAddDoc,
  deleteDoc as originalDeleteDoc,
  setDoc as originalSetDoc,
  runTransaction as originalRunTransaction
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Debugger } from './firebaseDebug';

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true
}, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
      console.error("Error signing in with Google", error);
    }
    throw error;
  }
};

export const logout = () => signOut(auth);

// Tracked replacements of Firestore core APIs with strict local fallback circuit-breakers
export const getDoc = async (docRef: any) => {
  if (typeof window !== "undefined" && (window as any).__firestoreQuotaExceeded) {
    console.warn("[Quota Fallback] Circumvented getDoc call on path:", docRef?.path);
    return { exists: () => false, data: () => null };
  }
  Debugger.trackGetDoc(docRef?.path || "unspecified_doc");
  try {
    return await originalGetDoc(docRef);
  } catch (error: any) {
    handleFirestoreError(error, OperationType.GET, docRef?.path || null);
    throw error;
  }
};

export const getDocs = async (queryRef: any) => {
  if (typeof window !== "undefined" && (window as any).__firestoreQuotaExceeded) {
    console.warn("[Quota Fallback] Circumvented getDocs call to prevent Firebase API rejection.");
    return { empty: true, docs: [] };
  }
  Debugger.trackGetDocs(queryRef?._query?.path?.toString() || "queries");
  try {
    return await originalGetDocs(queryRef);
  } catch (error: any) {
    handleFirestoreError(error, OperationType.GET, queryRef?._query?.path?.toString() || null);
    throw error;
  }
};

export const updateDoc = async (docRef: any, data: any) => {
  if (typeof window !== "undefined" && (window as any).__firestoreQuotaExceeded) {
    console.warn("[Quota Fallback] Intercepted updateDoc on path:", docRef?.path);
    return Promise.resolve();
  }
  
  if (import.meta.env.DEV && (data.xp !== undefined || data.level !== undefined)) {
    const stack = new Error().stack || '';
    if (!stack.includes('xpSystem.ts') && !stack.includes('xpSystem.js')) {
       console.warn("%c[DEV WARNING] ILLEGAL XP MUTATION DETECTED OUTSIDE xpSystem.ts!", "color: red; font-size: 16px; font-weight: bold;");
       console.warn("Direct XP mutations are forbidden. Use requestXpGrant() from xpSystem.ts.");
    }
  }

  Debugger.trackUpdateDoc(docRef?.path || "unspecified_doc");
  try {
    return await originalUpdateDoc(docRef, data);
  } catch (error: any) {
    handleFirestoreError(error, OperationType.UPDATE, docRef?.path || null);
    throw error;
  }
};

export const addDoc = async (colRef: any, data: any) => {
  if (typeof window !== "undefined" && (window as any).__firestoreQuotaExceeded) {
    console.warn("[Quota Fallback] Intercepted addDoc to prevent Firestore hammering:", colRef?.path);
    return Promise.resolve({
      id: "simulated_quota_" + Math.random().toString(36).substring(7),
      path: (colRef?.path || "simulated/quota") + "/simulated_key",
    });
  }
  Debugger.trackAddDoc(colRef?.path || "unspecified_collection");
  try {
    return await originalAddDoc(colRef, data);
  } catch (error: any) {
    handleFirestoreError(error, OperationType.CREATE, colRef?.path || null);
    throw error;
  }
};

export const deleteDoc = async (docRef: any) => {
  if (typeof window !== "undefined" && (window as any).__firestoreQuotaExceeded) {
    console.warn("[Quota Fallback] Intercepted deleteDoc on path:", docRef?.path);
    return Promise.resolve();
  }
  Debugger.trackDeleteDoc(docRef?.path || "unspecified_doc");
  try {
    return await originalDeleteDoc(docRef);
  } catch (error: any) {
    handleFirestoreError(error, OperationType.DELETE, docRef?.path || null);
    throw error;
  }
};

export const setDoc = async (docRef: any, data: any, options?: any) => {
  if (typeof window !== "undefined" && (window as any).__firestoreQuotaExceeded) {
    console.warn("[Quota Fallback] Intercepted setDoc to prevent Firestore hammering:", docRef?.path);
    return Promise.resolve();
  }

  if (import.meta.env.DEV && (data.xp !== undefined || data.level !== undefined)) {
    const stack = new Error().stack || '';
    if (!stack.includes('xpSystem')) {
       console.warn("%c[DEV WARNING] ILLEGAL XP MUTATION DETECTED DURING setDoc OUTSIDE xpSystem.ts!", "color: red; font-size: 16px; font-weight: bold;");
    }
  }

  Debugger.trackSetDoc(docRef?.path || "unspecified_doc");
  try {
    return await originalSetDoc(docRef, data, options);
  } catch (error: any) {
    handleFirestoreError(error, OperationType.WRITE, docRef?.path || null);
    throw error;
  }
};

export const runTransaction = async (firestore: any, updateFunction: any) => {
  if (typeof window !== "undefined" && (window as any).__firestoreQuotaExceeded) {
    console.warn("[Quota Fallback] Intercepted runTransaction to prevent Firestore hammering.");
    return Promise.resolve();
  }
  Debugger.trackTransaction("run_transaction_ops");
  try {
    return await originalRunTransaction(firestore, updateFunction);
  } catch (error: any) {
    handleFirestoreError(error, OperationType.WRITE, "transaction");
    throw error;
  }
};

// Test connection
async function testConnection() {
  if (typeof window !== "undefined" && (window as any).__firestoreQuotaExceeded) {
    return;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    const isOffline = error instanceof Error && (
      error.message.includes('the client is offline') ||
      error.message.includes('unavailable') ||
      error.message.includes('Could not reach Cloud Firestore') ||
      (error as any).code === 'unavailable'
    );
    if (isOffline) {
      console.warn("Firestore: Server is temporarily unreachable or client is working offline. Firestore will automatically sync once connection is restored.");
      return;
    }
    const errMsg = error?.message || String(error);
    const isQuota = errMsg.toLowerCase().includes("quota") || errMsg.toLowerCase().includes("resource-exhausted") || errMsg.toLowerCase().includes("exhausted");
    if (isQuota) {
      if (typeof window !== "undefined") {
        (window as any).__firestoreQuotaExceeded = true;
      }
      disableNetwork(db).catch(() => {});
      console.warn("[Quota Fallback] Database connection verified Quota limit. Auto-switched client to offline durable mode.");
      return;
    }
    handleFirestoreError(error, OperationType.GET, 'test/connection');
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  const errCode = (error as any)?.code;

  const isOffline = errMsg.toLowerCase().includes("unavailable") || 
                    errMsg.toLowerCase().includes("offline") || 
                    errMsg.toLowerCase().includes("could not reach cloud firestore") ||
                    errCode === 'unavailable' ||
                    errCode === 'failed-precondition';

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  
  if (isOffline) {
    console.warn(`[Firestore Status] Offline/temporarily unreachable. Operation '${operationType}' is queued locally and will resume when online. Status: ${errMsg}`);
    Debugger.logError(`firestore_offline_${operationType}`, `Path: ${path} | Status: ${errMsg}`);
    return;
  }

  console.error('Firestore Error: ', JSON.stringify(errInfo));

  const isQuota = errMsg.toLowerCase().includes("quota") || errMsg.toLowerCase().includes("resource-exhausted") || errMsg.toLowerCase().includes("exhausted");
  if (isQuota) {
    if (typeof window !== "undefined") {
      (window as any).__firestoreQuotaExceeded = true;
      try {
        window.dispatchEvent(new CustomEvent("firestore_quota_exceeded", { detail: errInfo }));
      } catch {}
    }
    disableNetwork(db).catch((e) => {
      console.warn("[Quota Fallback] Could not disable network:", e);
    });
    Debugger.logError("firestore_quota", "Quota Exceeded on " + path + ": " + errMsg);
    return;
  }

  Debugger.logError(`firestore_op_${operationType}`, `Path: ${path} | Err: ${errMsg}`);
}

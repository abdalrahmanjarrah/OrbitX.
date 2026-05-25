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
  experimentalForceLongPolling: true
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

// Tracked replacements of Firestore core APIs
export const getDoc = async (docRef: any) => {
  Debugger.trackGetDoc(docRef.path || "unspecified_doc");
  return originalGetDoc(docRef);
};

export const getDocs = async (queryRef: any) => {
  Debugger.trackGetDocs(queryRef._query?.path?.toString() || "queries");
  return originalGetDocs(queryRef);
};

export const updateDoc = async (docRef: any, data: any) => {
  Debugger.trackUpdateDoc(docRef.path || "unspecified_doc");
  return originalUpdateDoc(docRef, data);
};

export const addDoc = async (colRef: any, data: any) => {
  Debugger.trackAddDoc(colRef.path || "unspecified_collection");
  return originalAddDoc(colRef, data);
};

export const deleteDoc = async (docRef: any) => {
  Debugger.trackDeleteDoc(docRef.path || "unspecified_doc");
  return originalDeleteDoc(docRef);
};

export const setDoc = async (docRef: any, data: any, options?: any) => {
  Debugger.trackSetDoc(docRef.path || "unspecified_doc");
  return originalSetDoc(docRef, data, options);
};

export const runTransaction = async (firestore: any, updateFunction: any) => {
  Debugger.trackTransaction("run_transaction_ops");
  return originalRunTransaction(firestore, updateFunction);
};

// Test connection
async function testConnection() {
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

import { createClient } from "@supabase/supabase-js";

// 1. Initialize Supabase Client dynamically from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://your-project-id.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "your-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isRealSupabase = 
  import.meta.env.VITE_SUPABASE_URL && 
  !import.meta.env.VITE_SUPABASE_URL.includes("your-project-id") && 
  import.meta.env.VITE_SUPABASE_URL !== "https://your-project-id.supabase.co" &&
  import.meta.env.VITE_SUPABASE_ANON_KEY && 
  import.meta.env.VITE_SUPABASE_ANON_KEY !== "your-anon-key";

// Local storage fallback for seamless testing and offline-first persistence
export interface FallbackDoc {
  path: string;
  collection: string;
  id: string;
  data: any;
  updated_at: string;
}

const getLocalDocs = (): FallbackDoc[] => {
  try {
    const raw = localStorage.getItem("orbitx_fallback_db");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalDocs = (docs: FallbackDoc[]) => {
  try {
    localStorage.setItem("orbitx_fallback_db", JSON.stringify(docs));
    notifyListeners();
  } catch (e) {
    console.error("Failed to save to localStorage:", e);
  }
};

// In-memory optimistic cache: reads are instant, writes update UI immediately
// and persist to the network in the background.
const memoryDb = new Map<string, FallbackDoc>();
const collectionIndex = new Map<string, FallbackDoc[]>();
let memoryHydrated = false;
let hydrationPromise: Promise<void> | null = null;

const rebuildIndex = () => {
  collectionIndex.clear();
  memoryDb.forEach(doc => {
    const list = collectionIndex.get(doc.collection);
    if (list) {
      list.push(doc);
    } else {
      collectionIndex.set(doc.collection, [doc]);
    }
  });
};

const setCached = (doc: FallbackDoc) => {
  memoryDb.set(doc.path, doc);
  const list = collectionIndex.get(doc.collection);
  if (list) {
    const i = list.findIndex(d => d.path === doc.path);
    if (i !== -1) {
      list[i] = doc;
    } else {
      list.push(doc);
    }
  } else {
    collectionIndex.set(doc.collection, [doc]);
  }
};

const removeCached = (doc: FallbackDoc) => {
  memoryDb.delete(doc.path);
  const list = collectionIndex.get(doc.collection);
  if (!list) return;
  const i = list.findIndex(d => d.path === doc.path);
  if (i !== -1) list.splice(i, 1);
};

const ensureHydrated = (): Promise<void> => {
  if (memoryHydrated) return Promise.resolve();
  if (hydrationPromise) return hydrationPromise;
  hydrationPromise = (async () => {
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("id, collection, path, data, updated_at");
      if (error) throw error;
      memoryDb.clear();
      (data || []).forEach(row => {
        memoryDb.set(row.path, {
          path: row.path,
          collection: row.collection,
          id: row.id,
          data: row.data,
          updated_at: row.updated_at || ""
        });
      });
      rebuildIndex();
      memoryHydrated = true;
    } catch (e) {
      console.warn("[Supabase Compatibility] cache hydration failed, reads will fall back to local DB:", e);
    }
  })();
  return hydrationPromise;
};

const refreshFromServer = async () => {
  try {
    const { data, error } = await supabase
      .from("documents")
      .select("id, collection, path, data, updated_at");
    if (error) throw error;
    const changed: string[] = [];
    const seen = new Set<string>();
    (data || []).forEach(row => {
      const path = row.path;
      seen.add(path);
      const prev = memoryDb.get(path);
      const next: FallbackDoc = {
        path,
        collection: row.collection,
        id: row.id,
        data: row.data,
        updated_at: row.updated_at || ""
      };
      const changedRemote =
        !prev ||
        Date.parse(prev.updated_at || "") !== Date.parse(next.updated_at || "");
      if (changedRemote) {
        changed.push(path);
      }
      memoryDb.set(path, next);
    });
    Array.from(memoryDb.keys()).forEach(path => {
      if (!seen.has(path)) {
        changed.push(path);
        memoryDb.delete(path);
      }
    });
    rebuildIndex();
    memoryHydrated = true;
    // Only re-render listeners whose data actually changed
    notifyListeners(changed.length > 30 ? undefined : changed);
  } catch (e) {
    console.warn("[Supabase Compatibility] background refresh failed:", e);
  }
};

const getCachedDocs = (colRef: MockColRef): FallbackDoc[] => {
  const base = collectionIndex.get(colRef.collectionName) || [];
  if (!colRef.path.includes("/")) {
    return base;
  }
  const prefix = colRef.path + "/";
  return base.filter(d => d.path.startsWith(prefix));
};

const listeners = new Set<{ cb: () => void; path: string }>();

let notifyTimer: any = null;
const notifyPending = new Set<{ cb: () => void; path: string }>();
const notifyListeners = (writtenPath?: string | string[]) => {
  const paths = Array.isArray(writtenPath) ? writtenPath : writtenPath ? [writtenPath] : null;
  listeners.forEach(l => {
    if (!paths) {
      notifyPending.add(l);
    } else if (paths.some(p =>
      l.path === p ||
      p.startsWith(l.path + "/") ||
      l.path.startsWith(p + "/")
    )) {
      notifyPending.add(l);
    }
  });

  if (notifyTimer) return;
  notifyTimer = setTimeout(() => {
    notifyTimer = null;
    const batch = Array.from(notifyPending);
    notifyPending.clear();
    batch.forEach(l => {
      try {
        l.cb();
      } catch (e) {
        console.error("Error in onSnapshot listener callback:", e);
      }
    });
  }, 80);
};

// 2. Firestore Sentinel FieldValues Mock
export class MockFieldValue {
  constructor(public type: "arrayUnion" | "arrayRemove" | "increment" | "serverTimestamp" | "deleteField", public payload?: any) {}
}

export class FirestoreError extends Error {
  constructor(message?: string, public code?: string) {
    super(message);
    this.name = "FirestoreError";
  }
}

export const arrayUnion = (...values: any[]) => new MockFieldValue("arrayUnion", values);
export const arrayRemove = (...values: any[]) => new MockFieldValue("arrayRemove", values);
export const increment = (n: number) => new MockFieldValue("increment", n);
export const serverTimestamp = () => new MockFieldValue("serverTimestamp");
export const deleteField = () => new MockFieldValue("deleteField");

// Helper to apply FieldValue updates to local JSON data
function applyFieldValues(existing: any, updates: any): any {
  if (!existing) existing = {};
  const result = { ...existing };

  for (const key in updates) {
    const val = updates[key];
    if (val instanceof MockFieldValue) {
      if (val.type === "serverTimestamp") {
        result[key] = new Date().toISOString();
      } else if (val.type === "deleteField") {
        delete result[key];
      } else if (val.type === "increment") {
        const current = Number(result[key]) || 0;
        result[key] = current + (val.payload || 0);
      } else if (val.type === "arrayUnion") {
        const current = Array.isArray(result[key]) ? result[key] : [];
        const toAdd = val.payload || [];
        const merged = [...current];
        for (const item of toAdd) {
          // Prevent duplicates by serializing objects or matching primitives
          const exists = merged.some(existingItem => 
            JSON.stringify(existingItem) === JSON.stringify(item)
          );
          if (!exists) merged.push(item);
        }
        result[key] = merged;
      } else if (val.type === "arrayRemove") {
        const current = Array.isArray(result[key]) ? result[key] : [];
        const toRemove = val.payload || [];
        result[key] = current.filter(existingItem => 
          !toRemove.some((remItem: any) => JSON.stringify(remItem) === JSON.stringify(existingItem))
        );
      }
    } else if (val && typeof val === "object" && !Array.isArray(val)) {
      result[key] = applyFieldValues(result[key], val);
    } else {
      result[key] = val;
    }
  }
  return result;
}

// 3. Firestore References & Query Representation
export class MockDocRef {
  constructor(public db: any, public path: string, public id: string, public collectionName: string) {}
}

export class MockColRef {
  constructor(public db: any, public path: string, public collectionName: string) {}
}

export class MockQuery {
  constructor(public colRef: MockColRef, public constraints: any[] = []) {}
}

// Builders
export const doc = (parent: any, ...segments: string[]): MockDocRef => {
  let fullPath = "";
  if (parent instanceof MockColRef) {
    fullPath = parent.path + "/" + segments.join("/");
  } else {
    // parent is db, segments is [colName, docId] or nested
    fullPath = segments.join("/");
  }
  const parts = fullPath.split("/");
  const collectionName = parts.length > 1 ? parts[parts.length - 2] : parts[0];
  const id = parts[parts.length - 1];
  return new MockDocRef(null, fullPath, id, collectionName);
};

export const collection = (db: any, ...segments: string[]): MockColRef => {
  const fullPath = segments.join("/");
  const collectionName = segments[segments.length - 1];
  return new MockColRef(null, fullPath, collectionName);
};

export const query = (colRef: MockColRef, ...constraints: any[]): MockQuery => {
  return new MockQuery(colRef, constraints);
};

// Query Constraints
export const where = (field: any, op: string, value: any) => ({
  type: "where",
  field: typeof field === "function" ? field() : String(field),
  op,
  value
});
export const orderBy = (field: string, direction: "asc" | "desc" = "asc") => ({ type: "orderBy", field, direction });
export const limit = (n: number) => ({ type: "limit", n });
export const documentId = () => "__documentId__";

// 4. Snapshots Emulation
export class MockDocSnapshot {
  constructor(private _exists: boolean, private _id: string, private _data: any, public ref: MockDocRef | null = null) {}
  id = this._id;
  exists() { return this._exists; }
  data() { return this._data || null; }
  get(field: string) { return this._data ? this._data[field] : undefined; }
}

export class MockQuerySnapshot {
  constructor(public docs: MockDocSnapshot[]) {}
  get empty() { return this.docs.length === 0; }
  get size() { return this.docs.length; }
  forEach(callback: (doc: MockDocSnapshot) => void) {
    this.docs.forEach(callback);
  }
}

// 5. Database CRUD APIs (Using Single 'documents' JSONB Table) with Offline Fallback
export const getDoc = async (docRef: MockDocRef): Promise<MockDocSnapshot> => {
  if (!isRealSupabase) {
    const local = getLocalDocs().find(d => d.path === docRef.path);
    if (!local) {
      return new MockDocSnapshot(false, docRef.id, null, docRef);
    }
      return new MockDocSnapshot(true, docRef.id, local.data, docRef);
  }

  await ensureHydrated();
  const cached = memoryDb.get(docRef.path);
  if (cached) {
    return new MockDocSnapshot(true, docRef.id, cached.data, docRef);
  }
  if (memoryHydrated) {
    return new MockDocSnapshot(false, docRef.id, null, docRef);
  }
  const local = getLocalDocs().find(d => d.path === docRef.path);
  if (!local) {
    return new MockDocSnapshot(false, docRef.id, null, docRef);
  }
    return new MockDocSnapshot(true, docRef.id, local.data, docRef);
};

export const getDocs = async (queryOrCol: MockColRef | MockQuery): Promise<MockQuerySnapshot> => {
  const colRef = queryOrCol instanceof MockColRef ? queryOrCol : queryOrCol.colRef;
  const constraints = queryOrCol instanceof MockQuery ? queryOrCol.constraints : [];

  const runInMemoryFilter = (rawDocs: FallbackDoc[]) => {
    let documents = rawDocs
      .filter(d => d.collection === colRef.collectionName)
      .map(row => ({
        id: row.id,
        data: row.data,
        path: row.path
      }));

    // If query is for a subcollection, match path
    if (colRef.path.includes("/")) {
      const prefix = colRef.path + "/";
      documents = documents.filter(d => d.path.startsWith(prefix));
    }

    // Apply where constraints
    for (const constraint of constraints) {
      if (constraint.type === "where") {
        const { field, op, value } = constraint;
        documents = documents.filter(doc => {
          const docVal = field === "__documentId__" ? doc.id : (doc.data ? doc.data[field] : undefined);
          if (op === "==") return docVal === value;
          if (op === "!=") return docVal !== value;
          if (op === ">") return docVal > value;
          if (op === "<") return docVal < value;
          if (op === ">=") return docVal >= value;
          if (op === "<=") return docVal <= value;
          if (op === "array-contains") return Array.isArray(docVal) && docVal.includes(value);
          if (op === "in") return Array.isArray(value) && value.includes(docVal);
          return true;
        });
      }
    }

    // Apply ordering constraints
    const orderConstraint = constraints.find(c => c.type === "orderBy");
    if (orderConstraint) {
      const { field, direction } = orderConstraint;
      documents.sort((a, b) => {
        const valA = a.data ? a.data[field] : undefined;
        const valB = b.data ? b.data[field] : undefined;
        if (valA === valB) return 0;
        if (valA === undefined) return 1;
        if (valB === undefined) return -1;
        const comp = valA > valB ? 1 : -1;
        return direction === "asc" ? comp : -comp;
      });
    }

    // Apply limit
    const limitConstraint = constraints.find(c => c.type === "limit");
    if (limitConstraint) {
      documents = documents.slice(0, limitConstraint.n);
    }

    const snapshots = documents.map(d => new MockDocSnapshot(true, d.id, d.data, doc(colRef, d.id)));
    return new MockQuerySnapshot(snapshots);
  };

  if (!isRealSupabase) {
    return runInMemoryFilter(getLocalDocs());
  }

  await ensureHydrated();
  if (memoryHydrated) {
    return runInMemoryFilter(getCachedDocs(colRef));
  }
  return runInMemoryFilter(getLocalDocs());
};

export const setDoc = async (docRef: MockDocRef, data: any, options?: { merge?: boolean }): Promise<void> => {
  const applyLocalSet = () => {
    const localDocs = getLocalDocs();
    const index = localDocs.findIndex(d => d.path === docRef.path);
    let finalData = data;
    if (options?.merge && index !== -1) {
      finalData = applyFieldValues(localDocs[index].data, data);
    } else {
      finalData = applyFieldValues({}, data);
    }

    const newDoc: FallbackDoc = {
      path: docRef.path,
      collection: docRef.collectionName,
      id: docRef.id,
      data: finalData,
      updated_at: new Date().toISOString()
    };

    if (index !== -1) {
      localDocs[index] = newDoc;
    } else {
      localDocs.push(newDoc);
    }
    saveLocalDocs(localDocs);
  };

  if (!isRealSupabase) {
    applyLocalSet();
    return;
  }

  await ensureHydrated();

  let finalData = data;
  if (options?.merge) {
    const current = memoryDb.get(docRef.path);
    finalData = applyFieldValues(current?.data || {}, data);
  } else {
    finalData = applyFieldValues({}, data);
  }

  // Optimistic commit: update UI instantly, persist to network in the background
  setCached({
    path: docRef.path,
    collection: docRef.collectionName,
    id: docRef.id,
    data: finalData,
    updated_at: new Date().toISOString()
  });
  notifyListeners(docRef.path);

  try {
    const { error } = await supabase
      .from("documents")
      .upsert({
        path: docRef.path,
        collection: docRef.collectionName,
        id: docRef.id,
        data: finalData,
        updated_at: new Date().toISOString()
      }, { onConflict: "path" });

    if (error) throw error;
  } catch (err) {
    console.warn(`[Supabase Compatibility] setDoc failed on ${docRef.path}, storing locally:`, err);
    applyLocalSet();
  }
};

export const updateDoc = async (docRef: MockDocRef, updates: any): Promise<void> => {
  const applyLocalUpdate = () => {
    const localDocs = getLocalDocs();
    const index = localDocs.findIndex(d => d.path === docRef.path);
    const currentData = index !== -1 ? localDocs[index].data : {};
    const finalData = applyFieldValues(currentData, updates);

    const newDoc: FallbackDoc = {
      path: docRef.path,
      collection: docRef.collectionName,
      id: docRef.id,
      data: finalData,
      updated_at: new Date().toISOString()
    };

    if (index !== -1) {
      localDocs[index] = newDoc;
    } else {
      localDocs.push(newDoc);
    }
    saveLocalDocs(localDocs);
  };

  if (!isRealSupabase) {
    applyLocalUpdate();
    return;
  }

  await ensureHydrated();

  const current = memoryDb.get(docRef.path);
  const currentData = current?.data || {};
  const finalData = applyFieldValues(currentData, updates);

  // Optimistic commit: update UI instantly, persist to network in the background
  setCached({
    path: docRef.path,
    collection: docRef.collectionName,
    id: docRef.id,
    data: finalData,
    updated_at: new Date().toISOString()
  });
  notifyListeners(docRef.path);

  try {
    const { error } = await supabase
      .from("documents")
      .upsert({
        path: docRef.path,
        collection: docRef.collectionName,
        id: docRef.id,
        data: finalData,
        updated_at: new Date().toISOString()
      }, { onConflict: "path" });

    if (error) throw error;
  } catch (err) {
    console.warn(`[Supabase Compatibility] updateDoc failed on ${docRef.path}, storing locally:`, err);
    applyLocalUpdate();
  }
};

export const addDoc = async (colRef: MockColRef, data: any): Promise<MockDocRef> => {
  const randomId = "id_" + Math.random().toString(36).substr(2, 9);
  const docRef = doc(colRef, randomId);
  await setDoc(docRef, data);
  return docRef;
};

export const deleteDoc = async (docRef: MockDocRef): Promise<void> => {
  const applyLocalDelete = () => {
    const localDocs = getLocalDocs();
    const filtered = localDocs.filter(d => d.path !== docRef.path);
    saveLocalDocs(filtered);
  };

  if (!isRealSupabase) {
    applyLocalDelete();
    return;
  }

  await ensureHydrated();

  // Optimistic delete: update UI instantly, persist to network in the background
  const existing = memoryDb.get(docRef.path);
  if (existing) {
    removeCached(existing);
  } else {
    memoryDb.delete(docRef.path);
  }
  notifyListeners(docRef.path);

  try {
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("path", docRef.path);

    if (error) throw error;
  } catch (err) {
    console.warn(`[Supabase Compatibility] deleteDoc failed on ${docRef.path}, removing locally:`, err);
    applyLocalDelete();
  }
};

// Realtime-free snapshot listener with local event-pubsub and resource-friendly smart polling
const getListenerPath = (queryOrDoc: MockDocRef | MockColRef | MockQuery): string => {
  if (queryOrDoc instanceof MockDocRef) return queryOrDoc.path;
  if (queryOrDoc instanceof MockColRef) return queryOrDoc.path;
  return queryOrDoc.colRef.path;
};

export const onSnapshot = (
  queryOrDoc: MockDocRef | MockColRef | MockQuery,
  onNext: (snap: any) => void,
  onError?: (err: any) => void
) => {
  const isDoc = queryOrDoc instanceof MockDocRef;

  // 1. Fire initial data load
  if (isDoc) {
    getDoc(queryOrDoc as MockDocRef).then(onNext).catch(onError);
  } else {
    getDocs(queryOrDoc as MockColRef | MockQuery).then(onNext).catch(onError);
  }

  // Always register local callback to allow instant client-side updates upon local writes
  const localCb = () => {
    if (isDoc) {
      getDoc(queryOrDoc as MockDocRef).then(onNext).catch(onError);
    } else {
      getDocs(queryOrDoc as MockColRef | MockQuery).then(onNext).catch(onError);
    }
  };
  const listener = { cb: localCb, path: getListenerPath(queryOrDoc) };
  listeners.add(listener);

  // Return unsubscribe handler
  return () => {
    listeners.delete(listener);
  };
};

// Global refresh: one gentle request every 30s (only while the window is focused)
// catches remote changes for all listeners at once instead of polling per listener.
if (isRealSupabase) {
  setInterval(() => {
    if (typeof document !== "undefined" && document.hidden) {
      return;
    }
    refreshFromServer();
  }, 30000);
}

// Transactions Support (Simple Lock-free execution wrapper)
export const runTransaction = async (dbInstance: any, updateFunction: (transaction: any) => Promise<any>): Promise<any> => {
  const transactionObj = {
    get: async (docRef: MockDocRef) => getDoc(docRef),
    set: async (docRef: MockDocRef, data: any, options?: any) => setDoc(docRef, data, options),
    update: async (docRef: MockDocRef, data: any) => updateDoc(docRef, data),
    delete: async (docRef: MockDocRef) => deleteDoc(docRef)
  };
  return await updateFunction(transactionObj);
};

export const writeBatch = (_dbInstance?: any) => {
  const operations: (() => Promise<void>)[] = [];
  return {
    set: (docRef: MockDocRef, data: any, options?: any) => {
      operations.push(() => setDoc(docRef, data, options));
    },
    update: (docRef: MockDocRef, data: any) => {
      operations.push(() => updateDoc(docRef, data));
    },
    delete: (docRef: MockDocRef) => {
      operations.push(() => deleteDoc(docRef));
    },
    commit: async () => {
      for (const op of operations) {
        await op();
      }
    }
  };
};

// 6. Auth Emulation APIs
let cachedUser: any = null;

export const mapSupabaseUser = (sbUser: any) => {
  if (!sbUser) {
    cachedUser = null;
    return null;
  }
  const mapped = {
    uid: sbUser.id,
    id: sbUser.id,
    email: sbUser.email,
    displayName: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || "رائد فضاء",
    photoURL: sbUser.user_metadata?.avatar_url || "",
    emailVerified: !!sbUser.email_confirmed_at,
    isAnonymous: false,
    providerData: [
      {
        providerId: "google",
        uid: sbUser.id,
        displayName: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || "رائد فضاء",
        email: sbUser.email,
        photoURL: sbUser.user_metadata?.avatar_url || ""
      }
    ],
    getIdToken: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token || "";
    }
  };
  cachedUser = mapped;
  return mapped;
};

// Eagerly populate cachedUser from current session
if (typeof window !== "undefined") {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      mapSupabaseUser(session.user);
    }
  }).catch(() => {});

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      mapSupabaseUser(session.user);
    } else {
      cachedUser = null;
    }
  });
}

// Helper to get the correct redirect URL for the OAuth popup.
// Must stay on the SAME origin as the app so the PKCE code_verifier (stored in
// that origin's localStorage) can complete the session exchange inside the popup.
const getRedirectUrl = () => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const base = import.meta.env.BASE_URL || "/";
  const basePath = base.startsWith("/") ? base : "/" + base;
  return (origin + basePath).replace(/\/+$/, "") || "https://ais-dev-h7znwe7lpee7pk7vyclbkj-6254332619.europe-west2.run.app";
};

// Google sign in via OAuth popup or redirection
export const signInWithPopup = async (authInstance: any, providerInstance: any) => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getRedirectUrl(),
      skipBrowserRedirect: true
    }
  });
  if (error) throw error;

  if (data?.url) {
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      data.url,
      "supabase-oauth",
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
    );
    if (popup) {
      popup.focus();

      // Poll to detect when the popup is closed (by user or automatic closing) and force a state check
      const pollTimer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(pollTimer);
          // Refresh session immediately
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
              // Fire storage/auth events to trigger immediate state refresh in UI
              window.dispatchEvent(new Event("storage"));
            }
          });
        }
      }, 500);
    }
  }

  return { user: null }; // OAuth redirects, callback handles user state
};

export const signOut = async (authInstance: any) => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const onAuthStateChanged = (authInstance: any, callback: (user: any) => void) => {
  // Try to resolve user synchronously from cachedUser or localStorage first to avoid flash of loading
  let resolvedSync = false;
  if (cachedUser) {
    callback(cachedUser);
    resolvedSync = true;
  } else {
    try {
      if (typeof window !== "undefined") {
        const keys = Object.keys(localStorage);
        const supabaseKey = keys.find(k => k.startsWith("sb-") && k.endsWith("-auth-token"));
        if (supabaseKey) {
          const raw = localStorage.getItem(supabaseKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.user) {
              const mapped = mapSupabaseUser(parsed.user);
              callback(mapped);
              resolvedSync = true;
            }
          }
        }
      }
    } catch (e) {
      console.warn("Failed sync check in onAuthStateChanged:", e);
    }
  }

  // Trigger initial auth check
  supabase.auth.getSession().then(({ data: { session } }) => {
    callback(session?.user ? mapSupabaseUser(session.user) : null);
  }).catch(() => {
    if (!resolvedSync) callback(null);
  });

  // Wire up state listener
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ? mapSupabaseUser(session.user) : null);
  });

  // Additional check when the window gains focus to guarantee instantaneous session synchronization
  const handleFocus = () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      callback(session?.user ? mapSupabaseUser(session.user) : null);
    });
  };
  window.addEventListener("focus", handleFocus);

  // Set up storage event listener for instant state sync across popups, tabs and iframes
  const handleStorage = (e: StorageEvent) => {
    if (e.key && e.key.startsWith("sb-") && e.key.endsWith("-auth-token")) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        callback(session?.user ? mapSupabaseUser(session.user) : null);
      });
    }
  };
  window.addEventListener("storage", handleStorage);

  // Set up a BroadcastChannel to receive auth updates from popup
  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel("supabase-auth-channel");
    channel.onmessage = (event) => {
      if (event.data?.type === "OAUTH_SUCCESS") {
        supabase.auth.getSession().then(({ data: { session } }) => {
          callback(session?.user ? mapSupabaseUser(session.user) : null);
        });
      }
    };
  } catch (e) {
    console.error("Failed to initialize BroadcastChannel in listener:", e);
  }

  // Set up message listener for postMessage
  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type === "supabase-oauth-success") {
      supabase.auth.getSession().then(({ data: { session } }) => {
        callback(session?.user ? mapSupabaseUser(session.user) : null);
      });
    }
  };
  window.addEventListener("message", handleMessage);

  return () => {
    subscription.unsubscribe();
    window.removeEventListener("focus", handleFocus);
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("message", handleMessage);
    if (channel) {
      try {
        channel.close();
      } catch (e) {
        console.error("Error closing channel:", e);
      }
    }
  };
};

export const onIdTokenChanged = (authInstance: any, callback: (user: any) => void) => {
  return onAuthStateChanged(authInstance, callback);
};

export const signInWithRedirect = async (authInstance: any, providerInstance: any) => {
  return signInWithPopup(authInstance, providerInstance);
};

export const getRedirectResult = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ? { user: mapSupabaseUser(session.user) } : null;
};

export const createUserWithEmailAndPassword = async (authInstance: any, email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return { user: data.user ? mapSupabaseUser(data.user) : null };
};

export const signInWithEmailAndPassword = async (authInstance: any, email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { user: data.user ? mapSupabaseUser(data.user) : null };
};

export const sendPasswordResetEmail = async (authInstance: any, email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getRedirectUrl() + "/reset-password",
  });
  if (error) throw error;
};

export const sendEmailVerification = async (userInstance: any) => {
  console.log("sendEmailVerification is managed by Supabase flow on signup.");
};

export const sendSignInLinkToEmail = async (authInstance: any, email: string, actionCodeSettings: any) => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: actionCodeSettings?.url || getRedirectUrl()
    }
  });
  if (error) throw error;
};

export const signInWithEmailLink = async (authInstance: any, email: string, link: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  return { user: session?.user ? mapSupabaseUser(session.user) : null };
};

export const updateEmail = async (userInstance: any, newEmail: string) => {
  const { data, error } = await supabase.auth.updateUser({ email: newEmail });
  if (error) throw error;
  return { user: data.user ? mapSupabaseUser(data.user) : null };
};

export const updatePassword = async (userInstance: any, newPassword: string) => {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return { user: data.user ? mapSupabaseUser(data.user) : null };
};

export const updateProfile = async (userInstance: any, profile: { displayName?: string; photoURL?: string }) => {
  const metadata: any = {};
  if (profile.displayName !== undefined) metadata.full_name = profile.displayName;
  if (profile.photoURL !== undefined) metadata.avatar_url = profile.photoURL;
  const { data, error } = await supabase.auth.updateUser({
    data: metadata
  });
  if (error) throw error;
  return { user: data.user ? mapSupabaseUser(data.user) : null };
};

export const verifyBeforeUpdateEmail = async (userInstance: any, newEmail: string) => {
  const { data, error } = await supabase.auth.updateUser({ email: newEmail });
  if (error) throw error;
  return { user: data.user ? mapSupabaseUser(data.user) : null };
};

// Dummy provider instances
export class GoogleAuthProvider {}
export class FacebookAuthProvider {}
export class GithubAuthProvider {}
export class TwitterAuthProvider {}
export class OAuthProvider {}
export class EmailAuthProvider {
  static credential(email: string, password: string) {
    return { providerId: "password", email, password };
  }
}
export class PhoneAuthProvider {}
export class RecaptchaVerifier {}

// Mock Auth wrapper
class MockAuth {
  get currentUser() {
    if (cachedUser) return cachedUser;
    try {
      if (typeof window !== "undefined") {
        const keys = Object.keys(localStorage);
        const supabaseKey = keys.find(k => k.startsWith("sb-") && k.endsWith("-auth-token"));
        if (supabaseKey) {
          const raw = localStorage.getItem(supabaseKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.user) {
              return mapSupabaseUser(parsed.user);
            }
          }
        }
      }
    } catch (e) {
      console.warn("Failed to parse synchronous user from localStorage:", e);
    }
    return null;
  }
}

// 7. Global Exports
export const auth = new MockAuth();
export const db = {};
export const initializeApp = (_config?: any) => ({});
export const getFirestore = (_app?: any, _databaseId?: any) => db;
export const initializeFirestore = (_app?: any, _settings?: any, _databaseId?: any) => db;
export const getAuth = (_app?: any) => auth;
export const disableNetwork = async () => {};
export const getDocFromServer = getDoc;

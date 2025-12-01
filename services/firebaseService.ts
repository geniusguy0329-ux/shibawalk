import { initializeApp, FirebaseApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  setDoc, 
  doc, 
  query, 
  orderBy, 
  onSnapshot,
  Firestore,
  limit
} from "firebase/firestore";
import { FirebaseConfig, WalkRecord } from "../types";

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export const initFirebase = (config: FirebaseConfig) => {
  try {
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    db = getFirestore(app);
    return true;
  } catch (error) {
    console.error("Firebase init error:", error);
    return false;
  }
};

export const saveRecordToCloud = async (record: WalkRecord) => {
  if (!db) return;
  try {
    // Use record.id as the document ID
    await setDoc(doc(db, "walks", record.id), record);
  } catch (error) {
    console.error("Error saving to cloud:", error);
    throw error;
  }
};

export const subscribeToWalks = (onUpdate: (records: WalkRecord[]) => void) => {
  if (!db) return () => {};

  // Query last 100 walks to avoid downloading too much data
  const q = query(
    collection(db, "walks"), 
    orderBy("startTime", "desc"), 
    limit(100)
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const walks: WalkRecord[] = [];
    querySnapshot.forEach((doc) => {
      walks.push(doc.data() as WalkRecord);
    });
    onUpdate(walks);
  }, (error) => {
    console.error("Cloud sync error:", error);
  });

  return unsubscribe;
};

export const isFirebaseInitialized = () => !!db;
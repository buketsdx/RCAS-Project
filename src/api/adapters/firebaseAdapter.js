
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';

let db = null;
let auth = null;

export const firebaseAdapter = {
  name: 'firebase',
  
  initialize: async (config) => {
    if (!config?.apiKey || !config?.projectId) {
      throw new Error("Firebase API Key and Project ID are required");
    }
    const app = initializeApp(config);
    db = getFirestore(app);
    auth = getAuth(app);
    return Promise.resolve();
  },

  list: async (entityName, context) => {
    if (!db) throw new Error("Firebase not initialized");
    
    let q = collection(db, entityName);
    
    // Filter by Company ID
    const globalEntities = ['User', 'Company', 'Currency', 'Settings']; 
    if (context?.companyId && !globalEntities.includes(entityName)) {
      q = query(q, where("company_id", "==", context.companyId));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  create: async (entityName, data, context) => {
    if (!db) throw new Error("Firebase not initialized");

    const newRecord = { ...data };
    if (context?.companyId && !newRecord.company_id) {
      newRecord.company_id = context.companyId;
    }

    const docRef = await addDoc(collection(db, entityName), newRecord);
    return { id: docRef.id, ...newRecord };
  },

  update: async (entityName, id, data) => {
    if (!db) throw new Error("Firebase not initialized");
    const docRef = doc(db, entityName, id);
    await updateDoc(docRef, data);
    return { id, ...data };
  },

  delete: async (entityName, id) => {
    if (!db) throw new Error("Firebase not initialized");
    await deleteDoc(doc(db, entityName, id));
    return { success: true };
  },

  auth: {
    login: async (username, password) => {
      if (!auth) throw new Error("Firebase not initialized");
      const userCredential = await signInWithEmailAndPassword(auth, username, password);
      return userCredential.user;
    },
    
    register: async ({ email, password }) => {
      if (!auth) throw new Error("Firebase not initialized");
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    },

    me: async () => {
      if (!auth) return null;
      return auth.currentUser;
    },

    logout: async () => {
      if (!auth) return;
      await signOut(auth);
    }
  }
};

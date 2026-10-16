import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  doc,
  getDoc,
  setDoc,
  getDocFromServer,
  type Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import type { StudentProfile } from '../types';

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
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

let dbInstance: Firestore;
try {
  dbInstance = initializeFirestore(
    app,
    {
      experimentalAutoDetectLongPolling: true,
    },
    firebaseConfig.firestoreDatabaseId
  );
} catch {
  dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db: Firestore = dbInstance;
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Validate connection per skill requirement
async function testConnection() {
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('REPLACE_')) {
    console.info('Firebase API key is a placeholder; operating seamlessly in local student storage mode.');
    return;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, using local student storage.');
    }
  }
}
testConnection();

const LOCAL_STORAGE_KEY = 'yemen_chem_student_profile';

export const DEFAULT_PROFILE: StudentProfile = {
  uid: 'guest_student',
  displayName: 'طالب الكيمياء',
  email: '',
  isGuest: true,
  totalPoints: 0,
  level: 1,
  completedLessons: [],
  completedQuizzes: [],
  achievements: [],
  mistakeLog: {},
  experimentsCount: 0,
  updatedAt: new Date().toISOString(),
};

export class StorageService {
  private static cachedProfile: StudentProfile | null = null;
  private static listeners: ((profile: StudentProfile) => void)[] = [];

  static subscribe(callback: (profile: StudentProfile) => void) {
    this.listeners.push(callback);
    if (this.cachedProfile) {
      callback(this.cachedProfile);
    }
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private static notify(profile: StudentProfile) {
    this.cachedProfile = profile;
    for (const listener of this.listeners) {
      listener(profile);
    }
  }

  static getLocalProfile(): StudentProfile {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (data) {
        return { ...DEFAULT_PROFILE, ...JSON.parse(data) };
      }
    } catch {
      // LocalStorage unavailable
    }
    return { ...DEFAULT_PROFILE };
  }

  static saveLocalProfile(profile: StudentProfile) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // ignore
    }
    this.notify(profile);
  }

  static async loadProfile(user: User | null): Promise<StudentProfile> {
    if (!user) {
      const local = this.getLocalProfile();
      this.notify(local);
      return local;
    }

    const path = `users/${user.uid}`;
    try {
      const ref = doc(db, 'users', user.uid);
      const snapshot = await getDoc(ref);
      if (snapshot.exists()) {
        const data = snapshot.data() as Partial<StudentProfile>;
        const profile: StudentProfile = {
          ...DEFAULT_PROFILE,
          ...data,
          uid: user.uid,
          displayName: user.displayName || 'طالب متميز',
          email: user.email || '',
          isGuest: false,
        };
        this.saveLocalProfile(profile);
        return profile;
      } else {
        // Create initial cloud profile
        const local = this.getLocalProfile();
        const newProfile: StudentProfile = {
          ...local,
          uid: user.uid,
          displayName: user.displayName || 'طالب متميز',
          email: user.email || '',
          isGuest: false,
          updatedAt: new Date().toISOString(),
        };
        await setDoc(ref, { ...newProfile, id: user.uid });
        this.saveLocalProfile(newProfile);
        return newProfile;
      }
    } catch (error) {
      console.warn('Could not fetch cloud profile, falling back to local profile', error);
      const local = this.getLocalProfile();
      this.notify(local);
      return local;
    }
  }

  static async updateProfile(updates: Partial<StudentProfile>): Promise<StudentProfile> {
    const current = this.cachedProfile || this.getLocalProfile();
    const updated: StudentProfile = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Calculate level based on total points: Level 1 (0-150), Level 2 (151-350), Level 3 (351-600), etc.
    const pts = updated.totalPoints;
    let newLevel = 1;
    if (pts >= 1000) newLevel = 5;
    else if (pts >= 600) newLevel = 4;
    else if (pts >= 350) newLevel = 3;
    else if (pts >= 150) newLevel = 2;
    updated.level = newLevel;

    this.saveLocalProfile(updated);

    if (auth.currentUser && !updated.isGuest) {
      const path = `users/${auth.currentUser.uid}`;
      try {
        const ref = doc(db, 'users', auth.currentUser.uid);
        await setDoc(ref, { ...updated, id: auth.currentUser.uid }, { merge: true });
      } catch (err) {
        console.warn('Failed to sync profile update to cloud:', err);
      }
    }

    return updated;
  }

  static async addPoints(amount: number, reason?: string): Promise<StudentProfile> {
    const current = this.cachedProfile || this.getLocalProfile();
    const newPoints = Math.max(0, current.totalPoints + amount);
    return this.updateProfile({ totalPoints: newPoints });
  }

  static async markLessonCompleted(lessonId: string): Promise<StudentProfile> {
    const current = this.cachedProfile || this.getLocalProfile();
    if (current.completedLessons.includes(lessonId)) return current;
    const completed = [...current.completedLessons, lessonId];
    return this.updateProfile({
      completedLessons: completed,
      totalPoints: current.totalPoints + 50, // 50 XP per completed lesson
    });
  }

  static async logMistake(category: string): Promise<StudentProfile> {
    const current = this.cachedProfile || this.getLocalProfile();
    const mistakes = { ...current.mistakeLog };
    mistakes[category] = (mistakes[category] || 0) + 1;
    return this.updateProfile({ mistakeLog: mistakes });
  }

  static async signInWithGoogle(): Promise<StudentProfile> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return await this.loadProfile(result.user);
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      throw error;
    }
  }

  static async logout(): Promise<void> {
    await signOut(auth);
    const guest = { ...DEFAULT_PROFILE };
    this.saveLocalProfile(guest);
  }
}

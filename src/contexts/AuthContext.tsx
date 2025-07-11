import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import type { User, UserProfile, UserProvider } from "../types";

// Default profile for a new user
const createDefaultProfile = (userId: string): UserProfile => ({
  userId,
  completedEventIds: [],
  dailyStreak: 1,
  lastLogin: new Date().toISOString(),
  globalQuizStats: {
    highScore: 0,
    lastScore: 0,
    lastPlayed: new Date(0).toISOString(),
  },
  // FIX: Initialize with null instead of undefined
  lastViewedEventId: null,
  lastViewedTopicId: null,
});

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  login: (provider: UserProvider) => void;
  logout: () => void;
  markEventAsCompleted: (eventId: string) => void;
  updateQuizScore: (score: number) => void;
  setLastViewedLocation: (topicId: string, eventId: string) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

// Helper to check for streak logic
const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
const isYesterday = (d1: Date, d2: Date) => {
    const yesterday = new Date(d2);
    yesterday.setDate(yesterday.getDate() - 1);
    return isSameDay(d1, yesterday);
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          const newUser: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || "Anonymous User",
            avatarUrl: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
            provider: firebaseUser.providerData[0]?.providerId as UserProvider || 'guest',
          };
          await setDoc(userDocRef, { ...newUser, createdAt: serverTimestamp() });
          setUser(newUser);
        } else {
          setUser({ ...userDoc.data(), id: userDoc.id } as User);
        }

        await loadOrCreateProfile(firebaseUser);

      } else {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadOrCreateProfile = async (firebaseUser: FirebaseUser) => {
    const profileDocRef = doc(db, "userProfiles", firebaseUser.uid);
    const profileDoc = await getDoc(profileDocRef);

    if (profileDoc.exists()) {
      const loadedProfile = { ...profileDoc.data(), userId: profileDoc.id } as UserProfile;
      const today = new Date();
      const lastLoginDate = new Date(loadedProfile.lastLogin);

      if (!isSameDay(lastLoginDate, today)) {
          if (isYesterday(lastLoginDate, today)) {
              loadedProfile.dailyStreak += 1;
          } else {
              loadedProfile.dailyStreak = 1;
          }
          loadedProfile.lastLogin = today.toISOString();
          await setDoc(profileDocRef, loadedProfile, { merge: true });
      }
      setProfile(loadedProfile);
    } else {
      const newProfile = createDefaultProfile(firebaseUser.uid);
      await setDoc(profileDocRef, newProfile);
      setProfile(newProfile);
    }
  };

  const login = async (providerId: UserProvider) => {
    let provider;
    if (providerId === "google") {
      provider = new GoogleAuthProvider();
    } else if (providerId === "facebook") {
      provider = new FacebookAuthProvider();
    } else {
        console.log("Guest/Admin login is a custom flow.");
        return;
    }
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Authentication failed:", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };
  
  const updateProfileInDb = async (updatedProfile: Partial<UserProfile>) => {
      if (!user) return;
      const profileRef = doc(db, "userProfiles", user.id);
      await setDoc(profileRef, updatedProfile, { merge: true });
  }

  const markEventAsCompleted = (eventId: string) => {
    if (profile && !profile.completedEventIds.includes(eventId)) {
      const updatedProfile = {
        ...profile,
        completedEventIds: [...profile.completedEventIds, eventId],
      };
      setProfile(updatedProfile);
      updateProfileInDb({ completedEventIds: updatedProfile.completedEventIds });
    }
  };

  const updateQuizScore = (score: number) => {
      if (profile) {
          const updatedStats = {
              highScore: Math.max(profile.globalQuizStats.highScore, score),
              lastScore: score,
              lastPlayed: new Date().toISOString(),
          };
          setProfile({...profile, globalQuizStats: updatedStats });
          updateProfileInDb({ globalQuizStats: updatedStats });
      }
  };

  const setLastViewedLocation = (topicId: string, eventId: string) => {
      if (profile) {
          const updatedProfile = {
              ...profile,
              lastViewedTopicId: topicId,
              lastViewedEventId: eventId,
          };
          setProfile(updatedProfile);
          updateProfileInDb({ lastViewedTopicId: topicId, lastViewedEventId: eventId });
      }
  };

  if (authLoading) {
      return <div className="w-screen h-screen flex items-center justify-center bg-base dark:bg-gray-900"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary dark:border-green-400"></div></div>;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        login,
        logout,
        markEventAsCompleted,
        updateQuizScore,
        setLastViewedLocation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

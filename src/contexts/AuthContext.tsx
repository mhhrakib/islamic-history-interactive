import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  useCallback,
} from "react";
import type { User, UserProfile, UserProvider } from "../types";

const defaultProfile: UserProfile = {
  userId: "",
  completedEventIds: [],
  dailyStreak: 0,
  lastLogin: new Date(0).toISOString(),
  globalQuizStats: {
    highScore: 0,
    lastScore: 0,
    lastPlayed: new Date(0).toISOString(),
  },
  lastViewedEventId: undefined,
  lastViewedTopicId: undefined,
};

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  login: (provider: UserProvider) => void;
  logout: () => void;
  markEventAsCompleted: (eventId: number) => void;
  updateQuizScore: (score: number) => void;
  setLastViewedLocation: (topicId: number, eventId: number) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

const isSameDay = (date1: Date, date2: Date) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const isYesterday = (date1: Date, date2: Date) => {
  const yesterday = new Date(date2);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date1, yesterday);
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
        if (parsedUser.provider === "admin") {
          setIsAdmin(true);
        }
        if (
          parsedUser.provider !== "guest" &&
          parsedUser.provider !== "admin"
        ) {
          loadProfile(parsedUser.id);
        }
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem("user");
    }
  }, []);

  const loadProfile = useCallback((userId: string) => {
    try {
      const storedProfile = localStorage.getItem(`profile-${userId}`);
      let loadedProfile: UserProfile;
      if (storedProfile) {
        loadedProfile = JSON.parse(storedProfile);
      } else {
        loadedProfile = { ...defaultProfile, userId };
      }

      const today = new Date();
      const lastLoginDate = new Date(loadedProfile.lastLogin);

      if (!isSameDay(lastLoginDate, today)) {
        if (isYesterday(lastLoginDate, today)) {
          loadedProfile.dailyStreak += 1;
        } else {
          loadedProfile.dailyStreak = 1;
        }
        loadedProfile.lastLogin = today.toISOString();
      }

      setProfile(loadedProfile);
      localStorage.setItem(`profile-${userId}`, JSON.stringify(loadedProfile));
    } catch (error) {
      console.error("Failed to load or update profile", error);
      setProfile({ ...defaultProfile, userId });
    }
  }, []);

  const login = (provider: UserProvider) => {
    let newUser: User;
    setIsAdmin(false);
    setProfile(null);

    switch (provider) {
      case "google":
        newUser = {
          id: "user-google-123",
          name: "Al-Khwarizmi",
          avatarUrl: "https://i.pravatar.cc/150?u=khwarizmi",
          provider: "google",
        };
        loadProfile(newUser.id);
        break;
      case "facebook":
        newUser = {
          id: "user-facebook-456",
          name: "Ibn Battuta",
          avatarUrl: "https://i.pravatar.cc/150?u=battuta",
          provider: "facebook",
        };
        loadProfile(newUser.id);
        break;
      case "admin":
        newUser = {
          id: "user-admin-001",
          name: "Site Admin",
          avatarUrl: "https://i.pravatar.cc/150?u=admin",
          provider: "admin",
        };
        setIsAdmin(true);
        break;
      case "guest":
      default:
        newUser = {
          id: "user-guest-789",
          name: "Guest",
          avatarUrl: "",
          provider: "guest",
        };
        break;
    }
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
    localStorage.removeItem("user");
  };

  const updateProfile = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    localStorage.setItem(
      `profile-${updatedProfile.userId}`,
      JSON.stringify(updatedProfile)
    );
  };

  const markEventAsCompleted = (eventId: number) => {
    if (
      profile &&
      user?.provider !== "guest" &&
      !profile.completedEventIds.includes(eventId)
    ) {
      const updatedProfile = {
        ...profile,
        completedEventIds: [...profile.completedEventIds, eventId],
      };
      updateProfile(updatedProfile);
    }
  };

  const updateQuizScore = (score: number) => {
    if (profile && user?.provider !== "guest") {
      const updatedProfile = {
        ...profile,
        globalQuizStats: {
          highScore: Math.max(profile.globalQuizStats.highScore, score),
          lastScore: score,
          lastPlayed: new Date().toISOString(),
        },
      };
      updateProfile(updatedProfile);
    }
  };

  const setLastViewedLocation = (topicId: number, eventId: number) => {
    if (profile && user?.provider !== "guest") {
      const updatedProfile = {
        ...profile,
        lastViewedTopicId: topicId,
        lastViewedEventId: eventId,
      };
      updateProfile(updatedProfile);
    }
  };

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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

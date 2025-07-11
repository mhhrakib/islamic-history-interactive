export type UserProvider = 'google' | 'facebook' | 'guest' | 'admin';

export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  provider: UserProvider;
}

export interface UserProfile {
  userId: string;
  completedEventIds: string[];
  dailyStreak: number;
  lastLogin: string; // ISO date string
  globalQuizStats: {
    highScore: number;
    lastScore: number;
    lastPlayed: string; // ISO date string
  };
  // Changed from optional string to allow null
  lastViewedTopicId: string | null; 
  lastViewedEventId: string | null;
}

export interface GlobalQuizItem {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface HistoricalTopic {
  id: string;
  name:string;
  title: string;
  period: string;
  bio: string;
  events: AppEvent[];
  isFeatured?: boolean;
}

export interface HistoricalEra {
  id: string;
  title: string;
  description: string;
  topics: HistoricalTopic[];
}

export interface Location {
  name: string;
  coords: { lat: number; lng: number };
  zoom: number;
}

export interface GlossaryItem {
  term: string;
  explanation:string;
}

export interface Quote {
  arabic?: string;
  translation: string;
  source: string;
}

export interface QuizItem {
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface StoryImage {
  src: string;
  caption: string;
}

export interface AppEvent {
  id: string;
  year: string;
  title: string;
  location?: Location;
  story: string;
  lessons: string[];
  glossary: GlossaryItem[];
  quiz: QuizItem[];
  images?: StoryImage[];
  quotes?: Quote[];
}

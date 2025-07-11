import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
} from "react";
import { collection, getDocs, query, orderBy, addDoc, updateDoc, doc, deleteDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebaseConfig"; // Import the db instance
import type { HistoricalEra, HistoricalTopic, AppEvent } from "../types";
import { LanguageContext } from "./LanguageContext";

// A helper to get the next ID, useful for local state before a DB write if needed.
const getNextId = (items: { id: number | string }[]): number => {
    if (!items || items.length === 0) return 1;
    const numericIds = items.map(i => typeof i.id === 'string' ? 0 : i.id);
    return Math.max(...numericIds, 0) + 1;
};

// A helper for reordering arrays, useful for drag-and-drop.
const reorder = <T,>(list: T[], startIndex: number, endIndex: number): T[] => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

interface DataContextType {
  eras: HistoricalEra[];
  isLoading: boolean;
  addEra: (title: string, description: string) => Promise<void>;
  updateEra: (updatedEra: HistoricalEra) => Promise<void>;
  addTopic: (
    eraId: string,
    data: {
      name: string;
      title: string;
      period: string;
      bio: string;
      isFeatured?: boolean;
    }
  ) => Promise<void>;
  updateTopic: (updatedTopic: HistoricalTopic) => Promise<void>;
  deleteTopic: (topicId: string) => Promise<void>;
  addEvent: (topicId: string, newEvent: Omit<AppEvent, 'id'>) => Promise<void>;
  updateEvent: (updatedEvent: AppEvent) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  reorderEras: (startIndex: number, endIndex: number) => Promise<void>;
  reorderTopics: (eraId: string, startIndex: number, endIndex: number) => Promise<void>;
  reorderEvents: (topicId: string, startIndex: number, endIndex: number) => Promise<void>;
  importData: (newEras: HistoricalEra[]) => Promise<void>;
}

export const DataContext = createContext<DataContextType | undefined>(
  undefined
);

export const DataProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [eras, setEras] = useState<HistoricalEra[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const langContext = useContext(LanguageContext);
  const language = langContext?.language || "en";

  // This effect now loads all data from Firestore on initial load or language change.
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const langSuffix = `_${language}`;
        
        // Fetch all collections in parallel for efficiency
        const erasQuery = query(collection(db, `eras${langSuffix}`), orderBy("order"));
        const topicsQuery = query(collection(db, `topics${langSuffix}`), orderBy("order"));
        const eventsQuery = query(collection(db, `events${langSuffix}`), orderBy("order"));

        const [erasSnapshot, topicsSnapshot, eventsSnapshot] = await Promise.all([
            getDocs(erasQuery),
            getDocs(topicsQuery),
            getDocs(eventsQuery)
        ]);

        // Process snapshots into typed arrays
        const erasData = erasSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as HistoricalEra[];
        const topicsData = topicsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as (HistoricalTopic & { eraId: string })[];
        const eventsData = eventsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as (AppEvent & { topicId: string })[];

        // Assemble the nested data structure client-side
        const assembledEras = erasData.map(era => ({
          ...era,
          topics: topicsData
            .filter(topic => topic.eraId === era.id)
            .map(topic => ({
              ...topic,
              events: eventsData.filter(event => event.topicId === topic.id)
            }))
        }));
        
        setEras(assembledEras);
      } catch (error) {
        console.error("Failed to load data from Firestore.", error);
        setEras([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [language]);

  // --- CRUD Functions (to be implemented) ---
  // These functions will now interact with Firestore instead of local state.
  // For now, they are placeholders. We will implement them in the next phase.

  const addEra = async (title: string, description: string) => { console.log("addEra not implemented"); };
  const updateEra = async (updatedEra: HistoricalEra) => { console.log("updateEra not implemented"); };
  const addTopic = async (eraId: string, data: any) => { console.log("addTopic not implemented"); };
  const updateTopic = async (updatedTopic: HistoricalTopic) => { console.log("updateTopic not implemented"); };
  const deleteTopic = async (topicId: string) => { console.log("deleteTopic not implemented"); };
  const addEvent = async (topicId: string, newEvent: Omit<AppEvent, 'id'>) => { console.log("addEvent not implemented"); };
  const updateEvent = async (updatedEvent: AppEvent) => { console.log("updateEvent not implemented"); };
  const deleteEvent = async (eventId: string) => { console.log("deleteEvent not implemented"); };
  const reorderEras = async (startIndex: number, endIndex: number) => { console.log("reorderEras not implemented"); };
  const reorderTopics = async (eraId: string, startIndex: number, endIndex: number) => { console.log("reorderTopics not implemented"); };
  const reorderEvents = async (topicId: string, startIndex: number, endIndex: number) => { console.log("reorderEvents not implemented"); };
  const importData = async (newEras: HistoricalEra[]) => { console.log("importData not implemented"); };


  return (
    <DataContext.Provider
      value={{
        eras,
        isLoading,
        addEra,
        updateEra,
        addTopic,
        updateTopic,
        deleteTopic,
        addEvent,
        updateEvent,
        deleteEvent,
        reorderEras,
        reorderTopics,
        reorderEvents,
        importData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};


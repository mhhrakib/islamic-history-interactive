import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
} from "react";
import type { HistoricalEra, HistoricalTopic, AppEvent } from "../types";
import { processHistoricalData } from "../constants";
import { LanguageContext } from "./LanguageContext";

const getNextId = (items: { id: number }[]): number => {
  if (!items || items.length === 0) return 1;
  return Math.max(...items.map((i) => i.id)) + 1;
};

const reorder = <T,>(list: T[], startIndex: number, endIndex: number): T[] => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

interface DataContextType {
  eras: HistoricalEra[];
  isLoading: boolean;
  addEra: (title: string, description: string) => void;
  updateEra: (updatedEra: HistoricalEra) => void;
  addTopic: (
    eraId: number,
    data: {
      name: string;
      title: string;
      period: string;
      bio: string;
      isFeatured?: boolean;
    }
  ) => void;
  updateTopic: (updatedTopic: HistoricalTopic) => void;
  deleteTopic: (topicId: number) => void;
  addEvent: (topicId: number, newEvent: AppEvent) => void;
  updateEvent: (topicId: number, updatedEvent: AppEvent) => void;
  deleteEvent: (topicId: number, eventId: number) => void;
  reorderEras: (startIndex: number, endIndex: number) => void;
  reorderTopics: (eraId: number, startIndex: number, endIndex: number) => void;
  reorderEvents: (
    topicId: number,
    startIndex: number,
    endIndex: number
  ) => void;
  importData: (newEras: HistoricalEra[]) => void;
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

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const storedDataKey = `islamicHistoryData_${language}`;
        const storedData = localStorage.getItem(storedDataKey);
        if (storedData) {
          setEras(JSON.parse(storedData));
          setIsLoading(false);
          return; // Exit early if we have cached data
        }

        const dataFile =
          language === "bn"
            ? "rawHistoricalData_bn.json"
            : "rawHistoricalData.json";
        const response = await fetch(`/data/${dataFile}`, {
          headers: {
            "Cache-Control": "max-age=3600", // Cache for 1 hour
          },
        });
        if (!response.ok) {
          throw new Error(
            `Failed to fetch historical data: ${response.statusText}`
          );
        }
        const rawData = await response.json();
        const processedData = processHistoricalData(rawData);
        setEras(processedData);
      } catch (error) {
        console.error("Failed to load or parse historical data.", error);
        // Set to empty array to prevent app from crashing if data is corrupted or unavailable
        setEras([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [language]);

  useEffect(() => {
    // Only save to localStorage if data has finished loading and is not empty.
    // This prevents overwriting good localStorage with an empty array on a failed fetch.
    if (!isLoading && eras.length > 0) {
      const storedDataKey = `islamicHistoryData_${language}`;
      localStorage.setItem(storedDataKey, JSON.stringify(eras));
    }
  }, [eras, isLoading, language]);

  const addEra = (title: string, description: string) => {
    setEras((prevEras) => {
      const newEra: HistoricalEra = {
        id: getNextId(prevEras),
        title,
        description,
        topics: [],
      };
      return [...prevEras, newEra];
    });
  };

  const updateEra = (updatedEra: HistoricalEra) => {
    setEras((prevEras) =>
      prevEras.map((era) => (era.id === updatedEra.id ? updatedEra : era))
    );
  };

  const addTopic = (
    eraId: number,
    data: {
      name: string;
      title: string;
      period: string;
      bio: string;
      isFeatured?: boolean;
    }
  ) => {
    setEras((prevEras) => {
      const allTopics = prevEras.flatMap((e) => e.topics);
      const newTopic: HistoricalTopic = {
        id: getNextId(allTopics),
        name: data.name,
        title: data.title,
        period: data.period,
        bio: data.bio,
        isFeatured: data.isFeatured || false,
        events: [],
      };
      return prevEras.map((era) =>
        era.id === eraId ? { ...era, topics: [...era.topics, newTopic] } : era
      );
    });
  };

  const updateTopic = (updatedTopic: HistoricalTopic) => {
    setEras((prevEras) =>
      prevEras.map((era) => ({
        ...era,
        topics: era.topics.map((topic) =>
          topic.id === updatedTopic.id ? updatedTopic : topic
        ),
      }))
    );
  };

  const deleteTopic = (topicId: number) => {
    setEras((prevEras) =>
      prevEras
        .map((era) => ({
          ...era,
          topics: era.topics.filter((topic) => topic.id !== topicId),
        }))
        .filter((era) => era.topics.length > 0 || eras.length > 1)
    ); // Prevents deleting the last era if it becomes empty, unless it's the only one. A better UX would be to handle this in the UI.
  };

  const addEvent = (topicId: number, newEventData: Omit<AppEvent, "id">) => {
    setEras((prevEras) => {
      const allEvents = prevEras
        .flatMap((e) => e.topics)
        .flatMap((t) => t.events);
      const newEvent: AppEvent = { ...newEventData, id: getNextId(allEvents) };

      return prevEras.map((era) => ({
        ...era,
        topics: era.topics.map((topic) => {
          if (topic.id === topicId) {
            return { ...topic, events: [...topic.events, newEvent] };
          }
          return topic;
        }),
      }));
    });
  };

  const updateEvent = (topicId: number, updatedEvent: AppEvent) => {
    setEras((prevEras) =>
      prevEras.map((era) => ({
        ...era,
        topics: era.topics.map((topic) => {
          if (topic.id === topicId) {
            return {
              ...topic,
              events: topic.events.map((event) =>
                event.id === updatedEvent.id ? updatedEvent : event
              ),
            };
          }
          return topic;
        }),
      }))
    );
  };

  const deleteEvent = (topicId: number, eventId: number) => {
    setEras((prevEras) =>
      prevEras.map((era) => ({
        ...era,
        topics: era.topics.map((topic) => {
          if (topic.id === topicId) {
            return {
              ...topic,
              events: topic.events.filter((event) => event.id !== eventId),
            };
          }
          return topic;
        }),
      }))
    );
  };

  const reorderEras = (startIndex: number, endIndex: number) => {
    setEras((prevEras) => reorder(prevEras, startIndex, endIndex));
  };

  const reorderTopics = (
    eraId: number,
    startIndex: number,
    endIndex: number
  ) => {
    setEras((prevEras) =>
      prevEras.map((era) => {
        if (era.id === eraId) {
          return { ...era, topics: reorder(era.topics, startIndex, endIndex) };
        }
        return era;
      })
    );
  };

  const reorderEvents = (
    topicId: number,
    startIndex: number,
    endIndex: number
  ) => {
    setEras((prevEras) =>
      prevEras.map((era) => ({
        ...era,
        topics: era.topics.map((topic) => {
          if (topic.id === topicId) {
            return {
              ...topic,
              events: reorder(topic.events, startIndex, endIndex),
            };
          }
          return topic;
        }),
      }))
    );
  };

  const importData = (newEras: HistoricalEra[]) => {
    setEras(newEras);
    alert(
      "Data successfully imported. The application will now use the new data set."
    );
  };

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

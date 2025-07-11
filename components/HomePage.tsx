import React, { useMemo, useState, useRef, useEffect } from "react";
import type { HistoricalTopic, HistoricalEra } from "../types";
import { useAuth } from "../hooks/useAuth";
import { useData } from "../hooks/useData";
import { useTranslation } from "../hooks/useTranslation";
import { SearchIcon, PlusIcon } from "./icons";
import { EraEditModal } from "./EraEditModal";
import { TopicEditModal } from "./TopicEditModal";

// Newly created modular components
import { HomeHeader } from "./home/HomeHeader";
import { SearchResults, SearchResult } from "./home/SearchResults";
import { Dashboard } from "./home/Dashboard";
import { CommunityHub } from "./home/CommunityHub";
import { EraRow } from "./home/EraRow";

interface HomePageProps {
  onSelectTopic: (id: number, eventId?: number) => void;
  onNavigate: (
    page: "home" | "topic" | "profile" | "quiz" | "leaderboard"
  ) => void;
  onLoginClick: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onSelectTopic,
  onNavigate,
  onLoginClick,
}) => {
  const { user, profile, isAdmin } = useAuth();
  const {
    eras,
    addEra,
    deleteTopic,
    updateTopic,
    addTopic,
    updateEra,
    reorderEras,
    reorderTopics,
  } = useData();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [isEraModalOpen, setIsEraModalOpen] = useState(false);
  const [editingEra, setEditingEra] = useState<HistoricalEra | null>(null);

  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<HistoricalTopic | null>(
    null
  );
  const [targetEraId, setTargetEraId] = useState<number | null>(null);

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "/" || ((e.ctrlKey || e.metaKey) && e.key === "k")) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const allEventsCount = useMemo(
    () => eras.flatMap((e) => e.topics).flatMap((t) => t.events).length,
    [eras]
  );

  const handleAddEra = () => {
    setEditingEra(null);
    setIsEraModalOpen(true);
  };

  const handleEditEra = (era: HistoricalEra) => {
    setEditingEra(era);
    setIsEraModalOpen(true);
  };

  const handleSaveEra = (data: { title: string; description: string }) => {
    if (editingEra) {
      updateEra({ ...editingEra, ...data });
    } else {
      addEra(data.title, data.description);
    }
    setIsEraModalOpen(false);
  };

  const handleAddTopic = (eraId: number) => {
    setEditingTopic(null);
    setTargetEraId(eraId);
    setIsTopicModalOpen(true);
  };

  const handleEditTopic = (topic: HistoricalTopic) => {
    setEditingTopic(topic);
    setIsTopicModalOpen(true);
  };

  const handleSaveTopic = (data: {
    name: string;
    title: string;
    period: string;
    bio: string;
    isFeatured: boolean;
  }) => {
    if (editingTopic) {
      updateTopic({ ...editingTopic, ...data });
    } else if (targetEraId !== null) {
      addTopic(targetEraId, data);
    }
    setIsTopicModalOpen(false);
  };

  const handleDeleteTopic = (topicId: number) => {
    if (
      window.confirm(
        "Are you sure you want to delete this topic and all its events? This cannot be undone."
      )
    ) {
      deleteTopic(topicId);
    }
  };

  const searchResults = useMemo((): SearchResult[] => {
    if (searchQuery.length < 2) return [];
    const lowerCaseQuery = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    eras.forEach((era) => {
      era.topics.forEach((topic) => {
        if (
          topic.name.toLowerCase().includes(lowerCaseQuery) ||
          topic.bio.toLowerCase().includes(lowerCaseQuery)
        ) {
          results.push({ topic });
        }
        topic.events.forEach((event) => {
          if (
            event.title.toLowerCase().includes(lowerCaseQuery) ||
            event.story.toLowerCase().includes(lowerCaseQuery)
          ) {
            results.push({ topic, event });
          }
        });
      });
    });

    const uniqueResults: SearchResult[] = [];
    const addedKeys = new Set<string>();
    for (const result of results) {
      const key = result.event
        ? `event-${result.event.id}`
        : `topic-${result.topic.id}`;
      if (!addedKeys.has(key)) {
        uniqueResults.push(result);
        addedKeys.add(key);
      }
    }
    return uniqueResults;
  }, [searchQuery, eras]);

  // Drag and Drop handlers for Eras
  const handleEraDragStart = (
    e: React.DragEvent<HTMLElement>,
    index: number
  ) => {
    dragItem.current = index;
    e.currentTarget.classList.add("is-dragging");
  };
  const handleEraDragEnter = (
    e: React.DragEvent<HTMLElement>,
    index: number
  ) => {
    e.preventDefault();
    dragOverItem.current = index;
    e.currentTarget.classList.add("dnd-drop-target");
  };
  const handleEraDragLeave = (e: React.DragEvent<HTMLElement>) => {
    e.currentTarget.classList.remove("dnd-drop-target");
  };
  const handleEraDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
  };
  const handleEraDrop = (e: React.DragEvent<HTMLElement>) => {
    e.currentTarget.classList.remove("dnd-drop-target");
    if (
      dragItem.current !== null &&
      dragOverItem.current !== null &&
      dragItem.current !== dragOverItem.current
    ) {
      reorderEras(dragItem.current, dragOverItem.current);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };
  const handleEraDragEnd = (e: React.DragEvent<HTMLElement>) => {
    e.currentTarget.classList.remove("is-dragging");
  };

  const showSearchResults = searchQuery.length >= 2;

  return (
    <div className="min-h-screen bg-base dark:bg-gray-900 text-text-primary dark:text-gray-200 font-sans">
      {isEraModalOpen && (
        <EraEditModal
          era={editingEra}
          onClose={() => setIsEraModalOpen(false)}
          onSave={handleSaveEra}
        />
      )}
      {isTopicModalOpen && (
        <TopicEditModal
          topic={editingTopic}
          onClose={() => setIsTopicModalOpen(false)}
          onSave={handleSaveTopic}
        />
      )}

      <HomeHeader onLoginClick={onLoginClick} onNavigate={onNavigate} />

      <main className="container mx-auto p-4 md:p-8">
        <div className="relative mb-12">
          <input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("home.searchPlaceholder")}
            className="w-full pl-12 pr-4 py-4 bg-surface dark:bg-gray-800 border-2 border-border-color dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-primary dark:focus:ring-green-400 focus:border-primary dark:focus:border-green-400 transition-all text-lg dark:placeholder-gray-500"
            aria-label="Search content"
          />
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-text-secondary dark:text-gray-500 pointer-events-none" />
        </div>

        {showSearchResults ? (
          <SearchResults
            results={searchResults}
            query={searchQuery}
            onSelectTopic={onSelectTopic}
          />
        ) : (
          <div className="space-y-16">
            <div className="text-center">
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-primary dark:text-green-300">
                {t("home.mainTitle")}
              </h2>
              <p className="mt-4 max-w-3xl mx-auto text-lg text-text-secondary dark:text-gray-400">
                {t("home.mainSubtitle")}
              </p>
            </div>

            {user && user.provider !== "guest" && profile && (
              <Dashboard
                eras={eras}
                profile={profile}
                onSelectTopic={onSelectTopic}
                allEventsCount={allEventsCount}
              />
            )}

            <CommunityHub onNavigate={onNavigate} />

            <div className="space-y-16">
              {eras.map((era, index) => (
                <section
                  key={era.id}
                  draggable={isAdmin}
                  onDragStart={(e) => handleEraDragStart(e, index)}
                  onDragEnter={(e) => handleEraDragEnter(e, index)}
                  onDragLeave={(e) => handleEraDragLeave(e)}
                  onDragOver={(e) => handleEraDragOver(e)}
                  onDrop={(e) => handleEraDrop(e)}
                  onDragEnd={(e) => handleEraDragEnd(e)}
                  className={`p-4 rounded-lg transition-shadow ${
                    isAdmin ? "dnd-item" : ""
                  }`}
                >
                  <EraRow
                    era={era}
                    profile={profile}
                    onSelectTopic={onSelectTopic}
                    onAddTopic={handleAddTopic}
                    onEditTopic={handleEditTopic}
                    onDeleteTopic={handleDeleteTopic}
                    onReorderTopics={reorderTopics}
                    onEditEra={handleEditEra}
                  />
                </section>
              ))}
              {isAdmin && (
                <div className="text-center mt-8">
                  <button
                    onClick={handleAddEra}
                    className="flex items-center gap-2 mx-auto px-6 py-3 border-2 border-dashed border-primary/50 dark:border-green-400/50 text-primary dark:text-green-300 rounded-lg font-semibold hover:bg-primary/10 dark:hover:bg-green-300/10 transition-colors"
                  >
                    <PlusIcon className="w-6 h-6" /> {t("home.addNewEra")}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="text-center p-8 mt-8 border-t border-border-color dark:border-gray-700">
        <p className="text-text-secondary dark:text-gray-500 text-sm">
          {t("footer.copyright")}
        </p>
      </footer>
    </div>
  );
};

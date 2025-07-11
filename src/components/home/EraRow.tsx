import React, { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useTranslation } from "../../hooks/useTranslation";
import type { HistoricalEra, HistoricalTopic, UserProfile } from "../../types";
import { TopicCard } from "./TopicCard";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  PencilSquareIcon,
} from "../common/icons";

interface EraRowProps {
  era: HistoricalEra;
  onSelectTopic: (id: number) => void;
  profile: UserProfile | null;
  onAddTopic: (eraId: number) => void;
  onEditTopic: (topic: HistoricalTopic) => void;
  onDeleteTopic: (topicId: number) => void;
  onReorderTopics: (
    eraId: number,
    dragIndex: number,
    hoverIndex: number
  ) => void;
  onEditEra: (era: HistoricalEra) => void;
}

export const EraRow: React.FC<EraRowProps> = ({
  era,
  profile,
  onSelectTopic,
  onAddTopic,
  onEditTopic,
  onDeleteTopic,
  onReorderTopics,
  onEditEra,
}) => {
  const { isAdmin } = useAuth();
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const checkScrollability = useCallback(() => {
    const el = scrollContainerRef.current;
    if (el) {
      const hasOverflow = el.scrollWidth > el.clientWidth;
      setCanScrollLeft(hasOverflow && el.scrollLeft > 1);
      setCanScrollRight(
        hasOverflow &&
          Math.ceil(el.scrollLeft) < el.scrollWidth - el.clientWidth - 1
      );
    }
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      checkScrollability();
      el.addEventListener("scroll", checkScrollability, { passive: true });
      const resizeObserver = new ResizeObserver(checkScrollability);
      resizeObserver.observe(el);

      return () => {
        el.removeEventListener("scroll", checkScrollability);
        resizeObserver.disconnect();
      };
    }
  }, [checkScrollability, era.topics]);

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (el) {
      const scrollAmount = el.clientWidth * 0.8;
      el.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    index: number
  ) => {
    dragItem.current = index;
    e.currentTarget.classList.add("is-dragging");
  };

  const handleDragEnter = (
    e: React.DragEvent<HTMLDivElement>,
    index: number
  ) => {
    e.preventDefault();
    dragOverItem.current = index;
    e.currentTarget.classList.add("dnd-drop-target");
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove("dnd-drop-target");
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove("dnd-drop-target");
    if (
      dragItem.current !== null &&
      dragOverItem.current !== null &&
      dragItem.current !== dragOverItem.current
    ) {
      onReorderTopics(era.id, dragItem.current, dragOverItem.current);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove("is-dragging");
  };

  const topicsToShowOnMobile = isExpanded ? era.topics : era.topics.slice(0, 3);

  return (
    <>
      <div className="mb-8 flex justify-between items-center text-center md:text-left gap-4">
        <div className="flex-grow">
          <h2 className="text-3xl font-serif font-bold text-primary dark:text-green-300">
            {era.title}
          </h2>
          <p className="text-text-secondary dark:text-gray-400 mt-2 max-w-2xl">
            {era.description}
          </p>
        </div>
        {isAdmin && (
          <div className="flex flex-col md:flex-row gap-2 flex-shrink-0">
            <button
              onClick={() => onEditEra(era)}
              className="p-2 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900/80"
              aria-label="Edit Era"
            >
              <PencilSquareIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => onAddTopic(era.id)}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg font-semibold hover:bg-primary/20 dark:bg-green-300/10 dark:text-green-300 dark:hover:bg-green-300/20 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              <span className="hidden md:inline">{t("home.era.addTopic")}</span>
            </button>
          </div>
        )}
      </div>

      {era.topics.length === 0 && isAdmin ? (
        <div className="text-center py-10 px-4 bg-surface dark:bg-gray-800 rounded-lg border-2 border-dashed border-border-color dark:border-gray-700">
          <h3 className="text-lg font-semibold text-text-primary dark:text-gray-200">
            {t("home.era.empty.title")}
          </h3>
          <p className="text-text-secondary dark:text-gray-400 mt-1 mb-4">
            {t("home.era.empty.subtitle")}
          </p>
          <button
            onClick={() => onAddTopic(era.id)}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-primary dark:bg-green-600 text-white rounded-lg font-semibold hover:bg-opacity-90 transition-colors shadow-sm mx-auto"
          >
            <PlusIcon className="w-5 h-5" /> {t("home.era.empty.addTopic")}
          </button>
        </div>
      ) : (
        <>
          {/* Mobile View */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:hidden gap-8">
            {topicsToShowOnMobile.map((topic) => {
              const completedEvents =
                profile?.completedEventIds.filter((id) =>
                  topic.events.some((e) => e.id === id)
                ).length || 0;
              return (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  onSelect={() => onSelectTopic(topic.id)}
                  completedEvents={completedEvents}
                  onEdit={() => onEditTopic(topic)}
                  onDelete={() => onDeleteTopic(topic.id)}
                  draggable={false} // Disable D&D on mobile for simplicity
                  onDragStart={() => {}}
                  onDragEnter={() => {}}
                  onDragLeave={() => {}}
                  onDragOver={() => {}}
                  onDrop={() => {}}
                  onDragEnd={() => {}}
                />
              );
            })}
          </div>
          {!isExpanded && era.topics.length > 3 && (
            <div className="mt-8 text-center md:hidden">
              <button
                onClick={() => setIsExpanded(true)}
                className="px-6 py-2 bg-surface dark:bg-gray-800 border border-border-color dark:border-gray-700 text-primary dark:text-green-300 rounded-lg font-semibold hover:bg-base dark:hover:bg-gray-700 transition-colors"
              >
                {t("home.era.showAll", { count: era.topics.length })}
              </button>
            </div>
          )}

          {/* Desktop View */}
          <div className="hidden md:block relative">
            <div
              ref={scrollContainerRef}
              className="flex overflow-x-auto space-x-8 pb-4 -mx-4 px-4 no-scrollbar"
            >
              {era.topics.map((topic, index) => {
                const completedEvents =
                  profile?.completedEventIds.filter((id) =>
                    topic.events.some((e) => e.id === id)
                  ).length || 0;
                return (
                  <div
                    key={topic.id}
                    className="w-full md:w-[48%] lg:w-[32%] flex-shrink-0"
                  >
                    <TopicCard
                      topic={topic}
                      onSelect={() => onSelectTopic(topic.id)}
                      completedEvents={completedEvents}
                      onEdit={() => onEditTopic(topic)}
                      onDelete={() => onDeleteTopic(topic.id)}
                      draggable={isAdmin}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragEnter={(e) => handleDragEnter(e, index)}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onDragEnd={handleDragEnd}
                    />
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => handleScroll("left")}
              aria-label={t("timeline.scrollLeft")}
              aria-hidden={!canScrollLeft}
              className={`absolute top-1/2 -translate-y-1/2 -left-2 z-10 w-12 h-12 rounded-full flex items-center justify-center bg-surface/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg text-primary dark:text-green-300 hover:bg-surface dark:hover:bg-gray-800 transition-opacity duration-300 ${
                canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <button
              onClick={() => handleScroll("right")}
              aria-label={t("timeline.scrollRight")}
              aria-hidden={!canScrollRight}
              className={`absolute top-1/2 -translate-y-1/2 -right-2 z-10 w-12 h-12 rounded-full flex items-center justify-center bg-surface/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg text-primary dark:text-green-300 hover:bg-surface dark:hover:bg-gray-800 transition-opacity duration-300 ${
                canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <ChevronRightIcon className="w-6 h-6" />
            </button>
          </div>
        </>
      )}
    </>
  );
};

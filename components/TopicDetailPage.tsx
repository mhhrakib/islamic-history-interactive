import React, { useState, useMemo, useRef, useEffect } from "react";
import { Timeline } from "./Timeline";
import { MapView } from "./Map";
import { StoryPanel } from "./StoryPanel";
import { EventEditModal } from "./EventEditModal";
import type { AppEvent, HistoricalTopic } from "../types";
import { useAuth } from "../hooks/useAuth";
import { useData } from "../hooks/useData";
import { TitleBar } from "./TitleBar";
import { PlusIcon, KaabaIcon } from "./icons";
import { useTranslation } from "../hooks/useTranslation";

interface TopicDetailPageProps {
  topic: HistoricalTopic;
  onBack: () => void;
  onLoginClick: () => void;
  initialEventId?: number;
  onNavigate: (page: "profile") => void;
}

export const TopicDetailPage: React.FC<TopicDetailPageProps> = ({
  topic: initialTopic,
  onBack,
  onLoginClick,
  initialEventId,
  onNavigate,
}) => {
  const { eras, addEvent, updateEvent, deleteEvent, reorderEvents } = useData();
  const {
    markEventAsCompleted,
    profile,
    user,
    isAdmin,
    setLastViewedLocation,
  } = useAuth();
  const { t } = useTranslation();

  // The topic can be updated by the admin, so we need to get the latest version from context
  const topic =
    eras.flatMap((e) => e.topics).find((t) => t.id === initialTopic.id) ||
    initialTopic;

  const [selectedEventId, setSelectedEventId] = useState<number | undefined>(
    () => {
      if (initialEventId && topic.events.some((e) => e.id === initialEventId)) {
        return initialEventId;
      }
      return topic.events[0]?.id;
    }
  );

  const [showStickyEventHeader, setShowStickyEventHeader] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AppEvent | null>(null);

  const titleBarRef = useRef<HTMLDivElement>(null);
  const storyHeaderRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;

  // Effect to handle selection changes if events array is modified (e.g., deleted)
  useEffect(() => {
    if (topic.events.length > 0) {
      const selectedEventExists = topic.events.some(
        (e) => e.id === selectedEventId
      );
      if (!selectedEventExists) {
        setSelectedEventId(topic.events[0].id);
      }
    } else {
      setSelectedEventId(undefined);
    }
  }, [topic.events, selectedEventId]);

  const selectedEvent = useMemo((): AppEvent | undefined => {
    return topic.events.find((e) => e.id === selectedEventId);
  }, [selectedEventId, topic.events]);

  useEffect(() => {
    if (user?.provider !== "guest" && selectedEvent) {
      setLastViewedLocation(topic.id, selectedEvent.id);
      markEventAsCompleted(selectedEvent.id);
    }
  }, [
    selectedEvent,
    topic.id,
    user,
    markEventAsCompleted,
    setLastViewedLocation,
  ]);

  useEffect(() => {
    const handleScroll = () => {
      const titleBar = titleBarRef.current;
      const storyHeader = storyHeaderRef.current;
      if (!titleBar || !storyHeader) return;
      const titleBarBottom = titleBar.getBoundingClientRect().bottom;
      const storyHeaderTop = storyHeader.getBoundingClientRect().top;
      setShowStickyEventHeader(storyHeaderTop < titleBarBottom);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const handleSelectEvent = (id: number) => {
    setSelectedEventId(id);
  };

  const handleEditEventRequest = (event: AppEvent) => {
    setEditingEvent(event);
  };

  const handleSaveEvent = (updatedEvent: AppEvent) => {
    if (editingEvent?.id === -1) {
      // This is a new event
      addEvent(topic.id, updatedEvent);
    } else {
      updateEvent(topic.id, updatedEvent);
    }
    setEditingEvent(null);
  };

  const handleAddEventRequest = () => {
    const newEventTemplate: AppEvent = {
      id: -1, // Use a temporary ID to signify a new event
      title: "New Event",
      year: new Date().getFullYear().toString(),
      story: "A new story begins...",
      lessons: [],
      glossary: [],
      quiz: [],
      images: [],
      quotes: [],
    };
    setEditingEvent(newEventTemplate);
  };

  const handleDeleteEvent = (eventId: number) => {
    if (
      window.confirm(
        "Are you sure you want to delete this event? This cannot be undone."
      )
    ) {
      deleteEvent(topic.id, eventId);
    }
  };

  const handleReorderEvents = (dragIndex: number, hoverIndex: number) => {
    reorderEvents(topic.id, dragIndex, hoverIndex);
  };

  const hasLocation = !!selectedEvent?.location;

  // Render a special page if the topic has no events
  if (topic.events.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-base dark:bg-gray-900">
        <TitleBar
          ref={titleBarRef}
          showBackButton
          onBackClick={onBack}
          onLoginClick={onLoginClick}
          onNavigate={onNavigate}
        />
        {editingEvent && (
          <EventEditModal
            event={editingEvent}
            onSave={handleSaveEvent}
            onClose={() => setEditingEvent(null)}
          />
        )}
        <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
          <KaabaIcon className="w-16 h-16 text-primary/30 dark:text-green-300/20 mb-4" />
          <h2 className="text-3xl font-serif font-bold text-primary dark:text-green-300">
            {t("topicDetail.empty.title")}
          </h2>
          <p className="text-text-secondary dark:text-gray-400 mt-2 max-w-md">
            {t("topicDetail.empty.subtitle", { topicName: topic.name })}
          </p>
          {isAdmin ? (
            <div className="mt-6">
              <p className="text-text-secondary dark:text-gray-400 mb-4">
                {t("topicDetail.empty.admin.prompt")}
              </p>
              <button
                onClick={handleAddEventRequest}
                className="flex items-center gap-2 mx-auto px-6 py-3 bg-primary dark:bg-green-600 text-white rounded-lg font-semibold hover:bg-opacity-90 transition-colors shadow-sm"
              >
                <PlusIcon className="w-6 h-6" />{" "}
                {t("topicDetail.empty.admin.button")}
              </button>
            </div>
          ) : (
            <p className="text-text-secondary dark:text-gray-400 mt-4">
              {t("topicDetail.empty.guest.prompt")}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden text-text-primary dark:text-gray-200 font-sans flex flex-col bg-base dark:bg-gray-900">
      <TitleBar
        ref={titleBarRef}
        isStickyHeaderVisible={showStickyEventHeader}
        stickyHeaderText={
          selectedEvent ? `${selectedEvent.year}: ${selectedEvent.title}` : ""
        }
        showBackButton={true}
        onBackClick={onBack}
        onLoginClick={onLoginClick}
        onNavigate={onNavigate}
      />

      {editingEvent && (
        <EventEditModal
          event={editingEvent}
          onSave={handleSaveEvent}
          onClose={() => setEditingEvent(null)}
        />
      )}

      <div className="container mx-auto p-4 md:p-8 flex-grow flex flex-col lg:min-h-0">
        <div className="w-full mb-8 flex items-center gap-4">
          <div className="flex-grow min-w-0">
            <Timeline
              events={topic.events}
              selectedEventId={selectedEventId}
              onSelectEvent={handleSelectEvent}
              completedEventIds={profile?.completedEventIds || []}
              onEditEvent={handleEditEventRequest}
              onDeleteEvent={handleDeleteEvent}
              onReorderEvents={handleReorderEvents}
            />
          </div>
          {isAdmin && (
            <button
              onClick={handleAddEventRequest}
              className="flex-shrink-0 flex flex-col items-center justify-center h-full w-24 bg-primary/5 dark:bg-green-300/5 hover:bg-primary/10 dark:hover:bg-green-300/10 border-2 border-dashed border-primary/20 dark:border-green-300/20 text-primary dark:text-green-300 rounded-xl transition-colors"
            >
              <PlusIcon className="w-8 h-8" />
              <span className="font-semibold text-sm mt-1">
                {t("topicDetail.addEvent")}
              </span>
            </button>
          )}
        </div>

        <main className="flex-grow flex flex-col lg:flex-row gap-8 lg:min-h-0">
          <div
            className={`w-full ${
              hasLocation ? "lg:w-3/5" : "lg:w-full"
            } flex-shrink-0`}
          >
            {selectedEvent ? (
              <div className="lg:h-full">
                <StoryPanel
                  event={selectedEvent}
                  headerRef={storyHeaderRef}
                  onEditEvent={handleEditEventRequest}
                />
              </div>
            ) : (
              <div className="h-full bg-surface dark:bg-gray-800 rounded-xl shadow-md flex items-center justify-center p-8">
                <div className="text-center">
                  <h2 className="text-2xl font-serif text-primary dark:text-green-300">
                    {t("topicDetail.noEvent.title")}
                  </h2>
                  <p className="text-text-secondary dark:text-gray-400 mt-2">
                    {t("topicDetail.noEvent.subtitle")}
                  </p>
                </div>
              </div>
            )}
          </div>

          {hasLocation && (
            <div className="w-full lg:w-2/5 flex-shrink-0 flex flex-col">
              {selectedEvent && (
                <MapView
                  location={selectedEvent.location!}
                  allEvents={topic.events}
                />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};


import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import type { HistoricalTopic, HistoricalEra, UserProfile, AppEvent } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';
import { useTranslation } from '../hooks/useTranslation';
import { KaabaIcon, CheckCircleIcon, TrophyIcon, StreakIcon, ProgressIcon, ChevronLeftIcon, ChevronRightIcon, SearchIcon, PlusIcon, EditIcon, TrashIcon, PencilSquareIcon, StarIcon, TrendingUpIcon } from './icons';
import { ProfileDropdown } from './ProfileDropdown';
import { UserStats } from './UserStats';
import { EraEditModal } from './EraEditModal';
import { TopicEditModal } from './TopicEditModal';
import { ThemeToggler } from './ThemeToggler';
import { LanguageSwitcher } from './LanguageSwitcher';

const Highlight: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  if (!query) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-secondary/20 dark:bg-red-400/20 text-secondary dark:text-red-300 font-bold rounded-sm px-0.5 py-px">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

interface SearchResult {
    topic: HistoricalTopic;
    event?: AppEvent;
}

const SearchResultItem: React.FC<{ result: SearchResult; onSelect: (topicId: number, eventId?: number) => void; query: string }> = ({ result, onSelect, query }) => {
    const { topic, event } = result;

    return (
        <button
            onClick={() => onSelect(topic.id, event?.id)}
            className="w-full h-full text-left p-4 bg-surface dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md hover:bg-border-color/50 dark:hover:bg-gray-700/50 transition-all border border-border-color dark:border-gray-700 flex flex-col"
        >
            <div className="flex-grow">
                <p className="font-semibold text-sm text-secondary dark:text-red-400">{topic.period}</p>
                {event ? (
                    <>
                        <h4 className="font-serif text-lg font-semibold text-primary dark:text-green-300 mt-1">
                            <Highlight text={event.title} query={query} />
                        </h4>
                        <p className="text-sm text-text-secondary dark:text-gray-400">
                            In topic: <Highlight text={topic.name} query={query} />
                        </p>
                        <p className="text-sm text-text-secondary dark:text-gray-400 mt-2 line-clamp-2">
                            <Highlight text={event.story} query={query} />
                        </p>
                    </>
                ) : (
                    <>
                        <h4 className="font-serif text-lg font-semibold text-primary dark:text-green-300 mt-1">
                           <Highlight text={topic.name} query={query} />
                        </h4>
                        <p className="text-sm text-text-secondary dark:text-gray-400 mt-2 line-clamp-2">
                            <Highlight text={topic.bio} query={query} />
                        </p>
                    </>
                )}
            </div>
            <p className="mt-3 pt-3 border-t border-border-color/50 dark:border-gray-700/50 text-primary dark:text-green-300 font-semibold text-sm">View Details &rarr;</p>
        </button>
    );
};


interface TopicCardProps {
  topic: HistoricalTopic;
  onSelect: () => void;
  completedEvents: number;
  onEdit: () => void;
  onDelete: () => void;
  draggable: boolean;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnter: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
}

const TopicCard: React.FC<TopicCardProps> = (props) => {
  const { topic, onSelect, completedEvents, onEdit, onDelete, draggable, ...dragProps } = props;
  const { isAdmin } = useAuth();
  const { t } = useTranslation();
  const totalEvents = topic.events.length;
  const isCompleted = totalEvents > 0 && completedEvents === totalEvents;
  
  return (
    <div 
      className={`bg-surface dark:bg-gray-800 rounded-xl shadow-md p-6 w-full h-full flex flex-col hover:shadow-lg transition-shadow duration-300 relative group ${draggable ? 'dnd-item' : ''}`}
      draggable={draggable}
      {...dragProps}
    >
      {isAdmin && (
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
           <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-2 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900/80"><EditIcon className="w-5 h-5"/></button>
           <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900/80"><TrashIcon className="w-5 h-5"/></button>
        </div>
      )}
      <button 
        onClick={onSelect}
        className="focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-green-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded-lg -m-1 p-1 text-left flex-grow flex flex-col"
      >
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <p className="font-sans text-sm font-bold text-secondary dark:text-red-400">{topic.period}</p>
            {isCompleted && !isAdmin && <CheckCircleIcon className="w-6 h-6 text-primary dark:text-green-300" />}
          </div>
          <h3 className="font-serif text-2xl font-semibold text-primary dark:text-green-300 mt-1">{topic.name}</h3>
          <p className="font-sans text-base text-text-secondary dark:text-gray-400 mt-1">{topic.title}</p>
          <p className="font-sans text-sm text-text-secondary dark:text-gray-400 mt-4 line-clamp-3">
            {topic.bio}
          </p>
        </div>
        <div className="mt-4 pt-4 border-t border-border-color/70 dark:border-gray-700/70 flex justify-between items-center">
          <p className="font-semibold text-primary dark:text-green-300">{t('topicCard.explore')}</p>
          { !isCompleted && totalEvents > 0 && (
            <div className="text-xs text-text-secondary dark:text-gray-400 font-semibold">
              {completedEvents} / {totalEvents}
            </div>
          )}
        </div>
      </button>
    </div>
  );
};

const MobileStatCard: React.FC<{ icon: React.ReactNode, title: string, value: string | number }> = ({ icon, title, value }) => (
    <div className="bg-surface dark:bg-gray-800 rounded-lg shadow-md p-3 flex flex-col items-center text-center h-full justify-center">
        <div className="text-secondary dark:text-red-400 mb-2">
            {icon}
        </div>
        <p className="text-2xl font-bold text-primary dark:text-gray-100">{value}</p>
        <p className="text-xs text-text-secondary dark:text-gray-400 font-semibold uppercase tracking-wider mt-1">{title}</p>
    </div>
);

const DashboardTopicCard: React.FC<{ topic: HistoricalTopic, onSelect: () => void }> = ({ topic, onSelect }) => (
  <button
    onClick={onSelect}
    className="bg-surface dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow-md hover:bg-border-color/50 dark:hover:bg-gray-700/50 transition-all border border-border-color dark:border-gray-700 w-full text-left"
  >
    <p className="font-semibold text-sm text-secondary dark:text-red-400">{topic.period}</p>
    <h4 className="font-serif font-semibold text-primary dark:text-green-300 mt-1">{topic.name}</h4>
    <p className="text-sm text-text-secondary dark:text-gray-400 mt-1 line-clamp-2">{topic.bio}</p>
  </button>
);

const Dashboard: React.FC<{ eras: HistoricalEra[], profile: UserProfile, onSelectTopic: (id: number) => void }> = ({ eras, profile, onSelectTopic }) => {
  const allTopics = useMemo(() => eras.flatMap(era => era.topics), [eras]);
  const { t } = useTranslation();
  
  const featuredTopics = useMemo(() => allTopics.filter(t => t.isFeatured), [allTopics]);

  const frequentTopics = useMemo(() => {
    return allTopics
      .map(topic => ({
        ...topic,
        completedCount: topic.events.filter(event => profile.completedEventIds.includes(event.id)).length,
      }))
      .filter(topic => topic.completedCount > 0)
      .sort((a, b) => b.completedCount - a.completedCount)
      .slice(0, 3);
  }, [allTopics, profile.completedEventIds]);

  if (featuredTopics.length === 0 && frequentTopics.length === 0) {
    return null;
  }

  return (
    <section className="mb-16 animate-fade-in">
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {frequentTopics.length > 0 && (
            <div>
              <h2 className="flex items-center gap-3 text-2xl font-serif font-bold text-primary dark:text-green-300 mb-4">
                <TrendingUpIcon className="w-7 h-7 text-secondary dark:text-red-400" />
                {t('home.dashboard.frequent')}
              </h2>
              <div className="space-y-4">
                {frequentTopics.map(topic => (
                  <DashboardTopicCard key={topic.id} topic={topic} onSelect={() => onSelectTopic(topic.id)} />
                ))}
              </div>
            </div>
          )}

          {featuredTopics.length > 0 && (
             <div>
              <h2 className="flex items-center gap-3 text-2xl font-serif font-bold text-primary dark:text-green-300 mb-4">
                <StarIcon className="w-7 h-7 text-gold" />
                {t('home.dashboard.featured')}
              </h2>
              <div className="space-y-4">
                {featuredTopics.map(topic => (
                   <DashboardTopicCard key={topic.id} topic={topic} onSelect={() => onSelectTopic(topic.id)} />
                ))}
              </div>
            </div>
          )}
       </div>
    </section>
  );
};


interface EraTopicsProps {
    era: HistoricalEra;
    onSelectTopic: (id: number) => void;
    profile: UserProfile | null;
    onAddTopic: (eraId: number) => void;
    onEditTopic: (topic: HistoricalTopic) => void;
    onDeleteTopic: (topicId: number) => void;
    onReorderTopics: (eraId: number, dragIndex: number, hoverIndex: number) => void;
}

const EraTopics: React.FC<EraTopicsProps> = ({ era, onSelectTopic, profile, onAddTopic, onEditTopic, onDeleteTopic, onReorderTopics }) => {
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
            setCanScrollRight(hasOverflow && Math.ceil(el.scrollLeft) < el.scrollWidth - el.clientWidth - 1);
        }
    }, []);

    useEffect(() => {
        const el = scrollContainerRef.current;
        if (el) {
            checkScrollability();
            el.addEventListener('scroll', checkScrollability, { passive: true });
            const resizeObserver = new ResizeObserver(checkScrollability);
            resizeObserver.observe(el);
            
            return () => {
                el.removeEventListener('scroll', checkScrollability);
                resizeObserver.disconnect();
            };
        }
    }, [checkScrollability, era.topics]);

    const handleScroll = (direction: 'left' | 'right') => {
        const el = scrollContainerRef.current;
        if (el) {
            const scrollAmount = el.clientWidth * 0.8;
            el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
    };
    
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
      dragItem.current = index;
      e.currentTarget.classList.add('is-dragging');
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
      e.preventDefault();
      dragOverItem.current = index;
      e.currentTarget.classList.add('dnd-drop-target');
    };
    
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.currentTarget.classList.remove('dnd-drop-target');
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.currentTarget.classList.remove('dnd-drop-target');
      if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
        onReorderTopics(era.id, dragItem.current, dragOverItem.current);
      }
      dragItem.current = null;
      dragOverItem.current = null;
    };
    
    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
      e.currentTarget.classList.remove('is-dragging');
    };

    const topicsToShowOnMobile = isExpanded ? era.topics : era.topics.slice(0, 3);
    
    if (era.topics.length === 0 && isAdmin) {
        return (
            <div className="text-center py-10 px-4 bg-surface dark:bg-gray-800 rounded-lg border-2 border-dashed border-border-color dark:border-gray-700">
                <h3 className="text-lg font-semibold text-text-primary dark:text-gray-200">{t('home.era.empty.title')}</h3>
                <p className="text-text-secondary dark:text-gray-400 mt-1 mb-4">{t('home.era.empty.subtitle')}</p>
                <button onClick={() => onAddTopic(era.id)} className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-primary dark:bg-green-600 text-white rounded-lg font-semibold hover:bg-opacity-90 transition-colors shadow-sm mx-auto">
                    <PlusIcon className="w-5 h-5" /> {t('home.era.empty.addTopic')}
                </button>
            </div>
        )
    }

    return (
        <>
            {/* Mobile View */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:hidden gap-8">
                {topicsToShowOnMobile.map(topic => {
                    const completedEvents = profile?.completedEventIds.filter(id => topic.events.some(e => e.id === id)).length || 0;
                    return (
                        <TopicCard
                            key={topic.id}
                            topic={topic}
                            onSelect={() => onSelectTopic(topic.id)}
                            completedEvents={completedEvents}
                            onEdit={() => onEditTopic(topic)}
                            onDelete={() => onDeleteTopic(topic.id)}
                            draggable={false} // Disable D&D on mobile for simplicity
                            onDragStart={()=>{}} onDragEnter={()=>{}} onDragLeave={()=>{}} onDragOver={()=>{}} onDrop={()=>{}} onDragEnd={()=>{}}
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
                        {t('home.era.showAll', { count: era.topics.length })}
                    </button>
                </div>
            )}

            {/* Desktop View */}
            <div className="hidden md:block relative">
                <div ref={scrollContainerRef} className="flex overflow-x-auto space-x-8 pb-4 -mx-4 px-4 no-scrollbar">
                    {era.topics.map((topic, index) => {
                        const completedEvents = profile?.completedEventIds.filter(id => topic.events.some(e => e.id === id)).length || 0;
                        return (
                            <div key={topic.id} className="w-full md:w-[48%] lg:w-[32%] flex-shrink-0">
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
                
                 <button onClick={() => handleScroll('left')} aria-label={t('timeline.scrollLeft')} aria-hidden={!canScrollLeft} className={`absolute top-1/2 -translate-y-1/2 -left-2 z-10 w-12 h-12 rounded-full flex items-center justify-center bg-surface/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg text-primary dark:text-green-300 hover:bg-surface dark:hover:bg-gray-800 transition-opacity duration-300 ${canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <button onClick={() => handleScroll('right')} aria-label={t('timeline.scrollRight')} aria-hidden={!canScrollRight} className={`absolute top-1/2 -translate-y-1/2 -right-2 z-10 w-12 h-12 rounded-full flex items-center justify-center bg-surface/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg text-primary dark:text-green-300 hover:bg-surface dark:hover:bg-gray-800 transition-opacity duration-300 ${canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <ChevronRightIcon className="w-6 h-6" />
                </button>
            </div>
        </>
    );
};


interface HomePageProps {
  onSelectTopic: (id: number, eventId?: number) => void;
  onNavigate: (page: 'home' | 'topic' | 'profile' | 'quiz' | 'leaderboard') => void;
  onLoginClick: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onSelectTopic, onNavigate, onLoginClick }) => {
  const { user, profile, isAdmin } = useAuth();
  const { eras, addEra, deleteTopic, updateTopic, addTopic, updateEra, reorderEras, reorderTopics } = useData();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [isEraModalOpen, setIsEraModalOpen] = useState(false);
  const [editingEra, setEditingEra] = useState<HistoricalEra | null>(null);

  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<HistoricalTopic | null>(null);
  const [targetEraId, setTargetEraId] = useState<number | null>(null);

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            return;
        }
        
        if (e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key === 'k')) {
            e.preventDefault();
            searchInputRef.current?.focus();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const allEventsCount = useMemo(() => eras.flatMap(e => e.topics).flatMap(t => t.events).length, [eras]);
  const allTopics = useMemo(() => eras.flatMap(era => era.topics), [eras]);
  const lastViewedTopic = profile?.lastViewedTopicId ? allTopics.find(t => t.id === profile.lastViewedTopicId) : null;
  const lastViewedEvent = lastViewedTopic && profile?.lastViewedEventId ? lastViewedTopic.events.find(e => e.id === profile.lastViewedEventId) : null;

  const handleAddEra = () => {
    setEditingEra(null);
    setIsEraModalOpen(true);
  };

  const handleEditEra = (era: HistoricalEra) => {
    setEditingEra(era);
    setIsEraModalOpen(true);
  }

  const handleSaveEra = (data: { title: string, description: string }) => {
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

  const handleSaveTopic = (data: { name: string, title: string, period: string, bio: string, isFeatured: boolean }) => {
    if (editingTopic) {
        updateTopic({ ...editingTopic, ...data });
    } else if (targetEraId !== null) {
        addTopic(targetEraId, data);
    }
    setIsTopicModalOpen(false);
  };

  const handleDeleteTopic = (topicId: number) => {
    if (window.confirm("Are you sure you want to delete this topic and all its events? This cannot be undone.")) {
        deleteTopic(topicId);
    }
  };

  const searchResults = useMemo((): SearchResult[] => {
    if (searchQuery.length < 2) return [];
    const lowerCaseQuery = searchQuery.toLowerCase();
    const results: SearchResult[] = [];
    
    eras.forEach(era => {
      era.topics.forEach(topic => {
        if (topic.name.toLowerCase().includes(lowerCaseQuery) || topic.bio.toLowerCase().includes(lowerCaseQuery)) {
          results.push({ topic });
        }
        topic.events.forEach(event => {
          if (event.title.toLowerCase().includes(lowerCaseQuery) || event.story.toLowerCase().includes(lowerCaseQuery)) {
            results.push({ topic, event });
          }
        });
      });
    });

    const uniqueResults: SearchResult[] = [];
    const addedKeys = new Set<string>();
    for (const result of results) {
        const key = result.event ? `event-${result.event.id}` : `topic-${result.topic.id}`;
        if (!addedKeys.has(key)) {
            uniqueResults.push(result);
            addedKeys.add(key);
        }
    }
    return uniqueResults;
  }, [searchQuery, eras]);
  
  // Drag and Drop handlers for Eras
  const handleEraDragStart = (e: React.DragEvent<HTMLElement>, index: number) => {
    dragItem.current = index;
    e.currentTarget.classList.add('is-dragging');
  };
  const handleEraDragEnter = (e: React.DragEvent<HTMLElement>, index: number) => {
    e.preventDefault();
    dragOverItem.current = index;
    e.currentTarget.classList.add('dnd-drop-target');
  };
  const handleEraDragLeave = (e: React.DragEvent<HTMLElement>) => {
    e.currentTarget.classList.remove('dnd-drop-target');
  };
  const handleEraDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
  };
  const handleEraDrop = (e: React.DragEvent<HTMLElement>) => {
    e.currentTarget.classList.remove('dnd-drop-target');
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      reorderEras(dragItem.current, dragOverItem.current);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };
  const handleEraDragEnd = (e: React.DragEvent<HTMLElement>) => {
    e.currentTarget.classList.remove('is-dragging');
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

      <header className="bg-surface/90 dark:bg-gray-800/90 backdrop-blur-sm border-b border-border-color dark:border-gray-700 sticky top-0 z-30">
        <div className="container mx-auto px-4 md:px-8">
            <div className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <KaabaIcon className="w-8 h-8 text-primary dark:text-green-300" />
                    <div>
                        <h1 className="text-xl md:text-2xl font-serif font-semibold text-primary dark:text-green-300">{t('app.title')}</h1>
                        <p className="text-sm text-text-secondary dark:text-gray-400 font-sans">{t('app.subtitle')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                  <ThemeToggler />
                  <LanguageSwitcher />
                  <UserStats />
                  <ProfileDropdown onLoginClick={onLoginClick} onNavigate={onNavigate} />
                </div>
            </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <div className="relative mb-12">
            <input ref={searchInputRef} type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('home.searchPlaceholder')} className="w-full pl-12 pr-4 py-4 bg-surface dark:bg-gray-800 border-2 border-border-color dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-primary dark:focus:ring-green-400 focus:border-primary dark:focus:border-green-400 transition-all text-lg dark:placeholder-gray-500" aria-label="Search content" />
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-text-secondary dark:text-gray-500 pointer-events-none" />
        </div>

        {showSearchResults ? (
            <section className="animate-fade-in">
                 <h2 className="text-2xl font-serif font-bold text-primary dark:text-green-300 mb-6">
                    {searchResults.length > 0 ? t('home.searchResultsFound', { count: searchResults.length }) : t('home.noResultsFound')}
                </h2>
                {searchResults.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {searchResults.map((result) => (
                            <SearchResultItem key={result.event ? `event-${result.event.id}` : `topic-${result.topic.id}`} result={result} onSelect={onSelectTopic} query={searchQuery}/>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-surface dark:bg-gray-800 rounded-xl">
                        <p className="text-lg text-text-secondary dark:text-gray-400">{t('home.noResultsHint')}</p>
                    </div>
                )}
            </section>
        ) : (
            <>
                <div className="text-center mb-12">
                    <h2 className="font-serif text-4xl md:text-5xl font-bold text-primary dark:text-green-300">{t('home.mainTitle')}</h2>
                    <p className="mt-4 max-w-3xl mx-auto text-lg text-text-secondary dark:text-gray-400">
                        {t('home.mainSubtitle')}
                    </p>
                </div>
                
                {user && user.provider !== 'guest' && profile && (
                   <section className="md:hidden mb-12 animate-fade-in">
                    <h2 className="text-2xl font-serif font-bold text-primary dark:text-green-300 text-center mb-4">{t('home.yourStats')}</h2>
                    <div className="grid grid-cols-3 gap-4">
                      <MobileStatCard icon={<ProgressIcon className="w-7 h-7" />} title={t('profile.stats.completed')} value={`${profile.completedEventIds.length}/${allEventsCount}`} />
                      <MobileStatCard icon={<StreakIcon className="w-7 h-7" />} title={t('profile.stats.streak')} value={profile.dailyStreak} />
                      <MobileStatCard icon={<TrophyIcon className="w-7 h-7" />} title={t('profile.stats.highScore')} value={profile.globalQuizStats.highScore.toLocaleString()} />
                    </div>
                  </section>
                )}

                {user && user.provider !== 'guest' && profile && lastViewedTopic && (
                    <section className="mb-12 animate-fade-in">
                        <div className="max-w-4xl mx-auto bg-surface dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-primary/20 dark:border-green-300/20 text-center">
                            <h2 className="text-2xl font-serif font-bold text-primary dark:text-green-300 mb-2">{t('home.continueJourney')}</h2>
                            <p className="text-text-secondary dark:text-gray-400 mb-4">{t('home.lastReading')}</p>
                            <p className="text-xl font-semibold font-serif text-secondary dark:text-red-400 mb-4">
                                {lastViewedEvent ? `"${lastViewedEvent.title}"` : lastViewedTopic.name}
                            </p>
                            <button onClick={() => onSelectTopic(lastViewedTopic.id, lastViewedEvent?.id)} className="px-6 py-2 bg-primary dark:bg-green-600 text-white rounded-lg font-semibold hover:bg-opacity-90 transition-all shadow-sm">
                                {t('home.jumpBackIn')}
                            </button>
                        </div>
                    </section>
                )}

                {user && user.provider !== 'guest' && profile && (
                  <Dashboard eras={eras} profile={profile} onSelectTopic={onSelectTopic} />
                )}

                <section className="mb-16">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-serif font-bold text-primary dark:text-green-300">{t('home.communityHub')}</h2>
                    <p className="text-text-secondary dark:text-gray-400 mt-2">{t('home.communityHub.subtitle')}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    <button onClick={() => onNavigate('quiz')} className="bg-primary dark:bg-green-600 text-white p-6 rounded-xl flex items-center gap-4 hover:bg-opacity-90 transition-all shadow-lg">
                      <StreakIcon className="w-10 h-10 text-yellow-300 shrink-0" />
                      <div>
                        <h3 className="text-xl font-serif font-bold">{t('home.globalQuiz')}</h3>
                        <p className="text-green-200 text-sm">{t('home.globalQuiz.subtitle')}</p>
                      </div>
                    </button>
                     <button onClick={() => onNavigate('leaderboard')} className="bg-surface dark:bg-gray-800 text-primary dark:text-green-300 p-6 rounded-xl flex items-center gap-4 hover:bg-border-color dark:hover:bg-gray-700 transition-all shadow-md">
                        <TrophyIcon className="w-10 h-10 text-secondary dark:text-red-400 shrink-0" />
                        <div>
                          <h3 className="text-xl font-serif font-bold">{t('home.leaderboard')}</h3>
                          <p className="text-text-secondary dark:text-gray-400 text-sm">{t('home.leaderboard.subtitle')}</p>
                        </div>
                     </button>
                  </div>
                </section>
                
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
                      className={`p-4 rounded-lg transition-shadow ${isAdmin ? 'dnd-item' : ''}`}
                    >
                      <div className="mb-8 flex justify-between items-center text-center md:text-left gap-4">
                        <div className="flex-grow">
                          <h2 className="text-3xl font-serif font-bold text-primary dark:text-green-300">{era.title}</h2>
                          <p className="text-text-secondary dark:text-gray-400 mt-2 max-w-2xl">{era.description}</p>
                        </div>
                         {isAdmin && (
                            <div className="flex flex-col md:flex-row gap-2 flex-shrink-0">
                                <button onClick={() => handleEditEra(era)} className="p-2 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900/80" aria-label="Edit Era">
                                    <PencilSquareIcon className="w-5 h-5"/>
                                </button>
                                <button onClick={() => handleAddTopic(era.id)} className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg font-semibold hover:bg-primary/20 dark:bg-green-300/10 dark:text-green-300 dark:hover:bg-green-300/20 transition-colors">
                                    <PlusIcon className="w-5 h-5" />
                                    <span className="hidden md:inline">{t('home.era.addTopic')}</span>
                                </button>
                            </div>
                         )}
                      </div>
                      <EraTopics era={era} onSelectTopic={(id) => onSelectTopic(id)} profile={profile} onAddTopic={handleAddTopic} onEditTopic={handleEditTopic} onDeleteTopic={handleDeleteTopic} onReorderTopics={reorderTopics} />
                    </section>
                  ))}
                   {isAdmin && (
                    <div className="text-center mt-8">
                        <button onClick={handleAddEra} className="flex items-center gap-2 mx-auto px-6 py-3 border-2 border-dashed border-primary/50 dark:border-green-400/50 text-primary dark:text-green-300 rounded-lg font-semibold hover:bg-primary/10 dark:hover:bg-green-300/10 transition-colors">
                            <PlusIcon className="w-6 h-6" /> {t('home.addNewEra')}
                        </button>
                    </div>
                  )}
                </div>
            </>
        )}
      </main>

       <footer className="text-center p-8 mt-8 border-t border-border-color dark:border-gray-700">
            <p className="text-text-secondary dark:text-gray-500 text-sm">{t('footer.copyright')}</p>
       </footer>
    </div>
  );
};

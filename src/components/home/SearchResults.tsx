
import React from 'react';
import type { HistoricalTopic, AppEvent } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';

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

export interface SearchResult {
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

interface SearchResultsProps {
    results: SearchResult[];
    query: string;
    onSelectTopic: (id: number, eventId?: number) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ results, query, onSelectTopic }) => {
    const { t } = useTranslation();
    return (
        <section className="animate-fade-in">
             <h2 className="text-2xl font-serif font-bold text-primary dark:text-green-300 mb-6">
                {results.length > 0 ? t('home.searchResultsFound', { count: results.length }) : t('home.noResultsFound')}
            </h2>
            {results.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {results.map((result) => (
                        <SearchResultItem key={result.event ? `event-${result.event.id}` : `topic-${result.topic.id}`} result={result} onSelect={onSelectTopic} query={query}/>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-surface dark:bg-gray-800 rounded-xl">
                    <p className="text-lg text-text-secondary dark:text-gray-400">{t('home.noResultsHint')}</p>
                </div>
            )}
        </section>
    );
};


import React, { useMemo } from 'react';
import type { HistoricalEra, HistoricalTopic, UserProfile, AppEvent } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { StarIcon, TrendingUpIcon, ProgressIcon, StreakIcon, TrophyIcon } from '../icons';

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

const MobileStatCard: React.FC<{ icon: React.ReactNode, title: string, value: string | number }> = ({ icon, title, value }) => (
    <div className="bg-surface dark:bg-gray-800 rounded-lg shadow-md p-3 flex flex-col items-center text-center h-full justify-center">
        <div className="text-secondary dark:text-red-400 mb-2">
            {icon}
        </div>
        <p className="text-2xl font-bold text-primary dark:text-gray-100">{value}</p>
        <p className="text-xs text-text-secondary dark:text-gray-400 font-semibold uppercase tracking-wider mt-1">{title}</p>
    </div>
);

interface DashboardProps {
  eras: HistoricalEra[];
  profile: UserProfile;
  onSelectTopic: (id: number, eventId?: number) => void;
  allEventsCount: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ eras, profile, onSelectTopic, allEventsCount }) => {
  const { t } = useTranslation();
  const allTopics = useMemo(() => eras.flatMap(era => era.topics), [eras]);
  
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
  
  const lastViewedTopic = profile?.lastViewedTopicId ? allTopics.find(t => t.id === profile.lastViewedTopicId) : null;
  const lastViewedEvent = lastViewedTopic && profile?.lastViewedEventId ? lastViewedTopic.events.find(e => e.id === profile.lastViewedEventId) : null;


  if (!profile) {
    return null;
  }
  
  return (
    <div className="space-y-12 animate-fade-in">
       <section className="md:hidden">
        <h2 className="text-2xl font-serif font-bold text-primary dark:text-green-300 text-center mb-4">{t('home.yourStats')}</h2>
        <div className="grid grid-cols-3 gap-4">
          <MobileStatCard icon={<ProgressIcon className="w-7 h-7" />} title={t('profile.stats.completed')} value={`${profile.completedEventIds.length}/${allEventsCount}`} />
          <MobileStatCard icon={<StreakIcon className="w-7 h-7" />} title={t('profile.stats.streak')} value={profile.dailyStreak} />
          <MobileStatCard icon={<TrophyIcon className="w-7 h-7" />} title={t('profile.stats.highScore')} value={profile.globalQuizStats.highScore.toLocaleString()} />
        </div>
      </section>

      {lastViewedTopic && (
          <section>
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

      {(featuredTopics.length > 0 || frequentTopics.length > 0) && (
        <section>
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
      )}
    </div>
  );
};


import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { StreakIcon, TrophyIcon } from '../icons';

interface CommunityHubProps {
  onNavigate: (page: 'quiz' | 'leaderboard') => void;
}

export const CommunityHub: React.FC<CommunityHubProps> = ({ onNavigate }) => {
  const { t } = useTranslation();

  return (
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
  );
};

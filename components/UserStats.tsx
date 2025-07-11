

import React, { useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';
import { StreakIcon, ProgressIcon, TrophyIcon } from './icons';

const StatItem: React.FC<{ icon: React.ReactNode, value: string | number, tooltip: string }> = ({ icon, value, tooltip }) => (
  <div className="flex items-center gap-1.5 text-primary dark:text-gray-300" title={tooltip}>
    {icon}
    <span className="font-semibold text-sm tracking-tighter">{value}</span>
  </div>
);

export const UserStats: React.FC = () => {
    const { user, profile } = useAuth();
    const { eras } = useData();

    const allEventsCount = useMemo(() => 
        eras.flatMap(e => e.topics).flatMap(t => t.events).length, 
    [eras]);

    if (!user || user.provider === 'guest' || !profile) {
        return null;
    }

    return (
        <div className="hidden md:flex items-center gap-4 border-r border-border-color dark:border-gray-700 pr-4">
            <StatItem 
                icon={<ProgressIcon className="w-5 h-5 text-green-600 dark:text-green-400" />} 
                value={`${profile.completedEventIds.length}/${allEventsCount}`} 
                tooltip="Events Completed"
            />
            <StatItem 
                icon={<StreakIcon className="w-5 h-5 text-orange-500 dark:text-orange-400" />} 
                value={profile.dailyStreak} 
                tooltip="Daily Streak"
            />
            <StatItem 
                icon={<TrophyIcon className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />} 
                value={profile.globalQuizStats.highScore.toLocaleString()}
                tooltip="Quiz High Score"
            />
        </div>
    );
};
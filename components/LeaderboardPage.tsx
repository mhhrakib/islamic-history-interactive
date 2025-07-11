
import React, { useState, useEffect, useMemo } from 'react';
import { TitleBar } from './TitleBar';
import { TrophyIcon } from './icons';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from './LoadingSpinner';
import { useTranslation } from '../hooks/useTranslation';

interface LeaderboardPlayer {
    rank: number;
    name: string;
    score: number;
    avatar: string;
}

interface LeaderboardPageProps {
  onNavigate: (page: 'home' | 'quiz' | 'profile') => void;
}

const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-gold';
    if (rank === 2) return 'text-silver';
    if (rank === 3) return 'text-bronze';
    return 'text-text-secondary dark:text-gray-400';
};

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ onNavigate }) => {
    const { user, profile } = useAuth();
    const { t } = useTranslation();
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardPlayer[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboardData = async () => {
            try {
                const response = await fetch('/data/leaderboardData.json');
                if (!response.ok) throw new Error('Failed to fetch leaderboard data');
                const data = await response.json();
                setLeaderboardData(data);
            } catch (error) {
                console.error("Error fetching leaderboard data:", error);
                setLeaderboardData([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLeaderboardData();
    }, []);
    
    const sortedLeaderboard = useMemo(() => {
        const userLeaderboardData = [...leaderboardData];
        if (user && profile && profile.globalQuizStats.highScore > 0) {
            const userEntry = {
                rank: 0,
                name: `${user.name} ${t('leaderboard.you')}`,
                score: profile.globalQuizStats.highScore,
                avatar: user.avatarUrl
            };
            // Prevent adding duplicate entries on re-renders
            if (!userLeaderboardData.some(p => p.name.includes(t('leaderboard.you')))) {
                userLeaderboardData.push(userEntry);
            }
        }
        
        return userLeaderboardData
            .sort((a, b) => b.score - a.score)
            .map((player, index) => ({ ...player, rank: index + 1 }));

    }, [leaderboardData, user, profile, t]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center py-20">
                    <LoadingSpinner />
                </div>
            );
        }

        return (
            <div className="max-w-3xl mx-auto bg-surface dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <ul className="divide-y divide-border-color dark:divide-gray-700">
                    {sortedLeaderboard.map((player, index) => (
                        <li 
                            key={index} 
                            className={`flex items-center gap-4 p-4 ${player.name.includes(t('leaderboard.you')) ? 'bg-green-50 dark:bg-green-900/40' : ''}`}
                        >
                            <div className={`w-10 text-center font-bold text-xl ${getRankColor(player.rank)}`}>
                                {player.rank}
                            </div>
                            <img src={player.avatar} alt={player.name} className="w-12 h-12 rounded-full object-cover"/>
                            <div className="flex-grow">
                                <p className="font-semibold text-text-primary dark:text-gray-100">{player.name}</p>
                                <p className="text-sm text-text-secondary dark:text-gray-400">{player.score.toLocaleString()} {t('leaderboard.points')}</p>
                            </div>
                            {player.rank <= 3 && (
                                <TrophyIcon className={`w-8 h-8 ${getRankColor(player.rank)}`} />
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    return (
        <div className="min-h-screen flex flex-col bg-base dark:bg-gray-900">
            <TitleBar showBackButton onBackClick={() => onNavigate('home')} onLoginClick={() => {}} onNavigate={onNavigate} />
            <main className="flex-grow container mx-auto p-4 md:p-8">
                <div className="text-center mb-8">
                    <h2 className="text-4xl font-serif font-bold text-primary dark:text-green-300">{t('leaderboard.title')}</h2>
                    <p className="mt-2 text-lg text-text-secondary dark:text-gray-400">{t('leaderboard.subtitle')}</p>
                </div>
                
                {renderContent()}
                
                <div className="mt-8 text-center">
                    <button onClick={() => onNavigate('quiz')} className="px-6 py-3 bg-secondary dark:bg-red-600 text-white rounded-lg font-semibold hover:bg-opacity-90">
                        {t('leaderboard.playQuiz')}
                    </button>
                </div>
            </main>
        </div>
    );
};


import React from 'react';
import type { HistoricalTopic } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import { EditIcon, TrashIcon, CheckCircleIcon } from '../icons';

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

export const TopicCard: React.FC<TopicCardProps> = (props) => {
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

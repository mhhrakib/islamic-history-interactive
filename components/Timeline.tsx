
import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { AppEvent } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon, EditIcon, TrashIcon } from './icons';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';

interface TimelineProps {
  events: AppEvent[];
  selectedEventId: number | undefined;
  onSelectEvent: (id: number) => void;
  completedEventIds: number[];
  onEditEvent: (event: AppEvent) => void;
  onDeleteEvent: (eventId: number) => void;
  onReorderEvents: (dragIndex: number, hoverIndex: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ events, selectedEventId, onSelectEvent, completedEventIds, onEditEvent, onDeleteEvent, onReorderEvents }) => {
  const selectedRef = useRef<HTMLButtonElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const { isAdmin } = useAuth();
  const { t } = useTranslation();
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
  }, [checkScrollability, events]);

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [selectedEventId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLButtonElement) {
            return; // Don't interfere with typing in modals or other inputs.
        }
        if (selectedEventId === undefined) return;
        
        const currentIndex = events.findIndex(event => event.id === selectedEventId);
        if (currentIndex === -1) return;

        let newIndex = -1;
        if (e.key === 'ArrowRight') {
            newIndex = Math.min(currentIndex + 1, events.length - 1);
        } else if (e.key === 'ArrowLeft') {
            newIndex = Math.max(currentIndex - 1, 0);
        }

        if (newIndex !== -1 && newIndex !== currentIndex) {
            e.preventDefault();
            onSelectEvent(events[newIndex].id);
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [events, selectedEventId, onSelectEvent]);


  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (el) {
      const scrollAmount = el.clientWidth * 0.8;
      el.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
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
      onReorderEvents(dragItem.current, dragOverItem.current);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('is-dragging');
  };


  return (
    <div className="bg-surface dark:bg-gray-800 rounded-xl shadow-md p-4 flex-shrink-0">
      <h3 className="font-serif text-lg text-primary dark:text-green-300 mb-3 px-2">{t('timeline.title')}</h3>
      <div className="relative">
        <div 
          ref={scrollContainerRef} 
          className="flex overflow-x-auto space-x-3 pb-3 no-scrollbar"
        >
          {events.map((event, index) => {
            const isCompleted = completedEventIds.includes(event.id);
            return (
              <div 
                key={event.id}
                draggable={isAdmin}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                className={`relative flex-shrink-0 w-48 group transition-transform ${isAdmin ? 'dnd-item' : ''}`}
              >
                <button
                  ref={event.id === selectedEventId ? selectedRef : null}
                  onClick={() => onSelectEvent(event.id)}
                  className={`
                    w-full h-full p-4 rounded-lg text-left transition-all duration-300 transform 
                    ${selectedEventId === event.id
                      ? 'bg-primary dark:bg-green-600 text-white shadow-lg scale-105'
                      : 'bg-base dark:bg-gray-700 hover:bg-border-color dark:hover:bg-gray-600'
                    }
                  `}
                >
                  <p className={`font-bold text-sm ${selectedEventId === event.id ? 'text-green-200' : 'text-secondary dark:text-red-400'}`}>
                    {event.year}
                  </p>
                  <p className={`mt-1 font-semibold text-base ${selectedEventId === event.id ? 'text-white' : 'text-text-primary dark:text-gray-100'}`}>
                    {event.title}
                  </p>
                  {isCompleted && !isAdmin && (
                      <CheckCircleIcon className={`absolute top-2 right-2 w-5 h-5 ${selectedEventId === event.id ? 'text-green-300' : 'text-primary dark:text-green-300'}`} />
                  )}
                </button>
                {isAdmin && (
                   <div className={`absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 ${selectedEventId === event.id ? 'opacity-100' : ''}`}>
                      <button onClick={() => onEditEvent(event)} className="p-1.5 bg-white/80 dark:bg-gray-900/80 rounded-full text-blue-600 hover:bg-white dark:hover:bg-gray-900"><EditIcon className="w-4 h-4" /></button>
                      <button onClick={() => onDeleteEvent(event.id)} className="p-1.5 bg-white/80 dark:bg-gray-900/80 rounded-full text-red-600 hover:bg-white dark:hover:bg-gray-900"><TrashIcon className="w-4 h-4" /></button>
                   </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Left Arrow */}
        <button
          onClick={() => handleScroll('left')}
          aria-label={t('timeline.scrollLeft')}
          aria-hidden={!canScrollLeft}
          className={`
            absolute top-1/2 -translate-y-1/2 left-2 z-10 w-10 h-10 rounded-full
            flex items-center justify-center
            bg-surface/70 dark:bg-gray-800/70 backdrop-blur-sm shadow-lg
            text-primary dark:text-green-300 hover:bg-surface dark:hover:bg-gray-800
            transition-opacity duration-300
            ${canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>

        {/* Right Arrow */}
        <button
          onClick={() => handleScroll('right')}
          aria-label={t('timeline.scrollRight')}
          aria-hidden={!canScrollRight}
          className={`
            absolute top-1/2 -translate-y-1/2 right-2 z-10 w-10 h-10 rounded-full
            flex items-center justify-center
            bg-surface/70 dark:bg-gray-800/70 backdrop-blur-sm shadow-lg
            text-primary dark:text-green-300 hover:bg-surface dark:hover:bg-gray-800
            transition-opacity duration-300
            ${canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
        >
          <ChevronRightIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

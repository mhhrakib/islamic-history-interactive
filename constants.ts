import type { HistoricalEra, HistoricalTopic, AppEvent } from './types';

// Define a type for the raw, unprocessed data from the JSON file.
type RawHistoricalData = (Omit<HistoricalEra, 'id' | 'topics'> & { topics: (Omit<HistoricalTopic, 'id' | 'events'> & { events: Omit<AppEvent, 'id'>[] })[] })[];

// Helper function to process the raw data and add unique IDs.
// This function is exported so it can be used after fetching the data.
export const processHistoricalData = (eras: RawHistoricalData): HistoricalEra[] => {
  let eraIdCounter = 1;
  let topicIdCounter = 1;
  let eventIdCounter = 1;

  return eras.map(eraData => {
    const newEra: HistoricalEra = {
      ...eraData,
      id: eraIdCounter++,
      topics: eraData.topics.map(topicData => {
        const newTopic: HistoricalTopic = {
          ...topicData,
          id: topicIdCounter++,
          events: topicData.events.map(eventData => {
            const newEvent: AppEvent = {
              ...eventData,
              id: eventIdCounter++
            };
            return newEvent;
          })
        };
        return newTopic;
      })
    };
    return newEra;
  });
};

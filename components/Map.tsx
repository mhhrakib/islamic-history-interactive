import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import type { Location, AppEvent } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

// A robust check for valid coordinates
const isValidCoord = (coord: any): coord is { lat: number, lng: number } => {
  return (
    coord &&
    typeof coord.lat === 'number' &&
    isFinite(coord.lat) &&
    typeof coord.lng === 'number' &&
    isFinite(coord.lng)
  );
};

// A custom component to update the map's view when the selected location changes
const MapUpdater: React.FC<{ location: Location }> = ({ location }) => {
  const map = useMap();
  useEffect(() => {
    if (isValidCoord(location?.coords)) {
      map.flyTo(location.coords, location.zoom, {
        animate: true,
        duration: 1.5,
      });
    }
  }, [location, map]);
  return null;
};

// Function to create custom, styled div icons
const createIcon = (className: string, size: number) => {
  return L.divIcon({
    html: `<div class="${className}" style="width: ${size}px; height: ${size}px; border-radius: 50%;"></div>`,
    className: 'bg-transparent border-0', // Reset default Leaflet icon styles
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Define icons for active (selected) and inactive events
const activeIcon = createIcon('bg-secondary ring-2 ring-white shadow-lg', 18);
const inactiveIcon = createIcon('bg-primary/80 ring-1 ring-white/50', 12);


export const MapView: React.FC<{ location: Location; allEvents: AppEvent[] }> = ({ location, allEvents }) => {
  
  const uniqueLocations = useMemo(() => 
    Array.from(new Map(allEvents.map(e => [e.location.name, e.location])).values()), 
    [allEvents]
  );
  
  if (!isValidCoord(location?.coords)) {
    return (
      <div className="w-full h-96 lg:h-auto bg-surface rounded-xl shadow-md overflow-hidden flex-grow flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const isActiveLocation = (loc: Location) => location.name === loc.name;

  return (
    <div className="w-full h-96 lg:h-auto bg-surface rounded-xl shadow-md z-10 overflow-hidden flex-grow">
      <MapContainer
        center={location.coords}
        zoom={location.zoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
          url="https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.png?key=BvbvT2Q3VczQYsIUuwaO"
        />
        <MapUpdater location={location} />
        {uniqueLocations.map(loc => {
          if (!isValidCoord(loc?.coords)) {
            return null;
          }

          return (
            <Marker
              key={loc.name}
              position={loc.coords}
              icon={isActiveLocation(loc) ? activeIcon : inactiveIcon}
            >
              <Tooltip
                permanent
                direction={isActiveLocation(loc) ? 'bottom' : 'top'}
                offset={isActiveLocation(loc) ? [0, 9] : [0, -6]}
                className="leaflet-tooltip-custom"
              >
                {loc.name}
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

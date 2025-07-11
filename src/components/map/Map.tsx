import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  Tooltip,
} from "react-leaflet";
import type { Location, AppEvent } from "../../types";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { MapLoadingState } from "./MapLoadingState";
import { MapPerformanceMonitor } from "./MapPerformanceMonitor";

// A robust check for valid coordinates
const isValidCoord = (coord: any): coord is { lat: number; lng: number } => {
  return (
    coord &&
    typeof coord.lat === "number" &&
    isFinite(coord.lat) &&
    typeof coord.lng === "number" &&
    isFinite(coord.lng)
  );
};

// Cache for map icons to avoid recreating them
const iconCache = new Map<string, L.DivIcon>();

// Function to create custom, styled div icons with caching
const createIcon = (className: string, size: number): L.DivIcon => {
  const cacheKey = `${className}-${size}`;

  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey)!;
  }

  const icon = L.divIcon({
    html: `<div class="${className}" style="width: ${size}px; height: ${size}px; border-radius: 50%;"></div>`,
    className: "bg-transparent border-0", // Reset default Leaflet icon styles
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

  iconCache.set(cacheKey, icon);
  return icon;
};

// Define icons for active (selected) and inactive events
const getActiveIcon = () =>
  createIcon("bg-secondary ring-2 ring-white shadow-lg", 18);
const getInactiveIcon = () =>
  createIcon("bg-primary/80 ring-1 ring-white/50", 12);

// Performance monitoring
const performanceLog = (label: string, startTime: number) => {
  const duration = performance.now() - startTime;
  console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
};

// A custom component to update the map's view when the selected location changes
const MapUpdater: React.FC<{
  location: Location;
  onMapReady?: (map: L.Map) => void;
}> = ({ location, onMapReady }) => {
  const map = useMap();
  const lastLocationRef = useRef<string>("");

  useEffect(() => {
    if (map && onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  useEffect(() => {
    if (isValidCoord(location?.coords) && map) {
      const locationKey = `${location.coords.lat}-${location.coords.lng}-${location.zoom}`;

      // Only update if location actually changed
      if (lastLocationRef.current === locationKey) {
        return;
      }

      lastLocationRef.current = locationKey;
      const startTime = performance.now();

      console.log("MapUpdater: Map instance found, attempting to flyTo");

      // Add a small delay to ensure the map is fully initialized
      const timer = setTimeout(() => {
        try {
          console.log(
            "MapUpdater: Flying to",
            location.coords,
            "zoom:",
            location.zoom
          );

          // Use setView instead of flyTo for better performance
          map.setView(location.coords, location.zoom, {
            animate: true,
            duration: 0.8, // Reduced duration
            easeLinearity: 0.25,
          });

          performanceLog("Map flyTo", startTime);
        } catch (error) {
          console.warn("Map flyTo failed:", error);
        }
      }, 100); // Reduced delay

      return () => clearTimeout(timer);
    }
  }, [location, map]);

  return null;
};

// Memoized marker component to prevent unnecessary re-renders
const MapMarker: React.FC<{
  location: Location;
  isActive: boolean;
}> = React.memo(({ location, isActive }) => {
  if (!isValidCoord(location?.coords)) {
    return null;
  }

  return (
    <Marker
      position={location.coords}
      icon={isActive ? getActiveIcon() : getInactiveIcon()}
    >
      <Tooltip
        permanent
        direction={isActive ? "bottom" : "top"}
        offset={isActive ? [0, 9] : [0, -6]}
        className="leaflet-tooltip-custom"
      >
        {location.name}
      </Tooltip>
    </Marker>
  );
});

MapMarker.displayName = "MapMarker";

// Virtualized markers component - only render markers in viewport
const VirtualizedMarkers: React.FC<{
  locations: Location[];
  isActiveLocation: (loc: Location) => boolean;
}> = React.memo(({ locations, isActiveLocation }) => {
  const map = useMap();
  const [visibleLocations, setVisibleLocations] =
    useState<Location[]>(locations);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!map) return;

    const updateVisibleMarkers = () => {
      const bounds = map.getBounds();
      const visible = locations.filter(
        (loc) => isValidCoord(loc.coords) && bounds.contains(loc.coords)
      );

      // Always include active location
      const activeLocation = locations.find((loc) => isActiveLocation(loc));
      if (
        activeLocation &&
        !visible.find((loc) => loc.name === activeLocation.name)
      ) {
        visible.push(activeLocation);
      }

      setVisibleLocations(visible);
    };

    // Debounced update function
    const debouncedUpdate = () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      updateTimeoutRef.current = setTimeout(updateVisibleMarkers, 100);
    };

    // Update on map move with debouncing
    map.on("moveend", debouncedUpdate);
    map.on("zoomend", debouncedUpdate);

    // Initial update
    updateVisibleMarkers();

    return () => {
      map.off("moveend", debouncedUpdate);
      map.off("zoomend", debouncedUpdate);
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [map, locations, isActiveLocation]);

  return (
    <>
      {visibleLocations.map((loc) => (
        <MapMarker
          key={loc.name}
          location={loc}
          isActive={isActiveLocation(loc)}
        />
      ))}
    </>
  );
});

VirtualizedMarkers.displayName = "VirtualizedMarkers";

export const MapView: React.FC<{
  location: Location;
  allEvents: AppEvent[];
}> = ({ location, allEvents }) => {
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Memoize unique locations to prevent unnecessary recalculations
  const uniqueLocations = useMemo(
    () =>
      Array.from(
        new Map(allEvents.map((e) => [e.location?.name, e.location])).values()
      ).filter((loc): loc is Location => loc !== undefined && loc !== null),
    [allEvents]
  );

  // Memoize the active location check
  const isActiveLocation = useCallback(
    (loc: Location) => location.name === loc.name,
    [location.name]
  );

  // Handle map load completion
  const handleMapReady = useCallback(() => {
    const startTime = performance.now();
    console.log("Map is ready");

    setIsMapLoaded(true);
    setMapError(null);
    setShowFallback(false);

    performanceLog("Map initialization", startTime);

    // Force a resize to ensure the map renders properly
    setTimeout(() => {
      if (mapContainerRef.current) {
        const mapElement =
          mapContainerRef.current.querySelector(".leaflet-container");
        if (mapElement) {
          console.log("Forcing map resize");
          window.dispatchEvent(new Event("resize"));
        }
      }
    }, 50);
  }, []);

  // Handle map errors
  const handleMapError = useCallback((error: any) => {
    console.error("Map error:", error);
    setMapError("Failed to load map");
  }, []);

  // Show fallback after a timeout if map doesn't load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isMapLoaded && !mapError) {
        console.log("Map not loaded after timeout, showing fallback");
        setShowFallback(true);
      }
    }, 2000); // Reduced timeout

    return () => clearTimeout(timer);
  }, [isMapLoaded, mapError]);

  // Optimize map performance after it's loaded
  useEffect(() => {
    if (isMapLoaded && mapInstanceRef.current) {
      const map = mapInstanceRef.current;

      // Optimize map performance
      map.options.zoomSnap = 0.5;
      map.options.zoomDelta = 0.5;
      map.options.wheelDebounceTime = 40;
      map.options.wheelPxPerZoomLevel = 60;

      // Preload tiles for better performance
      map.invalidateSize();
    }
  }, [isMapLoaded]);

  if (!isValidCoord(location?.coords)) {
    console.log("Invalid coordinates:", location);
    return <MapLoadingState />;
  }

  console.log("Rendering map for location:", location.name, location.coords);

  return (
    <>
      <div
        ref={mapContainerRef}
        className="w-full h-96 lg:h-auto bg-surface rounded-xl shadow-md z-10 overflow-hidden flex-grow"
        style={{ minHeight: "384px" }}
      >
        {mapError ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-500 mb-2">Map failed to load</p>
              <button
                onClick={() => setMapError(null)}
                className="px-4 py-2 bg-primary text-white rounded"
              >
                Retry
              </button>
            </div>
          </div>
        ) : showFallback ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <p className="text-gray-600 mb-2">Map loading slowly...</p>
              <p className="text-sm text-gray-500">Location: {location.name}</p>
              <p className="text-sm text-gray-500">
                Coordinates: {location.coords.lat}, {location.coords.lng}
              </p>
              <button
                onClick={() => {
                  setShowFallback(false);
                  setIsMapLoaded(false);
                }}
                className="px-4 py-2 bg-primary text-white rounded mt-2"
              >
                Retry Map
              </button>
            </div>
          </div>
        ) : (
          <MapContainer
            key={`map-${location.name}-${location.coords.lat}-${location.coords.lng}`}
            center={location.coords}
            zoom={location.zoom}
            scrollWheelZoom={true}
            style={{
              height: "100%",
              width: "100%",
              minHeight: "384px",
            }}
            whenReady={handleMapReady}
            zoomSnap={0.5}
            zoomDelta={0.5}
            wheelDebounceTime={40}
            wheelPxPerZoomLevel={60}
          >
            <TileLayer
              attribution='<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
              url="https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.png?key=BvbvT2Q3VczQYsIUuwaO"
              maxZoom={18}
              minZoom={1}
              updateWhenZooming={false}
              updateWhenIdle={true}
              keepBuffer={2}
              maxNativeZoom={18}
            />
            <MapUpdater
              location={location}
              onMapReady={(map) => {
                mapInstanceRef.current = map;
              }}
            />
            <VirtualizedMarkers
              locations={uniqueLocations}
              isActiveLocation={isActiveLocation}
            />
          </MapContainer>
        )}
      </div>
      <MapPerformanceMonitor isVisible={isMapLoaded} />
    </>
  );
};

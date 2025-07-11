import React, { useEffect, useState } from "react";

interface MapPreloaderProps {
  children: React.ReactNode;
}

// Global flag to track if map resources have been preloaded
let mapResourcesPreloaded = false;

export const MapPreloader: React.FC<MapPreloaderProps> = ({ children }) => {
  const [isPreloading, setIsPreloading] = useState(false);

  useEffect(() => {
    // Load Leaflet CSS immediately to ensure map renders properly
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
      link.crossOrigin = "";
      document.head.appendChild(link);
      console.log("Leaflet CSS loaded");
    }

    // Only preload once per session
    if (mapResourcesPreloaded) {
      return;
    }

    const preloadMapResources = async () => {
      setIsPreloading(true);

      try {
        // Preload a few map tiles for common zoom levels
        const preloadTiles = async () => {
          const baseUrl = "https://api.maptiler.com/maps/outdoor";
          const key = "BvbvT2Q3VczQYsIUuwaO";

          // Preload tiles for a common area (around the world center)
          const tiles = [
            `${baseUrl}/1/0/0.png?key=${key}`,
            `${baseUrl}/2/1/1.png?key=${key}`,
            `${baseUrl}/3/2/2.png?key=${key}`,
          ];

          const preloadPromises = tiles.map((url) => {
            return new Promise<void>((resolve) => {
              const img = new Image();
              img.onload = () => resolve();
              img.onerror = () => resolve(); // Don't fail if tile fails to load
              img.src = url;
            });
          });

          await Promise.allSettled(preloadPromises);
        };

        // Preload tiles in the background (don't wait for completion)
        preloadTiles().catch(() => {
          // Silently fail - this is just optimization
        });

        mapResourcesPreloaded = true;
        console.log("Map resources preloaded successfully");
      } catch (error) {
        console.warn("Failed to preload map resources:", error);
      } finally {
        setIsPreloading(false);
      }
    };

    // Start preloading after a short delay to not block initial page load
    const timer = setTimeout(preloadMapResources, 1000);

    return () => clearTimeout(timer);
  }, []);

  return <>{children}</>;
};

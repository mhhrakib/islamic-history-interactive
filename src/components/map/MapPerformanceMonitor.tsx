import React, { useEffect, useState } from "react";

interface PerformanceMetrics {
  mapLoadTime: number;
  tileLoadTime: number;
  markerRenderTime: number;
  frameRate: number;
  memoryUsage?: number;
}

export const MapPerformanceMonitor: React.FC<{
  isVisible?: boolean;
}> = ({ isVisible = false }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    mapLoadTime: 0,
    tileLoadTime: 0,
    markerRenderTime: 0,
    frameRate: 0,
  });

  useEffect(() => {
    if (!isVisible) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFrameRate = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setMetrics((prev) => ({ ...prev, frameRate: fps }));
        frameCount = 0;
        lastTime = currentTime;
      }

      animationId = requestAnimationFrame(measureFrameRate);
    };

    animationId = requestAnimationFrame(measureFrameRate);

    // Monitor memory usage if available
    const checkMemory = () => {
      if ("memory" in performance) {
        const memory = (performance as any).memory;
        setMetrics((prev) => ({
          ...prev,
          memoryUsage: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
        }));
      }
    };

    const memoryInterval = setInterval(checkMemory, 2000);

    return () => {
      cancelAnimationFrame(animationId);
      clearInterval(memoryInterval);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-50">
      <div className="space-y-1">
        <div>FPS: {metrics.frameRate}</div>
        {metrics.memoryUsage && <div>Memory: {metrics.memoryUsage}MB</div>}
        <div>Map Load: {metrics.mapLoadTime}ms</div>
        <div>Tiles: {metrics.tileLoadTime}ms</div>
        <div>Markers: {metrics.markerRenderTime}ms</div>
      </div>
    </div>
  );
};

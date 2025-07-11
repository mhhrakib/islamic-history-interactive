import React from "react";
import { LoadingSpinner } from "../common/LoadingSpinner";

interface MapLoadingStateProps {
  className?: string;
}

export const MapLoadingState: React.FC<MapLoadingStateProps> = ({
  className = "",
}) => {
  return (
    <div
      className={`w-full h-96 lg:h-auto bg-surface dark:bg-gray-800 rounded-xl shadow-md overflow-hidden flex-grow flex items-center justify-center ${className}`}
    >
      <div className="text-center">
        <LoadingSpinner size="lg" text="Loading map..." />
        <p className="text-text-secondary dark:text-gray-400 mt-4 text-sm">
          Preparing interactive map...
        </p>
      </div>
    </div>
  );
};

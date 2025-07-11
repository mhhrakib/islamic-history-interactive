import React from "react";
import { LoadingSpinner } from "./LoadingSpinner";

interface TranslationLoaderProps {
  isLoading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export const TranslationLoader: React.FC<TranslationLoaderProps> = ({
  isLoading,
  children,
  fallback,
  className = "",
}) => {
  if (isLoading) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <LoadingSpinner size="sm" text="Loading..." />
      </div>
    );
  }

  return <>{children}</>;
};

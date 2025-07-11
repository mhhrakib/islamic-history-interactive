import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  text,
  className = "",
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  if (text) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div
          className={`animate-spin rounded-full border-2 border-gray-300 border-t-primary dark:border-gray-600 dark:border-t-green-400 ${sizeClasses[size]}`}
        />
        <span
          className={`text-text-secondary dark:text-gray-400 ${textSizeClasses[size]}`}
        >
          {text}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`animate-spin rounded-full border-2 border-gray-300 border-t-primary dark:border-gray-600 dark:border-t-green-400 ${sizeClasses[size]} ${className}`}
    />
  );
};

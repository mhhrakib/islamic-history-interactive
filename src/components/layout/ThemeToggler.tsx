import React from "react";
import { useTheme } from "../../hooks/useTheme";
import { SunIcon, MoonIcon } from "../common/icons";

export const ThemeToggler: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full text-text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-gray-200 hover:bg-border-color dark:hover:bg-gray-700 transition-colors"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <MoonIcon className="w-6 h-6" />
      ) : (
        <SunIcon className="w-6 h-6" />
      )}
    </button>
  );
};

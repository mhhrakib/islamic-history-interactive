import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  KaabaIcon,
  StreakIcon,
  ProgressIcon,
  TrophyIcon,
  ArrowLeftIcon,
} from "../common/icons";
import { useData } from "../../hooks/useData";
import type { HistoricalEra } from "../../types";
import { ThemeToggler } from "../layout/ThemeToggler";
import { ProfileDropdown } from "../auth/ProfileDropdown";
import { LanguageSwitcher } from "../layout/LanguageSwitcher";
import { useTranslation } from "../../hooks/useTranslation";

interface ProfilePageProps {
  onNavigate: (
    page: "home" | "topic" | "profile" | "quiz" | "leaderboard"
  ) => void;
}

const StatCard: React.FC<{
  icon: React.ReactElement<{ className?: string }>;
  title: string;
  value: string | number;
  color: string;
  darkColor: string;
  iconColor: string;
  darkIconColor: string;
}> = ({ icon, title, value, color, darkColor, iconColor, darkIconColor }) => (
  <div className="bg-surface dark:bg-gray-800 rounded-xl shadow-md p-6 flex flex-col items-center text-center">
    <div
      className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${color} ${darkColor}`}
    >
      {React.cloneElement(icon, {
        className: `w-7 h-7 ${iconColor} ${darkIconColor}`,
      })}
    </div>
    <p className="text-3xl font-bold text-primary dark:text-gray-100">
      {value}
    </p>
    <p className="text-sm text-text-secondary dark:text-gray-400 font-semibold mt-1 uppercase tracking-wider">
      {title}
    </p>
  </div>
);

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { user, profile, isAdmin } = useAuth();
  const { eras, importData } = useData();
  const { t } = useTranslation();
  const allEventsCount = eras
    .flatMap((e) => e.topics)
    .flatMap((t) => t.events).length;

  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [importError, setImportError] = useState<string | null>(null);

  const handleExportData = () => {
    try {
      const dataString = JSON.stringify(eras, null, 2);
      const blob = new Blob([dataString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "islamicHistoryData.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export data:", error);
      alert("An error occurred while trying to export the data.");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setImportError(null);
      setFileContent(null);

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === "string") {
          setFileContent(text);
        } else {
          setImportError("Failed to read file content.");
        }
      };
      reader.onerror = () => {
        setImportError("Error reading the selected file.");
      };
      reader.readAsText(file);
    }
  };

  const handleImportData = () => {
    if (!fileContent) {
      alert("No file content to import.");
      return;
    }

    const isConfirmed = window.confirm(
      "WARNING: This action is irreversible.\n\n" +
        "It will completely replace all existing application data with the content of the selected file. Are you absolutely sure you want to proceed?"
    );

    if (isConfirmed) {
      try {
        const parsedData = JSON.parse(fileContent);

        // Basic validation
        if (
          Array.isArray(parsedData) &&
          (parsedData.length === 0 ||
            (parsedData[0].title && parsedData[0].topics))
        ) {
          importData(parsedData as HistoricalEra[]);
          setFileContent(null);
          setFileName("");
          setImportError(null);
        } else {
          throw new Error(
            "JSON file is not in the expected format for Historical Eras."
          );
        }
      } catch (error) {
        console.error("Failed to import and parse data:", error);
        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred.";
        setImportError(`Import failed: ${errorMessage}`);
        alert(`Import failed: ${errorMessage}`);
      }
    }
  };

  // Updated check to handle admin user who does not have a profile object
  if (!user || (!profile && !isAdmin)) {
    return (
      <div className="text-center p-8">
        <p>{t("profile.loginRequired")}</p>
        <button
          onClick={() => onNavigate("home")}
          className="mt-4 px-4 py-2 bg-primary dark:bg-green-600 text-white rounded-lg"
        >
          {t("profile.goToHome")}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base dark:bg-gray-900 text-text-primary dark:text-gray-200">
      <header className="bg-surface/90 dark:bg-gray-800/90 backdrop-blur-sm border-b border-border-color dark:border-gray-700 sticky top-0 z-20">
        <div className="container mx-auto px-4 md:px-8">
          <div className="py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => onNavigate("home")}
                aria-label={t("goBack")}
                className="mr-1 -ml-2 p-2 rounded-full hover:bg-border-color dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowLeftIcon className="w-6 h-6 text-primary dark:text-green-300" />
              </button>
              <KaabaIcon className="w-8 h-8 text-primary dark:text-green-300 shrink-0" />
              <div>
                <h1 className="text-xl md:text-2xl font-serif font-semibold text-primary dark:text-green-300">
                  {isAdmin ? t("profile.title.admin") : t("profile.title.user")}
                </h1>
                <p className="text-sm text-text-secondary dark:text-gray-400 font-sans hidden sm:block">
                  {user.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggler />
              <LanguageSwitcher />
              <ProfileDropdown
                onLoginClick={() => {}}
                onNavigate={onNavigate}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        {profile && (
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <StatCard
                icon={<ProgressIcon />}
                title={t("profile.stats.completed")}
                value={`${profile.completedEventIds.length}/${allEventsCount}`}
                color="bg-green-100"
                darkColor="dark:bg-green-900/50"
                iconColor="text-green-600"
                darkIconColor="dark:text-green-300"
              />
              <StatCard
                icon={<StreakIcon />}
                title={t("profile.stats.streak")}
                value={profile.dailyStreak}
                color="bg-orange-100"
                darkColor="dark:bg-orange-900/50"
                iconColor="text-orange-600"
                darkIconColor="dark:text-orange-300"
              />
              <StatCard
                icon={<TrophyIcon />}
                title={t("profile.stats.highScore")}
                value={profile.globalQuizStats.highScore.toLocaleString()}
                color="bg-yellow-100"
                darkColor="dark:bg-yellow-900/50"
                iconColor="text-yellow-600"
                darkIconColor="dark:text-yellow-300"
              />
            </div>
          </section>
        )}

        {isAdmin && (
          <section className="mt-12">
            <div className="bg-surface dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-serif font-bold text-primary dark:text-green-300 mb-4">
                {t("profile.admin.title")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-lg text-text-primary dark:text-gray-100">
                    {t("profile.admin.export.button")}
                  </h3>
                  <p className="text-sm text-text-secondary dark:text-gray-400 mt-1 mb-3">
                    {t("profile.admin.export.description")}
                  </p>
                  <button
                    onClick={handleExportData}
                    className="px-4 py-2 bg-primary dark:bg-green-600 text-white rounded-lg font-semibold hover:bg-opacity-90 transition-colors"
                  >
                    {t("profile.admin.export.button")}
                  </button>
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-text-primary dark:text-gray-100">
                    {t("profile.admin.import.title")}
                  </h3>
                  <p className="text-sm text-text-secondary dark:text-gray-400 mt-1 mb-3">
                    {t("profile.admin.import.description")}
                  </p>
                  <div className="flex items-center gap-2">
                    <label className="px-4 py-2 bg-surface dark:bg-gray-700 border border-border-color dark:border-gray-600 text-primary dark:text-green-300 rounded-lg font-semibold hover:bg-base dark:hover:bg-gray-700/50 cursor-pointer">
                      {t("profile.admin.import.selectFile")}
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={handleImportData}
                      disabled={!fileContent}
                      className="px-4 py-2 bg-secondary dark:bg-red-600 text-white rounded-lg font-semibold hover:bg-opacity-90 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                      {t("profile.admin.import.button")}
                    </button>
                  </div>
                  {fileName && (
                    <p className="text-xs mt-2 text-text-secondary dark:text-gray-500">
                      Selected: {fileName}
                    </p>
                  )}
                  {importError && (
                    <p className="text-xs mt-2 text-red-600 dark:text-red-400">
                      {importError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

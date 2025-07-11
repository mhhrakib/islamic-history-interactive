import React from "react";
import { KaabaIcon } from "../common/icons";
import { ProfileDropdown } from "../auth/ProfileDropdown";
import { UserStats } from "../profile/UserStats";
import { ThemeToggler } from "../layout/ThemeToggler";
import { LanguageSwitcher } from "../layout/LanguageSwitcher";
import { useTranslation } from "../../hooks/useTranslation";

interface HomeHeaderProps {
  onLoginClick: () => void;
  onNavigate: (page: "profile" | "quiz" | "leaderboard") => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  onLoginClick,
  onNavigate,
}) => {
  const { t } = useTranslation();

  return (
    <header className="bg-surface/90 dark:bg-gray-800/90 backdrop-blur-sm border-b border-border-color dark:border-gray-700 sticky top-0 z-30">
      <div className="container mx-auto px-4 md:px-8">
        <div className="py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <KaabaIcon className="w-8 h-8 text-primary dark:text-green-300" />
            <div>
              <h1 className="text-xl md:text-2xl font-serif font-semibold text-primary dark:text-green-300">
                {t("app.title")}
              </h1>
              <p className="text-sm text-text-secondary dark:text-gray-400 font-sans">
                {t("app.subtitle")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggler />
            <LanguageSwitcher />
            <UserStats />
            <ProfileDropdown
              onLoginClick={onLoginClick}
              onNavigate={onNavigate}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

import React, { forwardRef } from "react";
import { KaabaIcon, ArrowLeftIcon } from "../common/icons";
import { ProfileDropdown } from "../auth/ProfileDropdown";
import { UserStats } from "../profile/UserStats";
import { ThemeToggler } from "./ThemeToggler";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTranslation } from "../../hooks/useTranslation";

interface TitleBarProps {
  isStickyHeaderVisible?: boolean;
  stickyHeaderText?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  onLoginClick: () => void;
  onNavigate?: (page: "profile") => void;
}

export const TitleBar = forwardRef<HTMLDivElement, TitleBarProps>(
  (
    {
      isStickyHeaderVisible = false,
      stickyHeaderText = "",
      showBackButton = false,
      onBackClick,
      onLoginClick,
      onNavigate,
    },
    ref
  ) => {
    const { t } = useTranslation();

    return (
      <header
        ref={ref}
        className="bg-surface/90 dark:bg-gray-800/90 backdrop-blur-sm border-b border-border-color dark:border-gray-700 sticky top-0 z-30"
      >
        <div className="container mx-auto px-4 md:px-8">
          <div className="py-3 flex items-center gap-4">
            {showBackButton && (
              <button
                onClick={onBackClick}
                aria-label={t("goBack")}
                className="mr-1 -ml-2 p-2 rounded-full hover:bg-border-color dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowLeftIcon className="w-6 h-6 text-primary dark:text-green-300" />
              </button>
            )}
            <div className="flex items-center gap-4 flex-grow">
              <KaabaIcon className="w-8 h-8 text-primary dark:text-green-300 shrink-0" />
              <div>
                <h1 className="text-xl md:text-2xl font-serif font-semibold text-primary dark:text-green-300">
                  {t("titleBar.title")}
                </h1>
                <p className="text-sm text-text-secondary dark:text-gray-400 font-sans hidden sm:block">
                  {t("titleBar.subtitle")}
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

          {/* Mobile-only Sticky Event Header part, integrated into the main header */}
          <div
            className={`
            lg:hidden overflow-hidden transition-all duration-300 ease-in-out
            ${
              isStickyHeaderVisible
                ? "max-h-20 py-2 opacity-100 border-t border-border-color/50 dark:border-gray-700/50"
                : "max-h-0 py-0 opacity-0"
            }
          `}
            aria-hidden={!isStickyHeaderVisible}
          >
            <p className="font-sans font-bold text-primary dark:text-green-300 truncate">
              {stickyHeaderText}
            </p>
          </div>
        </div>
      </header>
    );
  }
);

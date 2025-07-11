import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
import { ProfileIcon, LogoutIcon } from "../common/icons";
import { useTranslation } from "../../hooks/useTranslation";

interface ProfileDropdownProps {
  onLoginClick: () => void;
  onNavigate?: (page: "profile") => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  onLoginClick,
  onNavigate,
}) => {
  const { user, logout, isAdmin } = useAuth();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user || user.provider === "guest") {
    return (
      <button
        onClick={onLoginClick}
        className="px-4 py-2 bg-primary dark:bg-green-600 text-white rounded-lg font-semibold hover:bg-opacity-90 transition-colors shadow-sm text-sm"
      >
        {t("login")}
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 rounded-full bg-border-color dark:bg-gray-700 overflow-hidden ring-2 ring-offset-2 ring-offset-surface dark:ring-offset-gray-800 ${
          isAdmin
            ? "ring-secondary dark:ring-red-500"
            : "ring-primary dark:ring-green-400"
        }`}
      >
        <img
          src={user.avatarUrl}
          alt="User avatar"
          className="w-full h-full object-cover"
        />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-surface dark:bg-gray-800 rounded-lg shadow-xl border border-border-color dark:border-gray-700 z-50 animate-dropdown">
          <div className="p-2 border-b border-border-color dark:border-gray-700">
            <p className="font-semibold text-text-primary dark:text-gray-100 truncate px-2">
              {user.name}
            </p>
            <p className="text-xs text-text-secondary dark:text-gray-400 px-2 capitalize flex items-center gap-1.5">
              {isAdmin && (
                <span className="text-xs font-bold text-secondary dark:text-red-400">
                  [ADMIN]
                </span>
              )}
              {user.provider} Account
            </p>
          </div>
          <div className="p-1">
            {onNavigate && (
              <button
                onClick={() => {
                  onNavigate("profile");
                  setIsOpen(false);
                }}
                className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-text-primary dark:text-gray-200 rounded-md hover:bg-base dark:hover:bg-gray-700"
              >
                <ProfileIcon className="w-5 h-5" />
                {isAdmin
                  ? t("profileDropdown.adminConsole")
                  : t("profileDropdown.myProfile")}
              </button>
            )}
            <button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogoutIcon className="w-5 h-5" />
              {t("logout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

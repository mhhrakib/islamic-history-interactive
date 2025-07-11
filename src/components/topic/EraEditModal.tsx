import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import type { HistoricalEra } from "../../types";
import { CloseIcon } from "../common/icons";
import { useTranslation } from "../../hooks/useTranslation";

interface EraEditModalProps {
  era: HistoricalEra | null;
  onClose: () => void;
  onSave: (data: { title: string; description: string }) => void;
}

const inputClass =
  "w-full p-2 border border-border-color dark:border-gray-600 rounded-md bg-base dark:bg-gray-700 focus:ring-2 focus:ring-primary dark:focus:ring-green-400 focus:border-primary dark:focus:border-green-400 transition text-text-primary dark:text-gray-100";
const textareaClass = `${inputClass} min-h-[100px] resize-y`;
const labelClass =
  "block text-sm font-semibold text-text-primary dark:text-gray-200 mb-1";

export const EraEditModal: React.FC<EraEditModalProps> = ({
  era,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
    if (era) {
      setTitle(era.title);
      setDescription(era.description);
    } else {
      setTitle("New Era Title");
      setDescription("A description for this new era.");
    }
  }, [era]);

  const handleSave = useCallback(() => {
    if (title.trim() && description.trim()) {
      onSave({ title, description });
    } else {
      alert("Title and description cannot be empty.");
    }
  }, [title, description, onSave]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (
        e.key === "Enter" &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, handleSave]);

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg m-4 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 border-b border-border-color dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-serif font-bold text-primary dark:text-green-300">
            {era ? t("eraModal.title.edit") : t("eraModal.title.add")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-gray-100 rounded-full"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="p-6 space-y-4">
          <div>
            <label htmlFor="era-title" className={labelClass}>
              {t("eraModal.label.title")}
            </label>
            <input
              id="era-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="era-description" className={labelClass}>
              {t("eraModal.label.description")}
            </label>
            <textarea
              id="era-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={textareaClass}
            />
          </div>
        </main>
        <footer className="p-4 bg-base/50 dark:bg-gray-900/50 border-t border-border-color dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface dark:bg-gray-700 border border-border-color dark:border-gray-600 rounded-lg font-semibold text-text-secondary dark:text-gray-300 hover:bg-border-color/50 dark:hover:bg-gray-600"
          >
            {t("eraModal.button.cancel")}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary dark:bg-green-600 text-white rounded-lg font-semibold hover:bg-opacity-90 transition-colors shadow-sm"
          >
            {era ? t("eraModal.button.save") : t("eraModal.button.create")}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
};

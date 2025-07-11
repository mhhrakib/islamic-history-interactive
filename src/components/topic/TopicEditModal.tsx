import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import type { HistoricalTopic } from "../../types";
import { CloseIcon } from "../common/icons";
import { useTranslation } from "../../hooks/useTranslation";

interface TopicEditModalProps {
  topic: HistoricalTopic | null;
  onClose: () => void;
  onSave: (data: {
    name: string;
    title: string;
    period: string;
    bio: string;
    isFeatured: boolean;
  }) => void;
}

const inputClass =
  "w-full p-2 border border-border-color dark:border-gray-600 rounded-md bg-base dark:bg-gray-700 focus:ring-2 focus:ring-primary dark:focus:ring-green-400 focus:border-primary dark:focus:border-green-400 transition text-text-primary dark:text-gray-100";
const textareaClass = `${inputClass} min-h-[120px] resize-y`;
const labelClass =
  "block text-sm font-semibold text-text-primary dark:text-gray-200 mb-1";

export const TopicEditModal: React.FC<TopicEditModalProps> = ({
  topic,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    period: "",
    bio: "",
    isFeatured: false,
  });

  useEffect(() => {
    if (topic) {
      setFormData({
        name: topic.name,
        title: topic.title,
        period: topic.period,
        bio: topic.bio,
        isFeatured: topic.isFeatured || false,
      });
    } else {
      setFormData({
        name: "New Topic Name",
        title: "Subtitle for the topic",
        period: "e.g., 610 - 632 CE",
        bio: "A brief biography or introduction to this topic.",
        isFeatured: false,
      });
    }
  }, [topic]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = useCallback(() => {
    const { name, title, period, bio } = formData;
    if ([name, title, period, bio].every((field) => field.trim())) {
      onSave(formData);
    } else {
      alert("All text fields are required and cannot be empty.");
    }
  }, [formData, onSave]);

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
        className="bg-surface dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl m-4 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 border-b border-border-color dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-serif font-bold text-primary dark:text-green-300">
            {topic ? t("topicModal.title.edit") : t("topicModal.title.add")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-gray-100 rounded-full"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className={labelClass}>
                {t("topicModal.label.name")}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="title" className={labelClass}>
                {t("topicModal.label.title")}
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label htmlFor="period" className={labelClass}>
              {t("topicModal.label.period")}
            </label>
            <input
              id="period"
              name="period"
              type="text"
              value={formData.period}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="bio" className={labelClass}>
              {t("topicModal.label.bio")}
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className={textareaClass}
            />
          </div>
          <div>
            <div className="flex items-center gap-3 mt-2 p-3 bg-base dark:bg-gray-700/50 rounded-lg">
              <input
                id="isFeatured"
                name="isFeatured"
                type="checkbox"
                checked={formData.isFeatured}
                onChange={handleChange}
                className="h-5 w-5 rounded border-gray-300 text-primary dark:text-green-400 focus:ring-primary dark:focus:ring-green-500"
              />
              <label
                htmlFor="isFeatured"
                className="text-sm font-medium text-text-primary dark:text-gray-200 select-none"
              >
                {t("topicModal.label.featured")}
              </label>
            </div>
          </div>
        </main>
        <footer className="p-4 bg-base/50 dark:bg-gray-900/50 border-t border-border-color dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface dark:bg-gray-700 border border-border-color dark:border-gray-600 rounded-lg font-semibold text-text-secondary dark:text-gray-300 hover:bg-border-color/50 dark:hover:bg-gray-600"
          >
            {t("topicModal.button.cancel")}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary dark:bg-green-600 text-white rounded-lg font-semibold hover:bg-opacity-90 transition-colors shadow-sm"
          >
            {topic
              ? t("topicModal.button.save")
              : t("topicModal.button.create")}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
};

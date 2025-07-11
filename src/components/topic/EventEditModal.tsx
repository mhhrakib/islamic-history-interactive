import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { AppEvent, QuizItem, Location } from "../../types";
import {
  CloseIcon,
  PlusIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "../common/icons";
import { useTranslation } from "../../hooks/useTranslation";

interface EventEditModalProps {
  event: AppEvent;
  onSave: (event: AppEvent) => void;
  onClose: () => void;
}

const inputClass =
  "w-full p-2 border border-border-color dark:border-gray-600 rounded-md bg-base dark:bg-gray-700 focus:ring-2 focus:ring-primary dark:focus:ring-green-400 focus:border-primary dark:focus:border-green-400 transition text-text-primary dark:text-gray-100 dark:placeholder:text-gray-500";
const textareaClass = `${inputClass} min-h-[120px] resize-y`;
const labelClass =
  "block text-sm font-semibold text-text-primary dark:text-gray-200 mb-1";
const sectionClass =
  "p-4 border border-border-color dark:border-gray-700 rounded-lg";

export const EventEditModal: React.FC<EventEditModalProps> = ({
  event,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<AppEvent>(event);
  const [jsonInput, setJsonInput] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        onSave(formData);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onSave, formData]);

  const handleExportJson = () => {
    try {
      const jsonString = JSON.stringify(formData, null, 2);
      navigator.clipboard.writeText(jsonString);
      alert("Event JSON copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy JSON", error);
      alert("Failed to copy JSON. See console for details.");
    }
  };

  const handleApplyJson = () => {
    if (!jsonInput.trim()) {
      alert("JSON input is empty.");
      return;
    }
    try {
      const parsedData = JSON.parse(jsonInput);
      if (
        typeof parsedData === "object" &&
        parsedData !== null &&
        "title" in parsedData &&
        "story" in parsedData
      ) {
        const newEventData = { ...formData, ...parsedData, id: formData.id };
        setFormData(newEventData);
        alert(
          'JSON applied successfully! Review the form and click "Save Changes".'
        );
      } else {
        alert(
          "Invalid JSON format for an event. It must be an object with at least 'title' and 'story' properties."
        );
      }
    } catch (error: any) {
      console.error("Failed to parse JSON", error);
      alert(`Failed to parse JSON: ${error.message}`);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (
    field: keyof Location | "lat" | "lng",
    value: string
  ) => {
    setFormData((prev) => {
      const newLocation: Location = prev.location
        ? { ...prev.location }
        : { name: "", coords: { lat: 0, lng: 0 }, zoom: 10 };

      if (field === "name") {
        newLocation.name = value;
      } else if (field === "zoom") {
        newLocation.zoom = parseInt(value, 10) || 10;
      } else if (field === "lat" || field === "lng") {
        newLocation.coords = {
          ...newLocation.coords,
          [field]: parseFloat(value) || 0,
        };
      }

      return { ...prev, location: newLocation };
    });
  };

  const handleDeleteLocation = () => {
    const newFormData = { ...formData };
    delete newFormData.location;
    setFormData(newFormData);
  };

  const handleArrayChange = <T,>(
    arrayName: keyof AppEvent,
    index: number,
    field: keyof T,
    value: string
  ) => {
    setFormData((prev) => {
      const newArray = [...((prev[arrayName] as T[]) || [])];
      newArray[index] = { ...newArray[index], [field]: value };
      return { ...prev, [arrayName]: newArray };
    });
  };

  const handleSimpleArrayChange = (
    arrayName: keyof AppEvent,
    index: number,
    value: string
  ) => {
    setFormData((prev) => {
      const newArray = [...((prev[arrayName] as string[]) || [])];
      newArray[index] = value;
      return { ...prev, [arrayName]: newArray };
    });
  };

  const handleAddToArray = <T,>(arrayName: keyof AppEvent, newItem: T) => {
    setFormData((prev) => ({
      ...prev,
      [arrayName]: [...((prev[arrayName] as T[]) || []), newItem],
    }));
  };

  const handleRemoveFromArray = (arrayName: keyof AppEvent, index: number) => {
    setFormData((prev) => ({
      ...prev,
      [arrayName]: (prev[arrayName] as any[]).filter((_, i) => i !== index),
    }));
  };

  const handleQuizOptionChange = (
    qIndex: number,
    oIndex: number,
    value: string
  ) => {
    setFormData((prev) => {
      const newQuiz = [...((prev.quiz as QuizItem[]) || [])];
      const newOptions = [...newQuiz[qIndex].options];
      newOptions[oIndex] = value;
      newQuiz[qIndex] = { ...newQuiz[qIndex], options: newOptions };
      return { ...prev, quiz: newQuiz };
    });
  };

  const handleCorrectAnswerChange = (qIndex: number, oIndex: number) => {
    setFormData((prev) => {
      const newQuiz = [...((prev.quiz as QuizItem[]) || [])];
      newQuiz[qIndex] = { ...newQuiz[qIndex], correctAnswerIndex: oIndex };
      return { ...prev, quiz: newQuiz };
    });
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 border-b border-border-color dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-serif font-bold text-primary dark:text-green-300">
            {event.id === -1
              ? t("eventModal.title.add")
              : t("eventModal.title.edit")}
          </h2>
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="text-text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-gray-100"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
            <button
              onClick={() => onSave(formData)}
              className="px-4 py-2 bg-primary dark:bg-green-600 text-white rounded-lg font-semibold hover:bg-opacity-90 transition-colors"
            >
              {t("eventModal.button.save")}
            </button>
          </div>
        </header>
        <main className="flex-grow overflow-y-auto p-6 space-y-6">
          <div className={sectionClass}>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex justify-between items-center text-left font-semibold text-text-primary dark:text-gray-200"
            >
              <h3>{t("eventModal.advanced.title")}</h3>
              {showAdvanced ? (
                <ChevronUpIcon className="w-5 h-5" />
              ) : (
                <ChevronDownIcon className="w-5 h-5" />
              )}
            </button>
            {showAdvanced && (
              <div className="mt-4 space-y-4 pt-4 border-t border-border-color/50 dark:border-gray-700/50 animate-fade-in">
                <div>
                  <label className={labelClass}>
                    {t("eventModal.advanced.export.title")}
                  </label>
                  <p className="text-xs text-text-secondary dark:text-gray-400 mb-2">
                    {t("eventModal.advanced.export.description")}
                  </p>
                  <button
                    onClick={handleExportJson}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
                  >
                    {t("eventModal.advanced.export.button")}
                  </button>
                </div>
                <div className="mt-4">
                  <label htmlFor="json-import" className={labelClass}>
                    {t("eventModal.advanced.import.title")}
                  </label>
                  <p className="text-xs text-text-secondary dark:text-gray-400 mb-2">
                    {t("eventModal.advanced.import.description")}
                  </p>
                  <textarea
                    id="json-import"
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    className={`${textareaClass} min-h-[150px] font-mono text-xs`}
                    placeholder="Paste event JSON here..."
                  />
                  <button
                    onClick={handleApplyJson}
                    className="mt-2 px-4 py-2 bg-secondary dark:bg-red-600 text-white rounded-lg font-semibold hover:bg-opacity-90 transition-colors text-sm"
                  >
                    {t("eventModal.advanced.import.button")}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className={labelClass}>
                {t("eventModal.label.title")}
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="year" className={labelClass}>
                {t("eventModal.label.year")}
              </label>
              <input
                type="text"
                id="year"
                name="year"
                value={formData.year}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="story" className={labelClass}>
              {t("eventModal.label.story")}
            </label>
            <textarea
              id="story"
              name="story"
              value={formData.story}
              onChange={handleChange}
              className={textareaClass}
            />
          </div>

          <div className={sectionClass}>
            <div className="flex justify-between items-center mb-2">
              <h3 className={labelClass}>{t("eventModal.label.location")}</h3>
              {formData.location && (
                <button
                  onClick={handleDeleteLocation}
                  className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full flex items-center gap-1 text-xs font-semibold"
                >
                  <TrashIcon className="w-4 h-4" />{" "}
                  {t("eventModal.location.delete")}
                </button>
              )}
            </div>
            {formData.location ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="loc_name" className={`${labelClass} text-xs`}>
                    {t("eventModal.location.name")}
                  </label>
                  <input
                    type="text"
                    id="loc_name"
                    value={formData.location.name}
                    onChange={(e) =>
                      handleLocationChange("name", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="loc_lat" className={`${labelClass} text-xs`}>
                    {t("eventModal.location.lat")}
                  </label>
                  <input
                    type="number"
                    id="loc_lat"
                    value={formData.location.coords.lat}
                    onChange={(e) =>
                      handleLocationChange("lat", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="loc_lng" className={`${labelClass} text-xs`}>
                    {t("eventModal.location.lng")}
                  </label>
                  <input
                    type="number"
                    id="loc_lng"
                    value={formData.location.coords.lng}
                    onChange={(e) =>
                      handleLocationChange("lng", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="loc_zoom" className={`${labelClass} text-xs`}>
                    {t("eventModal.location.zoom")}
                  </label>
                  <input
                    type="number"
                    id="loc_zoom"
                    value={formData.location.zoom}
                    onChange={(e) =>
                      handleLocationChange("zoom", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            ) : (
              <button
                onClick={() => handleLocationChange("name", "New Location")}
                className="text-sm flex items-center gap-1 text-primary dark:text-green-300 font-semibold"
              >
                <PlusIcon className="w-4 h-4" /> {t("eventModal.location.add")}
              </button>
            )}
          </div>

          <div className={sectionClass}>
            <h3 className={labelClass}>{t("eventModal.label.lessons")}</h3>
            <div className="space-y-2">
              {formData.lessons?.map((lesson, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={lesson}
                    onChange={(e) =>
                      handleSimpleArrayChange("lessons", index, e.target.value)
                    }
                    className={inputClass}
                  />
                  <button
                    onClick={() => handleRemoveFromArray("lessons", index)}
                    className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => handleAddToArray("lessons", "New lesson")}
              className="mt-2 text-sm flex items-center gap-1 text-primary dark:text-green-300 font-semibold"
            >
              <PlusIcon className="w-4 h-4" /> {t("eventModal.lessons.add")}
            </button>
          </div>

          <div className={sectionClass}>
            <h3 className={labelClass}>{t("eventModal.label.glossary")}</h3>
            <div className="space-y-2">
              {formData.glossary?.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 border border-border-color/50 dark:border-gray-700/50 rounded"
                >
                  <input
                    type="text"
                    placeholder="Term"
                    value={item.term}
                    onChange={(e) =>
                      handleArrayChange(
                        "glossary",
                        index,
                        "term",
                        e.target.value
                      )
                    }
                    className={inputClass}
                  />
                  <input
                    type="text"
                    placeholder="Explanation"
                    value={item.explanation}
                    onChange={(e) =>
                      handleArrayChange(
                        "glossary",
                        index,
                        "explanation",
                        e.target.value
                      )
                    }
                    className={inputClass}
                  />
                  <button
                    onClick={() => handleRemoveFromArray("glossary", index)}
                    className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() =>
                handleAddToArray("glossary", { term: "", explanation: "" })
              }
              className="mt-2 text-sm flex items-center gap-1 text-primary dark:text-green-300 font-semibold"
            >
              <PlusIcon className="w-4 h-4" /> {t("eventModal.glossary.add")}
            </button>
          </div>

          <div className={sectionClass}>
            <h3 className={labelClass}>{t("eventModal.label.quotes")}</h3>
            <div className="space-y-2">
              {formData.quotes?.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-2 p-2 border border-border-color/50 dark:border-gray-700/50 rounded"
                >
                  <textarea
                    placeholder="Arabic Text (Optional)"
                    value={item.arabic || ""}
                    onChange={(e) =>
                      handleArrayChange(
                        "quotes",
                        index,
                        "arabic",
                        e.target.value
                      )
                    }
                    className={`${textareaClass} min-h-[60px] font-arabic text-lg text-right`}
                    dir="rtl"
                  />
                  <textarea
                    placeholder="Translation"
                    value={item.translation}
                    onChange={(e) =>
                      handleArrayChange(
                        "quotes",
                        index,
                        "translation",
                        e.target.value
                      )
                    }
                    className={`${textareaClass} min-h-[60px]`}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Source (e.g., Qur'an 2:153)"
                      value={item.source}
                      onChange={(e) =>
                        handleArrayChange(
                          "quotes",
                          index,
                          "source",
                          e.target.value
                        )
                      }
                      className={inputClass}
                    />
                    <button
                      onClick={() => handleRemoveFromArray("quotes", index)}
                      className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full flex-shrink-0"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() =>
                handleAddToArray("quotes", {
                  arabic: "",
                  translation: "",
                  source: "",
                })
              }
              className="mt-2 text-sm flex items-center gap-1 text-primary dark:text-green-300 font-semibold"
            >
              <PlusIcon className="w-4 h-4" /> {t("eventModal.quotes.add")}
            </button>
          </div>

          <div className={sectionClass}>
            <h3 className={labelClass}>{t("eventModal.label.images")}</h3>
            <div className="space-y-2">
              {formData.images?.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 border border-border-color/50 dark:border-gray-700/50 rounded"
                >
                  <input
                    type="text"
                    placeholder="Image URL"
                    value={item.src}
                    onChange={(e) =>
                      handleArrayChange("images", index, "src", e.target.value)
                    }
                    className={inputClass}
                  />
                  <input
                    type="text"
                    placeholder="Caption"
                    value={item.caption}
                    onChange={(e) =>
                      handleArrayChange(
                        "images",
                        index,
                        "caption",
                        e.target.value
                      )
                    }
                    className={inputClass}
                  />
                  <button
                    onClick={() => handleRemoveFromArray("images", index)}
                    className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() =>
                handleAddToArray("images", { src: "", caption: "" })
              }
              className="mt-2 text-sm flex items-center gap-1 text-primary dark:text-green-300 font-semibold"
            >
              <PlusIcon className="w-4 h-4" /> {t("eventModal.images.add")}
            </button>
          </div>

          <div className={sectionClass}>
            <h3 className={labelClass}>{t("eventModal.label.quiz")}</h3>
            <div className="space-y-4">
              {formData.quiz?.map((item, qIndex) => (
                <div
                  key={qIndex}
                  className="p-3 border border-border-color/80 dark:border-gray-700/80 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Question"
                      value={item.question}
                      onChange={(e) =>
                        handleArrayChange(
                          "quiz",
                          qIndex,
                          "question",
                          e.target.value
                        )
                      }
                      className={inputClass}
                    />
                    <button
                      onClick={() => handleRemoveFromArray("quiz", qIndex)}
                      className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-2 pl-4">
                    {item.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correctAnswer-${qIndex}`}
                          checked={item.correctAnswerIndex === oIndex}
                          onChange={() =>
                            handleCorrectAnswerChange(qIndex, oIndex)
                          }
                          className="w-4 h-4 text-primary dark:text-green-400 bg-gray-100 border-gray-300 focus:ring-primary dark:focus:ring-green-500 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) =>
                            handleQuizOptionChange(
                              qIndex,
                              oIndex,
                              e.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() =>
                handleAddToArray("quiz", {
                  question: "",
                  options: ["", "", ""],
                  correctAnswerIndex: 0,
                })
              }
              className="mt-2 text-sm flex items-center gap-1 text-primary dark:text-green-300 font-semibold"
            >
              <PlusIcon className="w-4 h-4" /> {t("eventModal.quiz.add")}
            </button>
          </div>
        </main>
      </div>
    </div>,
    document.body
  );
};

import React, { useMemo, useState, useEffect, useRef } from "react";
import type { AppEvent, GlossaryItem, QuizItem, Quote } from "../types";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "../hooks/useTranslation";
import { Tooltip } from "./Tooltip";
import { EditIcon } from "./icons";

const StoryContent: React.FC<{ story: string; glossary: GlossaryItem[] }> = ({
  story,
  glossary,
}) => {
  const enrichedStory = useMemo(() => {
    if (!glossary || glossary.length === 0) {
      return story;
    }

    const termMap = new Map(
      glossary.map((item) => [item.term.toLowerCase(), item.explanation])
    );
    const terms = glossary.map((item) =>
      item.term.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")
    );
    // Make sure we don't create an empty regex if terms are empty
    if (terms.length === 0) {
      return story;
    }
    const regex = new RegExp(`\\b(${terms.join("|")})\\b`, "gi");

    const parts = story.split(regex);

    return parts.map((part, index) => {
      if (!part) return null;
      const lowerPart = part.toLowerCase();
      if (termMap.has(lowerPart)) {
        return (
          <Tooltip key={index} text={termMap.get(lowerPart) || ""}>
            <span className="text-secondary dark:text-red-400 font-bold cursor-pointer border-b border-secondary dark:border-red-400 border-dashed">
              {part}
            </span>
          </Tooltip>
        );
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  }, [story, glossary]);

  return (
    <p className="text-text-secondary dark:text-gray-400 whitespace-pre-line leading-relaxed">
      {enrichedStory}
    </p>
  );
};

const QuotesSection: React.FC<{ quotes?: Quote[] }> = ({ quotes }) => {
  const { t } = useTranslation();
  if (!quotes || quotes.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="font-serif text-xl text-primary dark:text-green-300 mb-3">
        {t("storyPanel.quotes")}
      </h3>
      <div className="space-y-6">
        {quotes.map((quote, index) => (
          <blockquote
            key={index}
            className="border-r-4 border-primary dark:border-green-300 bg-base/50 dark:bg-gray-900/50 p-4 rounded-r-lg"
          >
            {quote.arabic && (
              <p
                dir="rtl"
                className="font-arabic text-2xl md:text-3xl text-right text-text-primary dark:text-gray-200 leading-[3.6rem] md:leading-[4.5rem] mb-3"
              >
                {quote.arabic}
              </p>
            )}
            <p className="text-text-secondary dark:text-gray-400 italic leading-relaxed">
              "{quote.translation}"
            </p>
            <cite className="block text-right text-sm text-primary dark:text-green-300 font-semibold mt-3 not-italic">
              — {quote.source}
            </cite>
          </blockquote>
        ))}
      </div>
    </div>
  );
};

const QuizSection: React.FC<{ quiz: QuizItem[]; eventId: number }> = ({
  quiz,
  eventId,
}) => {
  const { t } = useTranslation();
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, number>
  >({});
  const [showFeedback, setShowFeedback] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setSelectedAnswers({});
    setShowFeedback({});
  }, [eventId]);

  const handleSelectAnswer = (questionIndex: number, optionIndex: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
    setShowFeedback((prev) => ({ ...prev, [questionIndex]: true }));
  };

  const resetQuiz = () => {
    setSelectedAnswers({});
    setShowFeedback({});
  };

  if (!quiz || quiz.length === 0) {
    return (
      <div className="mt-6 border-t border-border-color dark:border-gray-700 pt-6">
        <h3 className="font-serif text-xl text-primary dark:text-green-300 mb-4">
          {t("storyPanel.quiz.title")}
        </h3>
        <div className="text-center text-text-secondary dark:text-gray-400 py-8">
          <p>{t("storyPanel.quiz.none")}</p>
        </div>
      </div>
    );
  }

  const allAnswered = Object.keys(showFeedback).length === quiz.length;
  const correctCount = quiz.reduce((count, item, index) => {
    return selectedAnswers[index] === item.correctAnswerIndex
      ? count + 1
      : count;
  }, 0);

  const QuizResults = () => {
    if (!allAnswered) return null;

    const totalQuestions = quiz.length;
    const score =
      totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 100;

    let message: string;
    let bgColor: string;
    let textColor: string;
    let borderColor: string;

    if (score === 100) {
      message = t("storyPanel.quiz.results.message.excellent");
      bgColor = "bg-green-50 dark:bg-green-900/30";
      textColor = "text-green-800 dark:text-green-200";
      borderColor = "border-green-300 dark:border-green-600/50";
    } else if (score >= 50) {
      message = t("storyPanel.quiz.results.message.good");
      bgColor = "bg-yellow-50 dark:bg-yellow-900/30";
      textColor = "text-yellow-800 dark:text-yellow-200";
      borderColor = "border-yellow-300 dark:border-yellow-600/50";
    } else {
      message = t("storyPanel.quiz.results.message.retry");
      bgColor = "bg-red-50 dark:bg-red-900/30";
      textColor = "text-red-800 dark:text-red-200";
      borderColor = "border-red-300 dark:border-red-600/50";
    }

    return (
      <div
        className={`mt-8 p-4 rounded-lg border ${bgColor} ${borderColor} ${textColor} text-center animate-fade-in`}
      >
        <h4 className="font-serif text-lg font-semibold text-primary dark:text-green-200">
          {t("storyPanel.quiz.results.title")}
        </h4>
        <p className="mt-2">
          {t("storyPanel.quiz.results.summary", {
            correct: correctCount,
            total: totalQuestions,
          })}
        </p>
        <p className="mt-1 text-sm opacity-90">{message}</p>
      </div>
    );
  };

  return (
    <div className="mt-6 border-t border-border-color dark:border-gray-700 pt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-serif text-xl text-primary dark:text-green-300">
          {t("storyPanel.quiz.title")}
        </h3>
        {allAnswered && (
          <button
            onClick={resetQuiz}
            className="text-sm font-semibold text-primary dark:text-green-300 hover:text-secondary dark:hover:text-red-400 transition-colors"
          >
            {t("storyPanel.quiz.tryAgain")}
          </button>
        )}
      </div>
      <div className="space-y-6">
        {quiz.map((item, qIndex) => (
          <div key={qIndex}>
            <p className="font-semibold text-text-primary dark:text-gray-100 mb-3">
              {qIndex + 1}. {item.question}
            </p>
            <div className="space-y-2">
              {item.options.map((option, oIndex) => {
                const isSelected = selectedAnswers[qIndex] === oIndex;
                const isCorrect = item.correctAnswerIndex === oIndex;
                const shouldShowFeedback = showFeedback[qIndex];

                let buttonClass =
                  "w-full text-left p-3 rounded-lg border transition-all duration-200";
                if (shouldShowFeedback) {
                  if (isCorrect) {
                    buttonClass +=
                      " bg-green-100 dark:bg-green-900/50 border-green-400 dark:border-green-500 text-green-800 dark:text-green-200 ring-2 ring-green-300 dark:ring-green-600/50";
                  } else if (isSelected && !isCorrect) {
                    buttonClass +=
                      " bg-red-100 dark:bg-red-900/50 border-red-400 dark:border-red-500 text-red-800 dark:text-red-200";
                  } else {
                    buttonClass +=
                      " bg-base dark:bg-gray-700 border-border-color dark:border-gray-600 text-text-secondary dark:text-gray-400 cursor-not-allowed opacity-70";
                  }
                } else {
                  buttonClass +=
                    " bg-base dark:bg-gray-700 hover:bg-border-color dark:hover:bg-gray-600 border-border-color dark:border-gray-600";
                }

                return (
                  <button
                    key={oIndex}
                    onClick={() => handleSelectAnswer(qIndex, oIndex)}
                    disabled={shouldShowFeedback}
                    className={buttonClass}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <QuizResults />
    </div>
  );
};

interface StoryPanelProps {
  event: AppEvent;
  headerRef: React.RefObject<HTMLDivElement>;
  onEditEvent: (event: AppEvent) => void;
}

export const StoryPanel: React.FC<StoryPanelProps> = ({
  event,
  headerRef,
  onEditEvent,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const { isAdmin } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    const node = contentRef.current;
    if (node) {
      node.classList.add("animate-fade-in");
      const handleAnimationEnd = () => {
        if (node) {
          node.classList.remove("animate-fade-in");
        }
      };

      node.addEventListener("animationend", handleAnimationEnd, { once: true });

      return () => {
        node.removeEventListener("animationend", handleAnimationEnd);
      };
    }
  }, [event.id]);

  return (
    <div className="bg-surface dark:bg-gray-800 rounded-xl shadow-md lg:h-full lg:overflow-y-auto">
      <div
        ref={headerRef}
        className="top-0 z-10 bg-surface dark:bg-gray-800 px-6 pt-6 pb-4 border-b border-border-color dark:border-gray-700 animate-fade-in flex justify-between items-start"
        key={`${event.id}-header`}
      >
        <div>
          <p className="font-serif text-lg text-secondary dark:text-red-400">
            {event.year}
          </p>
          <h2 className="font-serif text-3xl font-semibold text-primary dark:text-green-300 mt-1">
            {event.title}
          </h2>
        </div>
        {isAdmin && (
          <button
            onClick={() => onEditEvent(event)}
            className="flex-shrink-0 ml-4 mt-1 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors shadow-sm"
          >
            <EditIcon className="w-5 h-5" />
            {t("storyPanel.editEvent")}
          </button>
        )}
      </div>

      {/* Scrollable Content */}
      <div ref={contentRef} className="px-6 pt-4 pb-6" key={event.id}>
        <div className="space-y-6">
          <QuotesSection quotes={event.quotes} />

          <div>
            <h3 className="font-serif text-xl text-primary dark:text-green-300 mb-2">
              {t("storyPanel.story")}
            </h3>
            <StoryContent story={event.story} glossary={event.glossary} />
          </div>

          {event.images && event.images.length > 0 && (
            <div
              className={`mt-6 grid grid-cols-1 ${
                event.images.length > 1 ? "sm:grid-cols-2" : ""
              } gap-4`}
            >
              {event.images.map((image, index) => (
                <figure key={index}>
                  <img
                    src={image.src}
                    alt={image.caption}
                    className="w-full h-48 rounded-lg object-cover shadow-md"
                  />
                  <figcaption className="mt-2 text-xs text-center text-text-secondary dark:text-gray-500 italic">
                    {image.caption}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}

          <div>
            <h3 className="font-serif text-xl text-primary dark:text-green-300 mb-2">
              {t("storyPanel.lessons")}
            </h3>
            <ul className="space-y-2 list-inside">
              {event.lessons.map((lesson, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-secondary dark:text-red-400 mr-3 mt-1">
                    &#10022;
                  </span>
                  <span className="text-text-secondary dark:text-gray-400">
                    {lesson}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <QuizSection quiz={event.quiz} eventId={event.id} />
      </div>
    </div>
  );
};

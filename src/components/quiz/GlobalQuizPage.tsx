import React, { useState, useEffect } from "react";
import type { GlobalQuizItem } from "../../types";
import { TitleBar } from "../layout/TitleBar";
import { useAuth } from "../../hooks/useAuth";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { useTranslation } from "../../hooks/useTranslation";

type QuizState = "idle" | "active" | "results";

interface GlobalQuizPageProps {
  onNavigate: (page: "home" | "leaderboard" | "profile") => void;
}

export const GlobalQuizPage: React.FC<GlobalQuizPageProps> = ({
  onNavigate,
}) => {
  const [quizState, setQuizState] = useState<QuizState>("idle");
  const [quiz, setQuiz] = useState<GlobalQuizItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, number>
  >({});
  const [showFeedback, setShowFeedback] = useState(false);
  const { updateQuizScore, user } = useAuth();
  const { t, language } = useTranslation();

  useEffect(() => {
    const fetchQuizData = async () => {
      setIsLoading(true);
      // Reset quiz state when language changes to provide a fresh experience
      setQuizState("idle");
      setQuiz([]);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setShowFeedback(false);

      try {
        const dataFile =
          language === "bn" ? "mockQuizData_bn.json" : "mockQuizData.json";
        const response = await fetch(`/data/${dataFile}`);
        if (!response.ok) throw new Error("Failed to fetch quiz data");
        const data = await response.json();
        setQuiz(data);
      } catch (error) {
        console.error("Error fetching quiz data:", error);
        setQuiz([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuizData();
  }, [language]);

  const currentQuestion = quiz[currentQuestionIndex];
  const totalQuestions = quiz.length;
  const isQuizFinished =
    quizState === "active" && currentQuestionIndex >= totalQuestions;

  const score = quiz.reduce((total, item, index) => {
    return selectedAnswers[index] === item.correctAnswerIndex
      ? total + 100
      : total;
  }, 0);

  const startQuiz = () => {
    if (quiz.length === 0) return;
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowFeedback(false);
    setQuizState("active");
  };

  const handleSelectAnswer = (optionIndex: number) => {
    if (showFeedback) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: optionIndex,
    }));
    setShowFeedback(true);
  };

  const handleNextQuestion = () => {
    setShowFeedback(false);
    setCurrentQuestionIndex((prev) => prev + 1);
  };

  useEffect(() => {
    if (isQuizFinished) {
      if (user?.provider !== "guest") {
        updateQuizScore(score);
      }
      setQuizState("results");
    }
  }, [isQuizFinished, score, updateQuizScore, user]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-48">
          <LoadingSpinner />
        </div>
      );
    }

    if (quiz.length === 0) {
      return (
        <div className="text-center p-8">
          <h2 className="text-2xl font-serif font-bold text-primary dark:text-green-300">
            {t("quiz.loadError.title")}
          </h2>
          <p className="mt-2 text-text-secondary dark:text-gray-400">
            {t("quiz.loadError.subtitle")}
          </p>
        </div>
      );
    }

    switch (quizState) {
      case "active":
        if (!currentQuestion) return null;
        const isCorrect =
          selectedAnswers[currentQuestionIndex] ===
          currentQuestion.correctAnswerIndex;
        return (
          <div className="animate-fade-in w-full">
            <div className="mb-6 text-center">
              <p className="text-sm font-semibold text-secondary dark:text-red-400">
                {t("quiz.questionOf", {
                  current: currentQuestionIndex + 1,
                  total: totalQuestions,
                })}
              </p>
              <h2 className="text-2xl font-serif font-semibold mt-1 text-primary dark:text-green-300">
                {currentQuestion.question}
              </h2>
            </div>
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                let buttonClass =
                  "w-full text-left p-4 rounded-lg border-2 font-semibold transition-all";
                if (showFeedback) {
                  if (index === currentQuestion.correctAnswerIndex) {
                    buttonClass +=
                      " bg-green-100 dark:bg-green-900/40 border-green-500 text-green-800 dark:text-green-200";
                  } else if (selectedAnswers[currentQuestionIndex] === index) {
                    buttonClass +=
                      " bg-red-100 dark:bg-red-900/40 border-red-500 text-red-800 dark:text-red-200";
                  } else {
                    buttonClass +=
                      " bg-base dark:bg-gray-700 border-border-color dark:border-gray-600 opacity-60";
                  }
                } else {
                  buttonClass +=
                    " bg-surface dark:bg-gray-700 border-border-color dark:border-gray-600 text-text-primary dark:text-gray-100 hover:border-primary dark:hover:border-green-400 hover:bg-base dark:hover:bg-gray-700/50";
                }
                return (
                  <button
                    key={index}
                    onClick={() => handleSelectAnswer(index)}
                    className={buttonClass}
                    disabled={showFeedback}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            {showFeedback && (
              <div className="mt-6 p-4 rounded-lg bg-base dark:bg-gray-900/70 animate-fade-in">
                <p
                  className={`font-bold ${
                    isCorrect
                      ? "text-primary dark:text-green-300"
                      : "text-secondary dark:text-red-400"
                  }`}
                >
                  {isCorrect
                    ? t("quiz.feedback.correct")
                    : t("quiz.feedback.incorrect")}
                </p>
                <p className="text-text-secondary dark:text-gray-400 mt-1">
                  {currentQuestion.explanation}
                </p>
                <button
                  onClick={handleNextQuestion}
                  className="mt-4 w-full bg-primary dark:bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  {t("quiz.feedback.next")}
                </button>
              </div>
            )}
          </div>
        );
      case "results":
        return (
          <div className="text-center p-8 animate-fade-in">
            <h2 className="text-4xl font-serif font-bold text-primary dark:text-green-300">
              {t("quiz.results.title")}
            </h2>
            <p className="mt-4 text-lg text-text-secondary dark:text-gray-400">
              {t("quiz.results.yourScore")}
            </p>
            <p className="text-6xl font-bold text-secondary dark:text-red-400 my-4">
              {score.toLocaleString()}
            </p>
            {user?.provider === "guest" && (
              <p className="text-sm text-text-secondary dark:text-gray-500">
                {t("quiz.results.guestMessage")}
              </p>
            )}
            <div className="flex gap-4 mt-8 justify-center">
              <button
                onClick={startQuiz}
                className="px-6 py-3 bg-primary dark:bg-green-600 text-white rounded-lg font-semibold hover:bg-opacity-90"
              >
                {t("quiz.results.playAgain")}
              </button>
              <button
                onClick={() => onNavigate("leaderboard")}
                className="px-6 py-3 bg-surface dark:bg-gray-700 border border-border-color dark:border-gray-600 text-primary dark:text-green-300 rounded-lg font-semibold hover:bg-base dark:hover:bg-gray-700/50"
              >
                {t("quiz.results.viewLeaderboard")}
              </button>
            </div>
          </div>
        );
      case "idle":
      default:
        return (
          <div className="text-center p-8 animate-fade-in">
            <h2 className="text-4xl font-serif font-bold text-primary dark:text-green-300">
              {t("quiz.idle.title")}
            </h2>
            <p className="mt-2 text-lg text-text-secondary dark:text-gray-400 max-w-md mx-auto">
              {t("quiz.idle.subtitle", { total: totalQuestions })}
            </p>
            <button
              onClick={startQuiz}
              disabled={quiz.length === 0}
              className="mt-8 px-8 py-4 bg-secondary dark:bg-red-600 text-white rounded-lg font-bold text-lg hover:bg-opacity-90 transition-transform hover:scale-105 shadow-lg disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none"
            >
              {t("quiz.idle.start")}
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-base dark:bg-gray-900">
      <TitleBar
        showBackButton
        onBackClick={() => onNavigate("home")}
        onLoginClick={() => {}}
        onNavigate={onNavigate}
      />
      <main className="flex-grow flex items-center justify-center container mx-auto p-4">
        <div className="w-full max-w-2xl bg-surface dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

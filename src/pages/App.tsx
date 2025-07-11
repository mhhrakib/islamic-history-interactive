import React, { useState, useMemo } from "react";
import { AuthProvider } from "../contexts/AuthContext";
import { DataProvider } from "../contexts/DataContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { LanguageProvider } from "../contexts/LanguageContext";
import { useData } from "../hooks/useData";
import { HomePage } from "../components/home/HomePage";
import { TopicDetailPage } from "../components/home/TopicDetailPage";
import { ProfilePage } from "../components/profile/ProfilePage";
import { GlobalQuizPage } from "../components/quiz/GlobalQuizPage";
import { LeaderboardPage } from "../components/quiz/LeaderboardPage";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { AuthModal } from "../components/auth/AuthModal";

type Page = "home" | "topic" | "profile" | "quiz" | "leaderboard";

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [initialEventId, setInitialEventId] = useState<number | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const { eras, isLoading: isDataLoading } = useData();

  const allTopics = useMemo(() => eras.flatMap((era) => era.topics), [eras]);

  const navigateTo = (page: Page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectTopic = (id: number, eventId?: number) => {
    setSelectedTopicId(id);
    setInitialEventId(eventId || null);
    navigateTo("topic");
  };

  const handleGoBack = () => {
    setSelectedTopicId(null);
    setInitialEventId(null);
    navigateTo("home");
  };

  const selectedTopic = allTopics.find((p) => p.id === selectedTopicId);

  const renderPage = () => {
    switch (currentPage) {
      case "topic":
        return selectedTopic ? (
          <TopicDetailPage
            topic={selectedTopic}
            onBack={handleGoBack}
            onLoginClick={() => setIsAuthModalOpen(true)}
            initialEventId={initialEventId || undefined}
            onNavigate={navigateTo}
          />
        ) : (
          <HomePage
            onSelectTopic={handleSelectTopic}
            onNavigate={navigateTo}
            onLoginClick={() => setIsAuthModalOpen(true)}
          />
        );
      case "profile":
        return <ProfilePage onNavigate={navigateTo} />;
      case "quiz":
        return <GlobalQuizPage onNavigate={navigateTo} />;
      case "leaderboard":
        return <LeaderboardPage onNavigate={navigateTo} />;
      case "home":
      default:
        return (
          <HomePage
            onSelectTopic={handleSelectTopic}
            onNavigate={navigateTo}
            onLoginClick={() => setIsAuthModalOpen(true)}
          />
        );
    }
  };

  if (isDataLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-base dark:bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {renderPage()}
      {isAuthModalOpen && (
        <AuthModal onClose={() => setIsAuthModalOpen(false)} />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <DataProvider>
            <AppContent />
          </DataProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;

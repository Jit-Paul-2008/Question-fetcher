import React, { useState, useEffect } from "react";
import { Shell } from "./components/layout/Shell";
import { AuthWindow } from "./components/windows/AuthWindow";
import { GeneratorWindow } from "./components/windows/GeneratorWindow";
import { LibraryWindow } from "./components/windows/LibraryWindow";
import { ClassroomWindow } from "./components/windows/ClassroomWindow";
import { KnowledgeMapWindow } from "./components/windows/KnowledgeMapWindow";
import { BuyModal } from "./components/modals/BuyModal";

// Redesigned Hooks
import { useAuth } from "./hooks/useAuth";
import { useScanner } from "./hooks/useScanner";
import { useLibrary } from "./hooks/useLibrary";
import { useClassrooms } from "./hooks/useClassrooms";
import { usePayments } from "./hooks/usePayments";

// Export Utilities
import { generateQuestionsPDF } from "./lib/pdf";
import { generateQuestionsDocx } from "./lib/docx";

// Types
import { ActiveTab, Theme } from "./lib/types";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("generator");
  const [theme, setTheme] = useState<Theme>("light");
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [activeSet, setActiveSet] = useState<any>(null);

  // Initialize modular logic
  const { user, loading: authLoading, error: authError, credits, setCredits, login, register, googleLogin, logout, refreshProfile } = useAuth();
  const { buyCredits } = usePayments(user, setCredits);
  const { status, progress, scanFile, scanTopics, result, reset: resetScanner } = useScanner(user, credits, setCredits);
  const { history, loading: historyLoading, refreshHistory } = useLibrary(user, !authLoading);
  const { myClassrooms, joinedClasses, isCroomsLoading, joinClassroom, createClassroom } = useClassrooms(user, !authLoading);

  // Theme Sync
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Result handling
  useEffect(() => {
    if (result && status === "success") {
      setActiveSet(result);
      setActiveTab("classrooms");
      refreshHistory();
      // Also refresh profile to update credits from backend
      if (refreshProfile) refreshProfile();
    }
  }, [result, status]);

  const toggleTheme = () => setTheme(prev => prev === "light" ? "dark" : "light");

  const handleExport = async (type: 'pdf' | 'docx') => {
    if (!activeSet) return;
    
    const topic = activeSet.title || activeSet.topic || "Research Synthesis";
    const questions = activeSet.questions || [];
    const subject = activeSet.subject || "Chemistry"; // Fallback to Chemistry for ChemScan

    try {
      if (type === 'pdf') {
        await generateQuestionsPDF(topic, questions, subject);
      } else {
        await generateQuestionsDocx(topic, questions, subject);
      }
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-12">
        <div className="w-16 h-16 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-8" />
        <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-primary animate-pulse">Synthesizing Environment</span>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthWindow 
        onLogin={login}
        onRegister={register}
        onGoogleLogin={googleLogin}
        loading={authLoading}
        error={authError}
      />
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "generator":
        return (
          <GeneratorWindow 
            onScan={scanFile}
            onTopicScan={scanTopics}
            status={status}
            progress={progress}
          />
        );
      case "library":
        return (
          <LibraryWindow 
            history={history}
            loading={historyLoading}
            onSelect={(set) => {
              setActiveSet(set);
              setActiveTab("classrooms");
            }}
            onExport={(set, type) => {
              // Store as active then export
              setActiveSet(set);
              handleExport(type); 
            }}
          />
        );
      case "classrooms":
        return (
          <ClassroomWindow 
            activeSet={activeSet}
            onExport={handleExport}
            onShare={() => console.log("Sharing")}
            onClose={() => setActiveTab("generator")}
          />
        );
      case "map":
        return <KnowledgeMapWindow activeSet={activeSet} />;
      default:
        return (
          <div className="p-24 text-center opacity-20 text-[10px] font-black uppercase tracking-[0.5em]">
            Module Connection Pending...
          </div>
        );
    }
  };

  return (
    <>
      <Shell
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        credits={credits}
        theme={theme}
        toggleTheme={toggleTheme}
        onLogout={logout}
        onOpenBuyModal={() => setShowBuyModal(true)}
      >
        {renderContent()}
      </Shell>

      {showBuyModal && (
        <BuyModal 
          onClose={() => setShowBuyModal(false)}
          onSelectPlan={async (credits) => {
            // Map UI credits to backend pack IDs
            const packId = credits <= 5 ? "starter" : credits <= 25 ? "value" : "study";
            await buyCredits(packId);
            setShowBuyModal(false);
          }}
        />
      )}
    </>
  );
}

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
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
import { ActiveTab, Theme, ReportSettings } from "./lib/types";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("generator");
  const [theme, setTheme] = useState<Theme>("light");
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [activeSet, setActiveSet] = useState<any>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [reportSettings, setReportSettings] = useState<ReportSettings>({
    includeAnswers: true,
    brandLabel: "Question Fetcher",
  });

  // Initialize modular logic
  const { user, loading: authLoading, error: authError, credits, setCredits, login, register, googleLogin, logout, refreshProfile } = useAuth();
  const { buyCredits } = usePayments(user, setCredits, refreshProfile);
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

  const handleExport = async (type: 'pdf' | 'docx', reportSet: any = activeSet) => {
    if (!reportSet) return;
    
    const topic = reportSet.title || reportSet.topic || "Research Synthesis";
    const questions = reportSet.questions || [];
    const subject = reportSet.subject || "Chemistry"; // Fallback to Chemistry for ChemScan

    try {
      if (type === 'pdf') {
        await generateQuestionsPDF(topic, questions, subject, reportSettings);
      } else {
        await generateQuestionsDocx(topic, questions, subject, reportSettings);
      }
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export failed. Please try again.");
    }
  };

  const handlePublish = async () => {
    if (!user || !activeSet || isPublishing) return;

    setIsPublishing(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          bank: {
            ...activeSet,
            reportSettings,
          },
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || "Publish failed");
      }

      toast.success("Report published to community library");
      setActiveSet((prev: any) => ({ ...prev, publishedId: payload.id, published: true }));
    } catch (error: any) {
      console.error("Publish failed:", error);
      toast.error(error.message || "Publish failed");
    } finally {
      setIsPublishing(false);
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
              setActiveSet(set);
              handleExport(type, set); 
            }}
          />
        );
      case "classrooms":
        return (
          <ClassroomWindow 
            activeSet={activeSet}
            onExport={handleExport}
            onShare={handlePublish}
            publishing={isPublishing}
            reportSettings={reportSettings}
            onReportSettingsChange={setReportSettings}
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

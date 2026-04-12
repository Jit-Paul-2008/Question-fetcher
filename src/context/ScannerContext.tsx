import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ScanResult } from '@/src/lib/gemini';
import { ScanStatus } from '@/src/lib/types';

interface ScannerContextType {
  status: ScanStatus;
  progress: number;
  progressMsg: string;
  result: ScanResult | null;
  error: string | null;
  // Input persistence
  subject: string;
  exams: string[];
  topics: string[];
  mode: 'notes' | 'topics';
  
  setStatus: (status: ScanStatus) => void;
  setProgress: (progress: number | ((prev: number) => number)) => void;
  setProgressMsg: (msg: string) => void;
  setResult: (result: ScanResult | null) => void;
  setError: (error: string | null) => void;
  setSubject: (subject: string) => void;
  setExams: (exams: string[]) => void;
  setTopics: (topics: string[]) => void;
  setMode: (mode: 'notes' | 'topics') => void;
  reset: () => void;
}

const ScannerContext = createContext<ScannerContextType | undefined>(undefined);

export function ScannerProvider({ children }: { children?: ReactNode }) {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('System Idle');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Persistence state
  const [subject, setSubject] = useState('Chemistry');
  const [exams, setExams] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [mode, setMode] = useState<'notes' | 'topics'>('topics');

  const reset = () => {
    setStatus('idle');
    setProgress(0);
    setProgressMsg('System Idle');
    setResult(null);
    setError(null);
    setTopics([]);
  };

  return (
    <ScannerContext.Provider
      value={{
        status,
        progress,
        progressMsg,
        result,
        error,
        subject,
        exams,
        topics,
        mode,
        setStatus,
        setProgress,
        setProgressMsg,
        setResult,
        setError,
        setSubject,
        setExams,
        setTopics,
        setMode,
        reset,
      }}
    >
      {children ?? null}
    </ScannerContext.Provider>
  );
}

export function useScannerContext() {
  const context = useContext(ScannerContext);
  if (context === undefined) {
    throw new Error('useScannerContext must be used within a ScannerProvider');
  }
  return context;
}

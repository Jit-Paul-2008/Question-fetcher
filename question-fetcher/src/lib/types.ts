import { ScanResult } from "@/src/lib/gemini";

export interface HistoryItem extends ScanResult {
  id?: string;
  timestamp: number;
  reportSettings?: {
    includeAnswers: boolean;
    brandLabel: string;
  };
}

export interface CreditPack {
  credits: number;
  amount: number;
  name: string;
  display: string;
}

export interface ReportSettings {
  includeAnswers: boolean;
  brandLabel: string;
}

export interface ReportRenderOptions extends ReportSettings {
  topicLabel?: string;
}

export type ScanMode = "notes" | "topics";
export type ScanStatus = "idle" | "uploading" | "processing" | "success" | "failed";
export type ActiveTab = "generator" | "history" | "results";
export type Theme = "light" | "dark";

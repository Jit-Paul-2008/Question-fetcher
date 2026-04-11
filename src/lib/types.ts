import { ScanResult } from "@/src/lib/gemini";

export interface HistoryItem extends ScanResult {
  id?: string;
  timestamp: number;
}

export interface CreditPack {
  credits: number;
  amount: number;
  name: string;
  display: string;
}

export type ScanMode = "notes" | "topics";
export type ActiveTab = "generator" | "library" | "classrooms" | "map";
export type Theme = "light" | "dark";

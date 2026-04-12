export type TavilySearchDepth = "advanced" | "basic" | "fast" | "ultra-fast";

export const GEMINI_GENERATION_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
export const GEMINI_EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || "";

export const CACHE_MIN_QUESTIONS = Math.max(1, parseInt(process.env.CACHE_MIN_QUESTIONS || "10", 10));
export const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const MAX_TAVILY_QUERIES = Math.max(1, Math.min(6, parseInt(process.env.MAX_TAVILY_QUERIES || "4", 10)));
export const TAVILY_MAX_RESULTS = Math.max(1, Math.min(20, parseInt(process.env.TAVILY_MAX_RESULTS || "15", 10)));

const configuredDepth = (process.env.TAVILY_SEARCH_DEPTH || "basic").toLowerCase();
export const TAVILY_SEARCH_DEPTH: TavilySearchDepth = ["advanced", "basic", "fast", "ultra-fast"].includes(configuredDepth)
  ? (configuredDepth as TavilySearchDepth)
  : "basic";

export const MAX_TOPUP_ATTEMPTS = Math.max(0, Math.min(3, parseInt(process.env.MAX_TOPUP_ATTEMPTS || "2", 10)));
export const SUPPLEMENTAL_TAVILY_QUERIES = Math.max(0, Math.min(3, parseInt(process.env.SUPPLEMENTAL_TAVILY_QUERIES || "2", 10)));
export const MIN_STRUCTURED_SOURCES = Math.max(3, Math.min(16, parseInt(process.env.MIN_STRUCTURED_SOURCES || "8", 10)));

export const MAX_SCAN_COST_INR = Math.max(1, parseFloat(process.env.MAX_SCAN_COST_INR || "3"));
export const GEMINI_COST_BUFFER_INR = Math.max(0.1, parseFloat(process.env.GEMINI_COST_BUFFER_INR || "0.8"));
export const USD_TO_INR = Math.max(60, parseFloat(process.env.USD_TO_INR || "85"));
export const TAVILY_CREDIT_USD = Math.max(0.001, parseFloat(process.env.TAVILY_CREDIT_USD || "0.008"));

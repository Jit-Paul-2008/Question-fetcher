import crypto from "crypto";
import { getDomainsForContext } from "../../lib/search-taxonomy.js";

export function getIncludeDomains(exams: string[], subject: string, targetClass: string): string[] {
  return getDomainsForContext({
    exams: exams || [],
    subject: subject || "Chemistry",
    targetClass: targetClass || "12",
  });
}

export function getCacheKey(subject: string, topic: string, exams: string[]) {
  const sortedExams = [...exams].sort().join(",");
  const raw = `${subject.toLowerCase()}|${topic.toLowerCase().trim()}|${sortedExams}`;
  return crypto.createHash("md5").update(raw).digest("hex");
}

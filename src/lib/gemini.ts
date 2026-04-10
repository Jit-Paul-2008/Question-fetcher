export interface Question {
  text: string;
  options: string[];
  answer: string;
  source: string;
  year: string;
  type: "Official Question Bank" | "PYQ" | "HOTS" | "Practice" | "Sample Paper";
  topic: string;
}

export interface ScanResult {
  keywords: string[];
  topicDetected: string;
  summary: string;
  questions: Question[];
}

export async function scanChemistryNote(
  images: string[],
  userTopic: string,
  exams: string[]
): Promise<ScanResult> {
  const API_BASE = window.location.origin;

  const response = await fetch(`${API_BASE}/api/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      images,
      topic: userTopic,
      exams
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMessage = "Failed to scan notes";
    try {
      const errorJson = JSON.parse(errorBody);
      errorMessage = errorJson.error || errorMessage;
    } catch {
      errorMessage = errorBody || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return await response.json();
}

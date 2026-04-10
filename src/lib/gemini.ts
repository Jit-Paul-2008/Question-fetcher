export interface Question {
  text: string;
  options: string[];
  answer: string;
  source: string;
  year: string;
  type: "Official Question Bank" | "PYQ" | "HOTS" | "Practice";
  topic: string;
}

export interface ScanResult {
  keywords: string[];
  topicDetected: string;
  summary: string;
  questions: Question[];
}

export async function scanChemistryNote(
  imageData: string,
  userTopic: string,
  exams: string[]
): Promise<ScanResult> {
  // Use current window origin as base or fallback to relative path
  const API_BASE = window.location.origin;
  
  const response = await fetch(`${API_BASE}/api/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image: imageData,
      topic: userTopic,
      exams
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMessage = "Failed to scan note";
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

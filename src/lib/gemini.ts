export interface Question {
  text: string;
  options: string[];
  answer: string;
  source: string;
  year: string;
  type: "PYQ" | "Sample Paper" | "HOTS" | "Practice";
  topic: string;
}

export interface ScanResult {
  keywords: string[];
  topicDetected: string;
  summary: string;
  questions: Question[];
}

export async function scanSubjectNote(
  images: string[],
  userTopic: string,
  subject: string,
  exams: string[],
  targetClass: string,
  idToken: string
): Promise<ScanResult> {
  const API_BASE = window.location.origin;

  const response = await fetch(`${API_BASE}/api/scan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${idToken}`,
    },
    body: JSON.stringify({ images, topic: userTopic, subject, exams, targetClass })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMessage = "Failed to scan notes";
    try {
      errorMessage = JSON.parse(errorBody).error || errorMessage;
    } catch {
      errorMessage = errorBody || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return await response.json();
}

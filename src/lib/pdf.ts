import type { Question } from "./gemini";
import type { ReportRenderOptions } from "./types";

export async function generateQuestionsPDF(
  topic: string,
  questions: Question[],
  subject: string = "Subject",
  options: ReportRenderOptions = { includeAnswers: true, brandLabel: "Question Fetcher" }
) {
  const sanitizePdfText = (value: unknown): string => {
    const text = typeof value === "string" ? value : String(value ?? "");
    return text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/[–—]/g, "-")
      .replace(/…/g, "...")
      .replace(/\s+/g, " ")
      .trim();
  };

  const { jsPDF } = await import("jspdf");
  if (!jsPDF) {
    console.error("jsPDF is not loaded correctly");
    return;
  }
  // @ts-ignore
  const doc = new (jsPDF.jsPDF || jsPDF)();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Title
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.text(`${subject} Question Bank`, pageWidth / 2, y, { align: "center" });
  y += 10;

  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text(`Topic: ${topic}`, pageWidth / 2, y, { align: "center" });
  y += 15;

  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Prepared by ${options.brandLabel || "Question Fetcher"}`, pageWidth / 2, y, { align: "center" });
  y += 10;

  doc.setDrawColor(200, 200, 200);
  doc.line(20, y, pageWidth - 20, y);
  y += 10;

  questions.forEach((q, index) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    // Question Number and Type
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(`Q${index + 1}. [${q.type}]`, 20, y);
    y += 7;

    // Question Text
    doc.setFont("helvetica", "normal");
    const splitText = doc.splitTextToSize(sanitizePdfText(q.text), pageWidth - 40);
    doc.text(splitText, 20, y);
    y += (splitText.length * 7);

    // Options
    doc.setFontSize(10);
    q.options.forEach((opt, optIdx) => {
      const char = String.fromCharCode(65 + optIdx);
      const line = `${char}. ${sanitizePdfText(opt)}`;
      const optionLines = doc.splitTextToSize(line, pageWidth - 45);
      doc.text(optionLines, 25, y);
      y += (optionLines.length * 6);
    });
    y += 2;

    // Answer / answer key visibility
    if (options.includeAnswers) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 128, 0);
      doc.text(`Answer: ${sanitizePdfText(q.answer)}`, 20, y);
      y += 7;
    } else {
      doc.setFont("helvetica", "italic");
      doc.setTextColor(140, 140, 140);
      doc.text("Answer: Hidden", 20, y);
      y += 7;
    }

    // Source and Year
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120, 120, 120);
    doc.text(`Source: ${sanitizePdfText(q.source)} (${sanitizePdfText(q.year)})`, 20, y);
    y += 15;
  });

  const suffix = options.includeAnswers ? "With_Answers" : "Question_Only";
  doc.save(`${subject}_Questions_${String(topic || 'Report').replace(/\s+/g, "_")}_${suffix}.pdf`);
}

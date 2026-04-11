import type { Question } from "./gemini";

export async function generateQuestionsPDF(topic: string, questions: Question[], subject: string = "Subject") {
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
    const splitText = doc.splitTextToSize(q.text, pageWidth - 40);
    doc.text(splitText, 20, y);
    y += (splitText.length * 7);

    // Options
    doc.setFontSize(10);
    q.options.forEach((opt, optIdx) => {
      const char = String.fromCharCode(65 + optIdx);
      doc.text(`${char}. ${opt}`, 25, y);
      y += 6;
    });
    y += 2;

    // Answer
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 128, 0);
    doc.text(`Answer: ${q.answer}`, 20, y);
    y += 7;

    // Source and Year
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120, 120, 120);
    doc.text(`Source: ${q.source} (${q.year})`, 20, y);
    y += 15;
  });

  doc.save(`${subject}_Questions_${String(topic || 'Report').replace(/\s+/g, "_")}.pdf`);
}

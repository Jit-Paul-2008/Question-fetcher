import { saveAs } from "file-saver";
import type { Question } from "./gemini";

export async function generateQuestionsDocx(topic: string, questions: Question[]) {
  const docx = await import("docx");
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = docx;
  
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "Chemistry Question Bank",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: `Topic: ${topic}`,
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          ...questions.flatMap((q, index) => [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Q${index + 1}. [${q.type}]`,
                  bold: true,
                  size: 24,
                }),
              ],
              spacing: { before: 400, after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: q.text,
                  size: 24,
                }),
              ],
              spacing: { after: 200 },
            }),
            ...q.options.map((opt, optIdx) => 
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${String.fromCharCode(65 + optIdx)}. ${opt}`,
                    size: 22,
                  }),
                ],
                indent: { left: 720 },
                spacing: { after: 100 },
              })
            ),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Answer: ${q.answer}`,
                  bold: true,
                  color: "008000",
                  size: 22,
                }),
              ],
              spacing: { before: 200, after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Source: ${q.source} (${q.year})`,
                  italics: true,
                  size: 20,
                  color: "666666",
                }),
              ],
              spacing: { after: 400 },
            }),
          ]),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Chemistry_Questions_${topic.replace(/\s+/g, "_")}.docx`);
}

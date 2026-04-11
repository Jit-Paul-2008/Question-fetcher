import { getDomainsForContext } from "../src/lib/search-taxonomy.js";

const CLASSES = ["9", "10", "11", "12", "Graduation"];
const SUBJECTS = [
  "Physics", "Chemistry", "Biology", "Mathematics", "Computer Science", "Environmental Science",
  "Business Studies", "Accountancy", "Economics",
  "History", "Geography", "Political Science", "Sociology", "Psychology", "Philosophy",
  "English", "Hindi", "Sanskrit", "Bengali"
];
const EXAMS = [
  { id: "cbse-10", name: "CBSE 10" },
  { id: "cbse-12", name: "CBSE 12" },
  { id: "jee-mains", name: "JEE Mains" },
  { id: "neet", name: "NEET" },
  { id: "icse-10", name: "ICSE 10" },
  { id: "isc-12", name: "ISC 12" },
  { id: "wbsche-12", name: "WBSCHE 12" }
];

console.log("# SEARCH TAXONOMY POWER-MATRIX\n");
console.log("This matrix confirms the top 5 search domains for all primary permutations supported in the UI.\n");

CLASSES.forEach(c => {
  console.log(`## Class ${c}\n`);
  console.log("| Subject | Context (Exam) | Top 5 Search Domains |");
  console.log("|---------|----------------|----------------------|");
  
  SUBJECTS.forEach(s => {
    // Determine relevant exam for this subject+class
    let relevantExam = "None (Academic)";
    let exams: string[] = [];
    
    if (c === "10") {
        relevantExam = "CBSE 10";
        exams = ["cbse-10"];
    } else if (c === "12") {
        if (["Physics", "Chemistry", "Mathematics", "Biology"].includes(s)) {
            relevantExam = "JEE/NEET";
            exams = ["jee-mains", "neet"];
        } else {
            relevantExam = "CBSE 12";
            exams = ["cbse-12"];
        }
    }
    
    const domains = getDomainsForContext({ targetClass: c, subject: s, exams });
    const top5 = domains.slice(0, 5).join(", ");
    console.log(`| ${s} | ${relevantExam} | ${top5} |`);
  });
  console.log("\n");
});

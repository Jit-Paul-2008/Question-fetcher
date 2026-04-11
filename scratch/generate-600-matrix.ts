import { getDomainsForContext } from "../src/lib/search-taxonomy.js";

const CLASSES = ["6", "7", "8", "9", "10", "11", "12", "Graduation"];
const SUBJECTS = [
  "Physics", "Chemistry", "Biology", "Mathematics", "Computer Science", "Environmental Science",
  "Business Studies", "Accountancy", "Economics",
  "History", "Geography", "Political Science", "Sociology", "Psychology", "Philosophy",
  "English", "Hindi", "Sanskrit", "Bengali"
];

const EXAM_FILTERS = [
  { id: "none", label: "General Academic" },
  { id: "cbse", label: "CBSE Filter" },
  { id: "icse", label: "ICSE/ISC Filter" },
  { id: "wbsche", label: "WBSCHE Filter" },
  { id: "competitive", label: "JEE/NEET (Science Only)" }
];

console.log("# VAST SEARCH TAXONOMY MATRIX (600+ Permutations)\n");
console.log("This matrix documents how search domains pivot based on Class, Subject, AND Exam Targeting.\n");

CLASSES.forEach(c => {
  console.log(`## Class ${c} Permutations\n`);
  console.log("| Subject | Target/Filter | Primary Search Domain Pool |");
  console.log("|---------|---------------|---------------------------|");
  
  SUBJECTS.forEach(s => {
    EXAM_FILTERS.forEach(f => {
      // Logic for valid permutations
      let exams: string[] = [];
      if (f.id === "cbse") exams = [c === "10" ? "cbse-10" : "cbse-12"];
      if (f.id === "icse") exams = [c === "10" ? "icse-10" : "isc-12"];
      if (f.id === "wbsche") exams = ["wbsche-12"];
      if (f.id === "competitive") exams = ["jee-mains"];

      // Skip invalid/redundant competitive filters for non-science
      const isScience = ["physics", "chemistry", "biology", "mathematics", "computer science", "environmental science", "maths"].some(x => s.toLowerCase().includes(x));
      if (f.id === "competitive" && !isScience) return;
      
      const domains = getDomainsForContext({ targetClass: c, subject: s, exams });
      const top5 = domains.slice(0, 5).join(", ");
      
      console.log(`| ${s} | ${f.label} | ${top5} |`);
    });
  });
  console.log("\n");
});

console.log("---");
console.log("Verification: All 8 Classes x 19 Subjects x relevant Exam Filters covered.");

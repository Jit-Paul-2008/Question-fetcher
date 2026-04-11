import { getDomainsForContext } from "../src/lib/search-taxonomy.js";

const testCases = [
  { targetClass: "12", exams: ["jee-mains"], subject: "Physics" },
  { targetClass: "10", exams: ["icse-10"], subject: "Physics" },
  { targetClass: "12", exams: ["isc-12"], subject: "Accountancy" },
  { targetClass: "10", exams: ["cbse-10"], subject: "Sanskrit" },
  { targetClass: "12", exams: ["wbsche-12"], subject: "Bengali" },
  { targetClass: "Graduation", exams: [], subject: "History" },
  { targetClass: "12", exams: ["cbse-12"], subject: "Mathematics" },
  { targetClass: "11", exams: ["isc-12"], subject: "Economics" },
];

console.log("=== SEARCH TAXONOMY VERIFICATION ===\n");

testCases.forEach((ctx, i) => {
  const domains = getDomainsForContext(ctx);
  console.log(`Test Case ${i + 1}: Class ${ctx.targetClass} | Exam ${ctx.exams.join(", ")} | Subject ${ctx.subject}`);
  console.log(`Resolved Domains (${domains.length}):`);
  console.log(`- ${domains.slice(0, 5).join("\n- ")}`);
  console.log("-----------------------------------\n");
});

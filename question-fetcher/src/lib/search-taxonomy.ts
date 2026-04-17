/**
 * Search Domain Taxonomy
 * Maps academic contexts (Class, Exam, Subject) to high-authority domains.
 */

export interface SearchContext {
  targetClass: string;
  exams: string[];
  subject: string;
}

const CLUSTERS = {
  SCIENCE_COMPETITIVE: [
    "mathongo.com",
    "allen.ac.in",
    "pw.live",
    "esaral.com",
    "careers360.com",
    "unacademy.com",
    "aakash.ac.in",
    "doubtnut.com",
    "embibe.com",
    "vedantu.com",
    "resonance.ac.in",
    "fiitjee.com",
    "motion.ac.in",
    "careerorbits.com",
    "neetprep.com",
    "askiitians.com",
    "examside.com"
  ],
  SCIENCE_ACADEMIC: [
    "learncbse.in",
    "selfstudys.com",
    "byjus.com",
    "ncert.nic.in",
    "shaalaa.com",
    "vedantu.com",
    "toppr.com",
    "studiestoday.com",
    "aglasem.com",
    "physicswallah.com",
    "mycbseguide.com",
    "cbseacademic.nic.in",
    "testbook.com",
    "jagranjosh.com"
  ],
  ICSE_ISC_ACADEMIC: [
    "cisce.org",
    "icsehelp.com",
    "notopedia.com",
    "guideforteachers.com",
    "shaalaa.com",
    "vedantu.com"
  ],
  COMMERCE_ACADEMIC: [
    "topperlearning.com",
    "edurev.in",
    "shaalaa.com",
    "tsmg.in",
    "caat.in",
    "byjus.com",
    "meritnation.com",
    "accountancyknowledge.com",
    "commerceatease.com",
    "vedantu.com",
    "studiestoday.com"
  ],
  HUMANITIES_ACADEMIC: [
    "shaalaa.com",
    "studiestoday.com",
    "successcds.net",
    "aglasem.com",
    "history.com",
    "nationalgeographic.com",
    "thoughtco.com",
    "loksabhadocs.nic.in",
    "ncert.nic.in",
    "unacademy.com"
  ],
  LANGUAGES: [
    "sanskritfromhome.org",
    "vyomasksrit.com",
    "learncbse.in",
    "shaalaa.com",
    "successcds.net",
    "examveda.com",
    "bengaliformula.com",
    "banglashiskhardhara.com",
    "hindikiduniya.com",
    "grammarly.com",
    "dictionary.cambridge.org",
    "collinsdictionary.com"
  ],
  REGIONAL_WBSCHE: [
    "wbchse.nic.in",
    "exametc.com",
    "wbresults.nic.in",
    "selfstudys.com",
    "shaalaa.com",
    "bengaliformula.com",
    "wbbse.wb.gov.in",
    "edudigm.in",
    "careerpower.in"
  ],
  GRADUATION_ADVANCED: [
    "nptel.ac.in",
    "coursera.org",
    "mit.edu",
    "khanacademy.org",
    "sciencedirect.com",
    "ignou.ac.in",
    "jstor.org",
    "academia.edu",
    "arxiv.org",
    "springer.com",
    "nature.com",
    "wiley.com",
    "ieeexplore.ieee.org"
  ],
  MIDDLE_SCHOOL_ACADEMIC: [
    "khanacademy.org",
    "magnetbrains.com",
    "nextgurukul.in",
    "pw.live",
    "learnnext.com",
    "factmonster.com",
    "natgeokids.com",
    "britannica.com",
    "selfstudys.com",
    "learncbse.in"
  ],
  DEFAULT: [
    "byjus.com",
    "toppr.com",
    "vedantu.com",
    "shaalaa.com",
    "careers360.com",
    "selfstudys.com",
    "pw.live",
    "studiestoday.com",
    "aglasem.com",
    "testbook.com",
    "embibe.com"
  ]
};

/**
 * Resolves the top 5-10 domains based on provided context.
 */
export function getDomainsForContext(context: SearchContext): string[] {
  const { targetClass, exams, subject } = context;
  const domains = new Set<string>();

  const subjectLower = subject.toLowerCase();
  const isScience = ["physics", "chemistry", "biology", "mathematics", "computer science", "environmental science", "maths", "psychology", "physical education"].some(s => subjectLower.includes(s));
  const isCommerce = ["business", "accountancy", "economics", "entrepreneurship", "legal studies"].some(s => subjectLower.includes(s));
  const isHumanities = ["history", "geography", "political", "sociology", "psychology", "philosophy", "home science", "fine arts"].some(s => subjectLower.includes(s));
  const isLanguage = ["english", "hindi", "sanskrit", "bengali", "french", "german", "spanish"].some(s => subjectLower.includes(s));


  // 1. Board-Specific Logic (Top Priority)
  if (exams.some(e => e.includes("wbsche"))) {
    CLUSTERS.REGIONAL_WBSCHE.forEach(d => domains.add(d));
  }
  if (exams.some(e => e.includes("icse") || e.includes("isc"))) {
    CLUSTERS.ICSE_ISC_ACADEMIC.forEach(d => domains.add(d));
  }

  // 2. Graduation / Advanced research
  if (targetClass.toLowerCase() === "graduation") {
    CLUSTERS.GRADUATION_ADVANCED.forEach(d => domains.add(d));
  }

  // 3. Middle School specific overrides
  if (["6", "7", "8"].includes(targetClass)) {
    CLUSTERS.MIDDLE_SCHOOL_ACADEMIC.forEach(d => domains.add(d));
  }

  // 4. Competitive Exams logic
  if (exams.some(e => e.includes("jee") || e.includes("neet"))) {
    if (isScience) {
      CLUSTERS.SCIENCE_COMPETITIVE.forEach(d => domains.add(d));
    }
  }

  // 4. Default Subject Clusters (NCERT/CBSE style or fallback)
  if (isScience) {
    CLUSTERS.SCIENCE_ACADEMIC.forEach(d => domains.add(d));
  } else if (isCommerce) {
    CLUSTERS.COMMERCE_ACADEMIC.forEach(d => domains.add(d));
  } else if (isHumanities) {
    CLUSTERS.HUMANITIES_ACADEMIC.forEach(d => domains.add(d));
  } else if (isLanguage) {
    CLUSTERS.LANGUAGES.forEach(d => domains.add(d));
  }

  // 5. Final Defaults
  CLUSTERS.DEFAULT.forEach(d => domains.add(d));

  const result = Array.from(domains).slice(0, 60);
  if (result.length >= 25) return result;

  // When taxonomy resolution yields few domains, return a broader academic
  // fallback set to ensure search coverage across many trusted sources.
  const expandedFallback = [
    // Major education platforms
    "khanacademy.org",
    "coursera.org",
    "edx.org",
    "udemy.com",
    "swayam.gov.in",
    "nptel.ac.in",
    "mit.edu",
    "ocw.mit.edu",
    "stanford.edu",
    "harvard.edu",
    // National education boards & resources
    "ncert.nic.in",
    "cbse.gov.in",
    "cbseacademic.nic.in",
    "cisce.org",
    // Popular Indian exam prep and academic hubs
    "byjus.com",
    "toppr.com",
    "vedantu.com",
    "careers360.com",
    "testbook.com",
    "embibe.com",
    "unacademy.com",
    "fiitjee.com",
    "aakash.ac.in",
    "allen.ac.in",
    "resonance.ac.in",
    "pw.live",
    "neetprep.com",
    "physicswallah.com",
    "selfstudys.com",
    "studiestoday.com",
    "aglasem.com",
    "meritnation.com",
    // Reference & research
    "wikipedia.org",
    "britannica.com",
    "researchgate.net",
    "academia.edu",
    "arxiv.org",
    "jstor.org",
    "springer.com",
    "nature.com",
    "sciencedirect.com",
    "ieeexplore.ieee.org",
    // Regional/local educational portals
    "exametc.com",
    "shaalaa.com",
    "learncbse.in",
    "magnetbrains.com",
    "nextgurukul.in",
    "learnnext.com",
    "factmonster.com",
    // Language/grammar resources
    "grammarly.com",
    "dictionary.cambridge.org",
    "collinsdictionary.com",
    // Sample papers / news / explainers
    "jagranjosh.com",
    "successcds.net",
    "nationalgeographic.com",
    "history.com",
    // Misc education hubs and question banks
    "samplepapers.in",
    "entrance-exam.net",
    "examsbook.com",
    "careerorbits.com",
    "askIITians.com",
    "doubtnut.com",
    "topperlearning.com",
    "edurev.in",
    "meritnation.com",
    "accountancyknowledge.com",
    "commerceatease.com",
    "bengaliformula.com",
    "hindikiduniya.com",
    "banglashiskhardhara.com",
    // Add default cluster at the end to preserve previous safety net
    ...CLUSTERS.DEFAULT,
  ];

  // Merge domains with existing ones, de-duplicate, and return up to 200
  const merged = Array.from(new Set([...Array.from(domains), ...expandedFallback]));
  return merged.slice(0, 200);
}

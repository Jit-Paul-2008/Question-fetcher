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
    "doubtnut.com"
  ],
  SCIENCE_ACADEMIC: [
    "learncbse.in",
    "selfstudys.com",
    "byjus.com",
    "ncert.nic.in",
    "shaalaa.com",
    "vedantu.com",
    "toppr.com"
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
    "byjus.com"
  ],
  HUMANITIES_ACADEMIC: [
    "shaalaa.com",
    "studiestoday.com",
    "successcds.net",
    "aglasem.com",
    "history.com",
    "nationalgeographic.com"
  ],
  LANGUAGES: [
    "sanskritfromhome.org",
    "vyomasksrit.com",
    "learncbse.in",
    "shaalaa.com",
    "successcds.net",
    "examveda.com",
    "bengaliformula.com",
    "banglashiskhardhara.com"
  ],
  REGIONAL_WBSCHE: [
    "wbchse.nic.in",
    "exametc.com",
    "wbresults.nic.in",
    "selfstudys.com",
    "shaalaa.com",
    "bengaliformula.com"
  ],
  GRADUATION_ADVANCED: [
    "nptel.ac.in",
    "coursera.org",
    "mit.edu",
    "khanacademy.org",
    "sciencedirect.com",
    "ignou.ac.in",
    "jstor.org",
    "academia.edu"
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
    "pw.live"
  ]
};

/**
 * Resolves the top 5-10 domains based on provided context.
 */
export function getDomainsForContext(context: SearchContext): string[] {
  const { targetClass, exams, subject } = context;
  const domains = new Set<string>();

  const subjectLower = subject.toLowerCase();
  const isScience = ["physics", "chemistry", "biology", "mathematics", "computer science", "environmental science", "maths"].some(s => subjectLower.includes(s));
  const isCommerce = ["business", "accountancy", "economics"].some(s => subjectLower.includes(s));
  const isHumanities = ["history", "geography", "political", "sociology", "psychology", "philosophy"].some(s => subjectLower.includes(s));
  const isLanguage = ["english", "hindi", "sanskrit", "bengali"].some(s => subjectLower.includes(s));

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

  const result = Array.from(domains).slice(0, 15);
  return result.length > 0 ? result : CLUSTERS.DEFAULT;
}

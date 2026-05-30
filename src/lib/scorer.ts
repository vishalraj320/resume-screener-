import { extractJdRequirements } from "./skills";

export interface ScoreBreakdown {
  matchScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  keywordScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  summary: string;
}

const EXPERIENCE_KEYWORDS = [
  "years",
  "year",
  "senior",
  "lead",
  "manager",
  "director",
  "intern",
  "junior",
  "mid-level",
  "architect",
  "principal",
  "staff",
  "consultant",
  "analyst",
  "engineer",
  "developer",
  "specialist",
];

const EDUCATION_KEYWORDS = [
  "bachelor",
  "master",
  "mba",
  "phd",
  "doctorate",
  "degree",
  "b.s.",
  "b.a.",
  "m.s.",
  "m.a.",
  "b.tech",
  "m.tech",
  "university",
  "college",
  "certification",
  "certified",
  "diploma",
];

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9+#.\s-]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2)
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function scoreSkills(
  resumeSkills: string[],
  jdSkills: string[]
): { score: number; matching: string[]; missing: string[] } {
  if (jdSkills.length === 0) {
    return { score: 70, matching: resumeSkills.slice(0, 10), missing: [] };
  }

  const resumeSet = new Set(resumeSkills.map((s) => s.toLowerCase()));
  const matching: string[] = [];
  const missing: string[] = [];

  for (const skill of jdSkills) {
    const lower = skill.toLowerCase();
    const found =
      resumeSet.has(lower) ||
      [...resumeSet].some(
        (rs) => rs.includes(lower) || lower.includes(rs)
      );

    if (found) matching.push(skill);
    else missing.push(skill);
  }

  const score =
    jdSkills.length > 0 ? (matching.length / jdSkills.length) * 100 : 50;

  return { score: Math.min(100, score), matching, missing };
}

function scoreExperience(
  resumeExp: string,
  jdText: string
): number {
  const jdLower = jdText.toLowerCase();
  const expLower = resumeExp.toLowerCase();
  const combinedResume = expLower;

  let yearsRequired = 0;
  const yearMatch = jdLower.match(/(\d+)\+?\s*(?:years?|yrs?)/);
  if (yearMatch) yearsRequired = parseInt(yearMatch[1], 10);

  const resumeYears = combinedResume.match(/(\d+)\+?\s*(?:years?|yrs?)/g);
  let maxResumeYears = 0;
  if (resumeYears) {
    for (const ym of resumeYears) {
      const n = parseInt(ym, 10);
      if (n > maxResumeYears && n < 30) maxResumeYears = n;
    }
  }

  let score = 50;

  if (yearsRequired > 0) {
    if (maxResumeYears >= yearsRequired) score = 95;
    else if (maxResumeYears >= yearsRequired - 2) score = 75;
    else if (maxResumeYears > 0) score = 50;
    else score = 30;
  }

  const jdExpKeywords = EXPERIENCE_KEYWORDS.filter((k) => jdLower.includes(k));
  if (jdExpKeywords.length > 0) {
    const matched = jdExpKeywords.filter((k) => combinedResume.includes(k));
    const keywordScore = (matched.length / jdExpKeywords.length) * 100;
    score = yearsRequired > 0 ? score * 0.6 + keywordScore * 0.4 : keywordScore;
  }

  const jdTokens = tokenize(jdText);
  const expTokens = tokenize(combinedResume);
  const similarity = jaccardSimilarity(jdTokens, expTokens);
  score = score * 0.7 + similarity * 100 * 0.3;

  return Math.min(100, Math.max(0, Math.round(score)));
}

function scoreEducation(resumeEdu: string, jdText: string): number {
  const jdLower = jdText.toLowerCase();
  const eduLower = (resumeEdu + " ").toLowerCase();

  const jdEduKeywords = EDUCATION_KEYWORDS.filter((k) => jdLower.includes(k));
  if (jdEduKeywords.length === 0) return 70;

  const matched = jdEduKeywords.filter((k) => eduLower.includes(k));
  const baseScore = (matched.length / jdEduKeywords.length) * 100;

  const degreePatterns = [
    /bachelor|b\.?s\.?|b\.?a\.?|b\.?tech/i,
    /master|m\.?s\.?|m\.?a\.?|mba|m\.?tech/i,
    /ph\.?d|doctorate/i,
  ];

  let bonus = 0;
  for (const pattern of degreePatterns) {
    if (pattern.test(jdLower) && pattern.test(eduLower)) bonus += 10;
  }

  return Math.min(100, Math.round(baseScore + bonus));
}

function scoreKeywords(resumeText: string, jdText: string): number {
  const jdTokens = tokenize(jdText);
  const resumeTokens = tokenize(resumeText);
  const similarity = jaccardSimilarity(jdTokens, resumeTokens);
  return Math.round(similarity * 100);
}

export function scoreCandidate(
  resumeText: string,
  resumeSkills: string[],
  resumeExp: string,
  resumeEdu: string,
  jdText: string
): ScoreBreakdown {
  const jdSkills = extractJdRequirements(jdText);
  const { score: skillsScore, matching, missing } = scoreSkills(
    resumeSkills,
    jdSkills
  );
  const experienceScore = scoreExperience(resumeExp || resumeText, jdText);
  const educationScore = scoreEducation(resumeEdu, jdText);
  const keywordScore = scoreKeywords(resumeText, jdText);

  const matchScore = Math.round(
    skillsScore * 0.4 +
      experienceScore * 0.3 +
      educationScore * 0.15 +
      keywordScore * 0.15
  );

  const summary = buildSummary(
    matchScore,
    matching,
    missing,
    experienceScore,
    educationScore
  );

  return {
    matchScore: Math.min(100, Math.max(0, matchScore)),
    skillsScore: Math.round(skillsScore),
    experienceScore,
    educationScore,
    keywordScore,
    matchingSkills: matching.slice(0, 15),
    missingSkills: missing.slice(0, 15),
    summary,
  };
}

function buildSummary(
  score: number,
  matching: string[],
  missing: string[],
  expScore: number,
  eduScore: number
): string {
  const parts: string[] = [];

  if (score >= 80) parts.push("Strong overall match for this role.");
  else if (score >= 60) parts.push("Good match with some gaps to review.");
  else if (score >= 40) parts.push("Moderate match; consider for further screening.");
  else parts.push("Limited alignment with job requirements.");

  if (matching.length > 0) {
    parts.push(`Key strengths: ${matching.slice(0, 5).join(", ")}.`);
  }
  if (missing.length > 0) {
    parts.push(`Gaps: ${missing.slice(0, 5).join(", ")}.`);
  }
  if (expScore >= 75) parts.push("Experience level aligns well.");
  if (eduScore >= 75) parts.push("Education requirements met.");

  return parts.join(" ");
}

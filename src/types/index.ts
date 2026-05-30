export interface ScreeningSession {
  id: string;
  jobTitle: string | null;
  jobDescription: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Resume {
  id: string;
  fileName: string;
  parsedName: string | null;
  parsedEmail: string | null;
  parsedPhone: string | null;
  parsedSkills: string[];
  rawText: string | null;
}

export interface Candidate {
  id: string;
  name: string;
  matchScore: number;
  rank: number;
  matchingSkills: string[];
  missingSkills: string[];
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  keywordScore: number;
  summary: string | null;
  resume: Resume;
}

export interface SessionWithCandidates extends ScreeningSession {
  resumes: Resume[];
  candidates: Candidate[];
}

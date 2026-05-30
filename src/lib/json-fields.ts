export function toJsonArray(value: string[] | string): string[] {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function fromJsonArray(value: string[]): string {
  return JSON.stringify(value);
}

export function formatCandidate<T extends Record<string, unknown>>(candidate: T) {
  return {
    ...candidate,
    matchingSkills: toJsonArray(candidate.matchingSkills as string),
    missingSkills: toJsonArray(candidate.missingSkills as string),
    resume: candidate.resume
      ? {
          ...(candidate.resume as Record<string, unknown>),
          parsedSkills: toJsonArray(
            (candidate.resume as Record<string, unknown>).parsedSkills as string
          ),
        }
      : candidate.resume,
  };
}

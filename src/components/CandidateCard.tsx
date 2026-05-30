"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Mail, Phone } from "lucide-react";
import type { Candidate } from "@/types";
import ScoreBadge from "./ScoreBadge";

export default function CandidateCard({ candidate }: { candidate: Candidate }) {
  const [expanded, setExpanded] = useState(false);
  const preview = (candidate.resume.rawText || "").slice(0, 400);

  return (
    <article className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden animate-fade-in">
      <div className="p-5 flex flex-col sm:flex-row gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <span className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
              Rank #{candidate.rank}
            </span>
            <ScoreBadge score={candidate.matchScore} />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold truncate">{candidate.name}</h3>
            <div className="flex flex-wrap gap-3 mt-1 text-sm text-[var(--muted)]">
              {candidate.resume.parsedEmail && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {candidate.resume.parsedEmail}
                </span>
              )}
              {candidate.resume.parsedPhone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {candidate.resume.parsedPhone}
                </span>
              )}
            </div>

            {candidate.summary && (
              <p className="mt-2 text-sm text-[var(--muted)] line-clamp-2">
                {candidate.summary}
              </p>
            )}

            <div className="flex flex-wrap gap-4 mt-3 text-xs">
              <ScorePill label="Skills" value={candidate.skillsScore} />
              <ScorePill label="Experience" value={candidate.experienceScore} />
              <ScorePill label="Education" value={candidate.educationScore} />
              <ScorePill label="Keywords" value={candidate.keywordScore} />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="self-start sm:self-center flex items-center gap-1 text-sm text-[var(--primary)] hover:underline shrink-0"
        >
          {expanded ? (
            <>
              Less <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              Details <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {expanded && (
        <div className="px-5 pb-5 pt-0 border-t border-[var(--card-border)] space-y-4">
          {candidate.matchingSkills.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-[var(--success)] mb-2">
                Matching Skills
              </h4>
              <div className="flex flex-wrap gap-2">
                {candidate.matchingSkills.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-1 rounded-full text-xs bg-[var(--success)]/15 text-[var(--success)]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {candidate.missingSkills.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-[var(--danger)] mb-2">
                Missing Skills
              </h4>
              <div className="flex flex-wrap gap-2">
                {candidate.missingSkills.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-1 rounded-full text-xs bg-[var(--danger)]/15 text-[var(--danger)]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold uppercase text-[var(--muted)] mb-2">
              Resume Preview
            </h4>
            <pre className="text-xs text-[var(--muted)] whitespace-pre-wrap font-sans bg-[var(--background)] rounded-lg p-4 max-h-48 overflow-y-auto">
              {preview}
              {(candidate.resume.rawText?.length || 0) > 400 && "…"}
            </pre>
          </div>
        </div>
      )}
    </article>
  );
}

function ScorePill({ label, value }: { label: string; value: number }) {
  return (
    <span className="text-[var(--muted)]">
      {label}:{" "}
      <span className="font-medium text-[var(--foreground)]">{value}%</span>
    </span>
  );
}

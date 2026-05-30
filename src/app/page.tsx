"use client";

import { useState, useMemo } from "react";
import {
  Briefcase,
  Search,
  Download,
  Loader2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  FileSpreadsheet,
} from "lucide-react";
import StepIndicator from "@/components/StepIndicator";
import FileDropzone from "@/components/FileDropzone";
import CandidateCard from "@/components/CandidateCard";
import type { Candidate } from "@/types";

type Step = 1 | 2 | 3 | 4;

export default function Home() {
  const [step, setStep] = useState<Step>(1);
  const [resumeFiles, setResumeFiles] = useState<File[]>([]);
  const [jdFile, setJdFile] = useState<File[]>([]);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortDesc, setSortDesc] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadResults, setUploadResults] = useState<
    { fileName: string; success?: boolean; error?: string }[]
  >([]);

  const filteredCandidates = useMemo(() => {
    let list = [...candidates];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.matchingSkills.some((s) => s.toLowerCase().includes(q)) ||
          c.resume.parsedEmail?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) =>
      sortDesc ? b.matchScore - a.matchScore : a.matchScore - b.matchScore
    );
    return list;
  }, [candidates, searchQuery, sortDesc]);

  async function parseJdFile(file: File) {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/jd/parse", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse JD");
      setJobDescription(data.text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse JD file");
    } finally {
      setLoading(false);
    }
  }

  async function handleStep1Next() {
    if (resumeFiles.length === 0) {
      setError("Please upload at least one resume.");
      return;
    }
    setError(null);
    setStep(2);
  }

  async function handleStep2Next() {
    if (!jobDescription.trim()) {
      setError("Please enter or upload a job description.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const sessionRes = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle, jobDescription }),
      });
      const session = await sessionRes.json();
      if (!sessionRes.ok) throw new Error(session.error);

      setSessionId(session.id);

      const formData = new FormData();
      resumeFiles.forEach((f) => formData.append("resumes", f));

      const uploadRes = await fetch(`/api/sessions/${session.id}/resumes`, {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error);

      setUploadResults(uploadData.uploaded || []);
      const failures = (uploadData.uploaded || []).filter(
        (u: { success?: boolean; error?: string }) => u.error
      );
      if (failures.length === uploadData.uploaded?.length) {
        throw new Error("All resume uploads failed. Check file formats.");
      }

      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze() {
    if (!sessionId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/sessions/${sessionId}/analyze`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCandidates(data.candidates);
      setStep(4);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  function handleExport(format: "csv" | "xlsx") {
    if (!sessionId) return;
    window.open(`/api/sessions/${sessionId}/export?format=${format}`, "_blank");
  }

  function reset() {
    setStep(1);
    setResumeFiles([]);
    setJdFile([]);
    setJobTitle("");
    setJobDescription("");
    setSessionId(null);
    setCandidates([]);
    setSearchQuery("");
    setError(null);
    setUploadResults([]);
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-[var(--card-border)] bg-[var(--card)]/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Resume Screener</h1>
              <p className="text-xs text-[var(--muted)]">
                AI-powered candidate ranking
              </p>
            </div>
          </div>
          {step > 1 && (
            <button
              onClick={reset}
              className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Start over
            </button>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <StepIndicator currentStep={step} />

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-[var(--danger)]/15 border border-[var(--danger)]/30 text-[var(--danger)] text-sm">
            {error}
          </div>
        )}

        {step === 1 && (
          <section className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-2">Upload Resumes</h2>
            <p className="text-[var(--muted)] mb-6">
              Upload one or more candidate resumes. Supported formats: PDF, DOC,
              DOCX.
            </p>
            <FileDropzone
              label="Drop resumes here or click to browse"
              hint="PDF, DOC, DOCX — multiple files supported"
              files={resumeFiles}
              onFilesChange={setResumeFiles}
            />
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleStep1Next}
                disabled={resumeFiles.length === 0}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="animate-fade-in space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Job Description</h2>
              <p className="text-[var(--muted)]">
                Enter the role details manually or upload a JD document.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Job Title (optional)
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Software Engineer"
                className="w-full px-4 py-3 rounded-lg bg-[var(--card)] border border-[var(--card-border)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Upload JD Document
              </label>
              <FileDropzone
                multiple={false}
                label="Drop JD file here"
                hint="PDF, DOC, or DOCX"
                files={jdFile}
                onFilesChange={(files) => {
                  setJdFile(files);
                  if (files[0]) parseJdFile(files[0]);
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Job Description
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={12}
                placeholder="Paste or type the full job description including required skills, experience, and qualifications..."
                className="w-full px-4 py-3 rounded-lg bg-[var(--card)] border border-[var(--card-border)] focus:border-[var(--primary)] focus:outline-none resize-y"
              />
            </div>

            <div className="flex justify-between gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-5 py-3 rounded-full border border-[var(--card-border)] hover:bg-[var(--card)]"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleStep2Next}
                disabled={loading || !jobDescription.trim()}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary-hover)] disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Uploading…
                  </>
                ) : (
                  <>
                    Continue <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="animate-fade-in text-center py-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[var(--accent)]/20 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-[var(--accent)]" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Ready to Analyze</h2>
            <p className="text-[var(--muted)] max-w-md mx-auto mb-4">
              {resumeFiles.length} resume(s) uploaded
              {uploadResults.filter((u) => u.error).length > 0 &&
                ` (${uploadResults.filter((u) => u.error).length} failed)`}
              . The system will extract skills, experience, and education, then
              score each candidate against your job description.
            </p>

            <div className="max-w-sm mx-auto text-left mb-8 p-4 rounded-lg bg-[var(--card)] border border-[var(--card-border)] text-sm space-y-2">
              <p className="font-medium">Scoring factors:</p>
              <ul className="text-[var(--muted)] space-y-1 list-disc list-inside">
                <li>Skills match (40%)</li>
                <li>Experience relevance (30%)</li>
                <li>Education alignment (15%)</li>
                <li>Keyword similarity (15%)</li>
              </ul>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[var(--accent)] text-white font-semibold text-lg hover:opacity-90 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Analyzing…
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" /> Run Analysis
                </>
              )}
            </button>
          </section>
        )}

        {step === 4 && (
          <section className="animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold">Ranked Candidates</h2>
                <p className="text-[var(--muted)]">
                  {candidates.length} candidate(s) scored and ranked
                  {jobTitle && ` for ${jobTitle}`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleExport("csv")}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--card-border)] hover:bg-[var(--card)] text-sm"
                >
                  <Download className="w-4 h-4" /> CSV
                </button>
                <button
                  onClick={() => handleExport("xlsx")}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--card-border)] hover:bg-[var(--card)] text-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Excel
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, or skill…"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--card)] border border-[var(--card-border)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>
              <button
                onClick={() => setSortDesc(!sortDesc)}
                className="px-4 py-2.5 rounded-lg border border-[var(--card-border)] hover:bg-[var(--card)] text-sm whitespace-nowrap"
              >
                Sort: {sortDesc ? "Highest score" : "Lowest score"}
              </button>
            </div>

            {filteredCandidates.length === 0 ? (
              <p className="text-center text-[var(--muted)] py-12">
                No candidates match your search.
              </p>
            ) : (
              <div className="space-y-4">
                {filteredCandidates.map((c) => (
                  <CandidateCard key={c.id} candidate={c} />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

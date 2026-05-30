"use client";

const STEPS = [
  { num: 1, label: "Upload Resumes" },
  { num: 2, label: "Job Description" },
  { num: 3, label: "Analyze" },
  { num: 4, label: "Results" },
];

export default function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 mb-10 flex-wrap">
      {STEPS.map((step, i) => (
        <div key={step.num} className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                currentStep >= step.num
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--card)] border border-[var(--card-border)] text-[var(--muted)]"
              }`}
            >
              {currentStep > step.num ? "✓" : step.num}
            </div>
            <span
              className={`text-sm hidden sm:inline ${
                currentStep >= step.num
                  ? "text-[var(--foreground)]"
                  : "text-[var(--muted)]"
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`w-8 sm:w-12 h-0.5 ${
                currentStep > step.num
                  ? "bg-[var(--primary)]"
                  : "bg-[var(--card-border)]"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

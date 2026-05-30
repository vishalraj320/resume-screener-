export default function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? "var(--success)"
      : score >= 60
        ? "var(--primary)"
        : score >= 40
          ? "var(--warning)"
          : "var(--danger)";

  return (
    <div className="relative w-16 h-16 shrink-0">
      <div
        className="score-ring w-full h-full rounded-full flex items-center justify-center"
        style={{ "--score": score } as React.CSSProperties}
      >
        <div className="w-12 h-12 rounded-full bg-[var(--card)] flex items-center justify-center">
          <span className="text-lg font-bold" style={{ color }}>
            {Math.round(score)}
          </span>
        </div>
      </div>
    </div>
  );
}

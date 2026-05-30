import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scoreCandidate } from "@/lib/scorer";
import { fromJsonArray, toJsonArray, formatCandidate } from "@/lib/json-fields";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;

    const session = await prisma.screeningSession.findUnique({
      where: { id: sessionId },
      include: { resumes: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.resumes.length === 0) {
      return NextResponse.json(
        { error: "No resumes uploaded for this session" },
        { status: 400 }
      );
    }

    await prisma.candidate.deleteMany({ where: { sessionId } });

    const scored: Array<{
      resumeId: string;
      name: string;
      breakdown: ReturnType<typeof scoreCandidate>;
    }> = [];

    for (const resume of session.resumes) {
      const breakdown = scoreCandidate(
        resume.rawText || "",
        toJsonArray(resume.parsedSkills),
        resume.parsedExp || "",
        resume.parsedEdu || "",
        session.jobDescription
      );

      scored.push({
        resumeId: resume.id,
        name: resume.parsedName || resume.fileName,
        breakdown,
      });
    }

    scored.sort((a, b) => b.breakdown.matchScore - a.breakdown.matchScore);

    const candidates = await Promise.all(
      scored.map((item, index) =>
        prisma.candidate.create({
          data: {
            sessionId,
            resumeId: item.resumeId,
            name: item.name,
            matchScore: item.breakdown.matchScore,
            rank: index + 1,
            matchingSkills: fromJsonArray(item.breakdown.matchingSkills),
            missingSkills: fromJsonArray(item.breakdown.missingSkills),
            skillsScore: item.breakdown.skillsScore,
            experienceScore: item.breakdown.experienceScore,
            educationScore: item.breakdown.educationScore,
            keywordScore: item.breakdown.keywordScore,
            summary: item.breakdown.summary,
          },
          include: { resume: true },
        })
      )
    );

    await prisma.screeningSession.update({
      where: { id: sessionId },
      data: { status: "completed" },
    });

    return NextResponse.json({
      candidates: candidates.map(formatCandidate),
      count: candidates.length,
    });
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json(
      { error: "Failed to analyze resumes" },
      { status: 500 }
    );
  }
}

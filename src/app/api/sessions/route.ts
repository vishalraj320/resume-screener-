import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobTitle, jobDescription } = body;

    if (!jobDescription?.trim()) {
      return NextResponse.json(
        { error: "Job description is required" },
        { status: 400 }
      );
    }

    const session = await prisma.screeningSession.create({
      data: {
        jobTitle: jobTitle?.trim() || null,
        jobDescription: jobDescription.trim(),
        status: "pending",
      },
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error("Create session error:", error);
    return NextResponse.json(
      { error: "Failed to create screening session" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const sessions = await prisma.screeningSession.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        _count: { select: { candidates: true, resumes: true } },
      },
    });
    return NextResponse.json(sessions);
  } catch (error) {
    console.error("List sessions error:", error);
    return NextResponse.json(
      { error: "Failed to list sessions" },
      { status: 500 }
    );
  }
}

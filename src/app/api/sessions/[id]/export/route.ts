import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { toJsonArray } from "@/lib/json-fields";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const format = request.nextUrl.searchParams.get("format") || "csv";

    const session = await prisma.screeningSession.findUnique({
      where: { id: sessionId },
      include: {
        candidates: {
          orderBy: { rank: "asc" },
          include: { resume: true },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const rows = session.candidates.map((c) => ({
      Rank: c.rank,
      Name: c.name,
      Email: c.resume.parsedEmail || "",
      Phone: c.resume.parsedPhone || "",
      "Match Score": c.matchScore,
      "Skills Score": c.skillsScore,
      "Experience Score": c.experienceScore,
      "Education Score": c.educationScore,
      "Keyword Score": c.keywordScore,
      "Matching Skills": toJsonArray(c.matchingSkills).join("; "),
      "Missing Skills": toJsonArray(c.missingSkills).join("; "),
      Summary: c.summary || "",
      "Resume File": c.resume.fileName,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Candidates");

    if (format === "xlsx") {
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      return new NextResponse(buffer, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="candidates-${sessionId}.xlsx"`,
        },
      });
    }

    const csv = XLSX.utils.sheet_to_csv(worksheet);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="candidates-${sessionId}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export results" },
      { status: 500 }
    );
  }
}

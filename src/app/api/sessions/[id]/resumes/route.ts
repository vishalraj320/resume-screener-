import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseResume, saveUploadedFile } from "@/lib/parser";
import { fromJsonArray } from "@/lib/json-fields";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const ALLOWED_EXT = [".pdf", ".doc", ".docx"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;

    const session = await prisma.screeningSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const files = formData.getAll("resumes") as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No resume files provided" },
        { status: 400 }
      );
    }

    const uploaded = [];

    for (const file of files) {
      const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
      if (
        !ALLOWED_TYPES.includes(file.type) &&
        !ALLOWED_EXT.includes(ext)
      ) {
        uploaded.push({
          fileName: file.name,
          error: `Unsupported format. Use PDF, DOC, or DOCX.`,
        });
        continue;
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      try {
        const parsed = await parseResume(buffer, file.type, file.name);
        const filePath = await saveUploadedFile(buffer, file.name);

        const resume = await prisma.resume.create({
          data: {
            sessionId,
            fileName: file.name,
            filePath,
            mimeType: file.type || "application/octet-stream",
            rawText: parsed.rawText,
            parsedName: parsed.name,
            parsedEmail: parsed.email,
            parsedPhone: parsed.phone,
            parsedSkills: fromJsonArray(parsed.skills),
            parsedExp: parsed.experience,
            parsedEdu: parsed.education,
          },
        });

        uploaded.push({ fileName: file.name, resume, success: true });
      } catch (err) {
        uploaded.push({
          fileName: file.name,
          error: err instanceof Error ? err.message : "Parse failed",
        });
      }
    }

    await prisma.screeningSession.update({
      where: { id: sessionId },
      data: { status: "resumes_uploaded" },
    });

    return NextResponse.json({ uploaded });
  } catch (error) {
    console.error("Upload resumes error:", error);
    return NextResponse.json(
      { error: "Failed to upload resumes" },
      { status: 500 }
    );
  }
}

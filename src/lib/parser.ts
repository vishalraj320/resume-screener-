import fs from "fs/promises";
import path from "path";
import mammoth from "mammoth";

export interface ParsedResume {
  rawText: string;
  name: string;
  email: string | null;
  phone: string | null;
  skills: string[];
  experience: string;
  education: string;
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  return data.text || "";
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value || "";
}

export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<string> {
  const ext = path.extname(fileName).toLowerCase();

  if (mimeType === "application/pdf" || ext === ".pdf") {
    return extractPdfText(buffer);
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === ".docx"
  ) {
    return extractDocxText(buffer);
  }

  if (mimeType === "application/msword" || ext === ".doc") {
    try {
      return await extractDocxText(buffer);
    } catch {
      return buffer.toString("utf-8").replace(/\0/g, " ");
    }
  }

  throw new Error(`Unsupported file format: ${fileName}`);
}

function extractName(text: string, fileName: string): string {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines.slice(0, 8)) {
    if (line.length < 3 || line.length > 60) continue;
    if (/@/.test(line) || /http/i.test(line) || /\d{3}/.test(line)) continue;
    if (/^(resume|curriculum|cv|profile)/i.test(line)) continue;
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 5) {
      const looksLikeName = words.every(
        (w) => /^[A-Z][a-z'.-]+$/.test(w) || /^[A-Z]+$/.test(w)
      );
      if (looksLikeName) return line;
    }
  }

  const baseName = path.basename(fileName, path.extname(fileName));
  return baseName.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractEmail(text: string): string | null {
  const match = text.match(/[\w.+-]+@[\w.-]+\.\w{2,}/);
  return match ? match[0] : null;
}

function extractPhone(text: string): string | null {
  const match = text.match(
    /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/
  );
  return match ? match[0].trim() : null;
}

function extractExperienceSection(text: string): string {
  const patterns = [
    /(?:experience|work history|employment|professional experience)[:\s]*([\s\S]{0,3000})/i,
    /(?:employment history)[:\s]*([\s\S]{0,3000})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim().slice(0, 2000);
  }

  return text.slice(0, 1500);
}

function extractEducationSection(text: string): string {
  const patterns = [
    /(?:education|academic|qualifications)[:\s]*([\s\S]{0,2000})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim().slice(0, 1000);
  }

  return "";
}

export async function parseResume(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<ParsedResume> {
  const rawText = await extractTextFromFile(buffer, mimeType, fileName);
  const { extractSkillsFromText } = await import("./skills");

  return {
    rawText,
    name: extractName(rawText, fileName),
    email: extractEmail(rawText),
    phone: extractPhone(rawText),
    skills: extractSkillsFromText(rawText),
    experience: extractExperienceSection(rawText),
    education: extractEducationSection(rawText),
  };
}

export async function ensureUploadDir(): Promise<string> {
  const uploadDir = path.join(process.cwd(), "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  return uploadDir;
}

export async function saveUploadedFile(
  buffer: Buffer,
  fileName: string
): Promise<string> {
  const uploadDir = await ensureUploadDir();
  const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const filePath = path.join(uploadDir, safeName);
  await fs.writeFile(filePath, buffer);
  return filePath;
}

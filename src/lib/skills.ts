export const COMMON_SKILLS = [
  "javascript",
  "typescript",
  "python",
  "java",
  "c++",
  "c#",
  "go",
  "rust",
  "ruby",
  "php",
  "swift",
  "kotlin",
  "scala",
  "react",
  "next.js",
  "nextjs",
  "vue",
  "angular",
  "svelte",
  "node.js",
  "nodejs",
  "express",
  "nestjs",
  "fastapi",
  "django",
  "flask",
  "spring",
  "spring boot",
  ".net",
  "asp.net",
  "graphql",
  "rest api",
  "rest",
  "api",
  "sql",
  "postgresql",
  "postgres",
  "mysql",
  "mongodb",
  "redis",
  "elasticsearch",
  "dynamodb",
  "aws",
  "azure",
  "gcp",
  "docker",
  "kubernetes",
  "terraform",
  "ci/cd",
  "jenkins",
  "github actions",
  "git",
  "linux",
  "agile",
  "scrum",
  "machine learning",
  "deep learning",
  "tensorflow",
  "pytorch",
  "nlp",
  "data analysis",
  "pandas",
  "numpy",
  "tableau",
  "power bi",
  "excel",
  "figma",
  "ui/ux",
  "html",
  "css",
  "tailwind",
  "sass",
  "webpack",
  "vite",
  "microservices",
  "system design",
  "leadership",
  "communication",
  "project management",
  "product management",
  "salesforce",
  "sap",
  "oracle",
  "blockchain",
  "solidity",
  "cybersecurity",
  "devops",
  "cloud",
  "serverless",
  "lambda",
  "kafka",
  "rabbitmq",
  "grpc",
  "oauth",
  "jwt",
  "testing",
  "jest",
  "cypress",
  "selenium",
  "jira",
  "confluence",
  "mba",
  "bachelor",
  "master",
  "phd",
  "computer science",
  "engineering",
  "mathematics",
  "statistics",
  "finance",
  "accounting",
  "marketing",
  "seo",
  "content writing",
  "customer service",
  "hr",
  "recruiting",
];

export function extractSkillsFromText(text: string): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();

  for (const skill of COMMON_SKILLS) {
    const pattern = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${pattern}\\b`, "i");
    if (regex.test(lower)) {
      found.add(skill);
    }
  }

  const techPatterns = [
    /\b([A-Z][a-z]+(?:\.js|JS)?)\b/g,
    /\b([A-Z]{2,}(?:\s+[A-Z][a-z]+)?)\b/g,
  ];

  for (const pattern of techPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const m of matches.slice(0, 20)) {
        const normalized = m.toLowerCase().trim();
        if (normalized.length >= 2 && normalized.length <= 30) {
          found.add(normalized);
        }
      }
    }
  }

  return Array.from(found).slice(0, 50);
}

export function extractJdRequirements(jdText: string): string[] {
  const skills = extractSkillsFromText(jdText);
  const lines = jdText.split("\n");
  const requirementLines = lines.filter((line) => {
    const l = line.toLowerCase();
    return (
      l.includes("required") ||
      l.includes("must have") ||
      l.includes("qualification") ||
      l.includes("experience with") ||
      l.includes("proficient") ||
      l.startsWith("-") ||
      l.startsWith("•") ||
      l.startsWith("*")
    );
  });

  for (const line of requirementLines) {
    const lineSkills = extractSkillsFromText(line);
    lineSkills.forEach((s) => skills.push(s));
  }

  return [...new Set(skills)];
}

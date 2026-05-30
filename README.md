# Resume Screener

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

AI-powered resume screening web app that parses candidate resumes, compares them against a job description, and ranks applicants by match score (0–100).

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Workflow](#workflow)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Scoring Algorithm](#scoring-algorithm)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Overview

Resume Screener helps recruiters and hiring teams shortlist candidates faster. Upload one or many resumes, provide a job description (typed or uploaded), run analysis, and get a ranked dashboard with match scores, skill gaps, and exportable reports.

```mermaid
flowchart LR
    A[Upload Resumes] --> B[Job Description]
    B --> C[Analyze]
    C --> D[Ranked Results]
```

---

## Features

| Category | Capabilities |
|----------|--------------|
| **Resume upload** | Single or multiple files — PDF, DOC, DOCX |
| **Job description** | Manual entry or JD document upload |
| **Parsing** | Extracts name, email, phone, skills, experience, education |
| **Scoring** | Weighted match score with skills, experience, education, keyword signals |
| **Dashboard** | Ranked list, score breakdown, matching/missing skills, resume preview |
| **Utilities** | Search candidates, sort by score, export CSV/Excel |

---

## Workflow

1. **Upload Resumes** — Drag & drop one or more candidate files.
2. **Job Description** — Paste text or upload a JD document.
3. **Analyze** — System parses resumes and scores each candidate against the JD.
4. **Results** — View ranked candidates, drill into details, and export.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, Tailwind CSS 4 |
| Backend | Next.js API Routes (Node.js) |
| Database | SQLite (local) / PostgreSQL (production) via Prisma |
| Parsing | `pdf-parse`, `mammoth` |
| Export | SheetJS (`xlsx`) |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20 or later
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/resume-screener.git
cd resume-screener

# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Create database schema
npm run db:push

# Start development server
npm run dev
```

Open **http://localhost:3000** in your browser.

### Production build

```bash
npm run build
npm start
```

Default production URL: **http://localhost:3001**

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Local development (SQLite — no extra setup required)
DATABASE_URL="file:./dev.db"

# Production (PostgreSQL)
# DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/resume_screener?schema=public"
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Prisma database connection string |

See [`.env.example`](.env.example) for a template.

### Using PostgreSQL locally

1. Start Postgres with Docker:

   ```bash
   docker compose up -d
   ```

2. Update `prisma/schema.prisma` datasource provider to `postgresql`.

3. Set `DATABASE_URL` in `.env`:

   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/resume_screener?schema=public"
   ```

4. Push schema:

   ```bash
   npm run db:push
   ```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/sessions` | Create a screening session with job description |
| `GET` | `/api/sessions` | List recent sessions |
| `GET` | `/api/sessions/:id` | Get session with resumes and candidates |
| `POST` | `/api/sessions/:id/resumes` | Upload resume files (`multipart/form-data`) |
| `POST` | `/api/sessions/:id/analyze` | Run scoring and ranking |
| `GET` | `/api/sessions/:id/export?format=csv` | Export results as CSV |
| `GET` | `/api/sessions/:id/export?format=xlsx` | Export results as Excel |
| `POST` | `/api/jd/parse` | Parse a JD document to plain text |

### Example: Create session and analyze

```bash
# 1. Create session
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"jobTitle":"Software Engineer","jobDescription":"5+ years React, Node.js, PostgreSQL..."}'

# 2. Upload resumes
curl -X POST http://localhost:3000/api/sessions/SESSION_ID/resumes \
  -F "resumes=@resume1.pdf" \
  -F "resumes=@resume2.pdf"

# 3. Run analysis
curl -X POST http://localhost:3000/api/sessions/SESSION_ID/analyze
```

---

## Scoring Algorithm

Each candidate receives a **match score (0–100)** from four weighted components:

| Factor | Weight | How it's calculated |
|--------|--------|---------------------|
| Skills match | 40% | Overlap between JD-required skills and resume skills |
| Experience | 30% | Years of experience vs requirements, role keyword alignment |
| Education | 15% | Degree and certification keyword matching |
| Keywords | 15% | Jaccard similarity between full resume and JD text |

The dashboard also surfaces **matching skills** and **missing skills** for quick review.

---

## Deployment

### Render

This repo includes a [`render.yaml`](render.yaml) blueprint:

1. Push the repo to GitHub.
2. In [Render](https://render.com), create a **New Blueprint**.
3. Connect the repository — Render provisions PostgreSQL and the web service.

### Vercel

1. Import the GitHub repo in [Vercel](https://vercel.com).
2. Add `DATABASE_URL` (use [Neon](https://neon.tech) or [Supabase](https://supabase.com) for Postgres).
3. Deploy.

> **Note:** File uploads on serverless platforms are ephemeral. For production, store resumes in S3, GCS, or similar object storage.

---

## Project Structure

```
resume-screener/
├── prisma/
│   └── schema.prisma       # Database models
├── src/
│   ├── app/
│   │   ├── api/            # REST API routes
│   │   ├── page.tsx        # Main UI (4-step wizard)
│   │   └── layout.tsx
│   ├── components/         # UI components
│   ├── lib/
│   │   ├── parser.ts       # Resume/JD text extraction
│   │   ├── scorer.ts       # Matching & ranking engine
│   │   └── skills.ts       # Skill extraction utilities
│   └── types/
├── uploads/                # Uploaded resume files (local)
├── docker-compose.yml      # PostgreSQL for local/production setup
├── render.yaml             # Render deployment config
└── vercel.json             # Vercel deployment config
```

---

## Troubleshooting

<details>
<summary><strong>404 on localhost:3000</strong></summary>

A stale dev server may be blocking the port. Stop it and use the production server:

```bash
# Free port 3000 (macOS/Linux)
lsof -ti :3000 | xargs kill -9

# Rebuild and start
npm run build
npm start
```

Then open **http://localhost:3001**.
</details>

<details>
<summary><strong>EMFILE / too many open files (dev mode)</strong></summary>

Use polling-based file watching (already configured in `npm run dev`):

```bash
WATCHPACK_POLLING=true npm run dev
```

Or run the production build instead: `npm run build && npm start`.
</details>

<details>
<summary><strong>Database connection errors</strong></summary>

- **SQLite (default):** Ensure `DATABASE_URL="file:./dev.db"` and run `npm run db:push`.
- **PostgreSQL:** Confirm the server is running and `DATABASE_URL` is correct.
</details>

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Generate Prisma client and build for production |
| `npm start` | Start production server |
| `npm run db:push` | Sync Prisma schema to database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run lint` | Run ESLint |

---

## Contributing

Contributions are welcome. Please open an issue or submit a pull request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the [MIT License](LICENSE).

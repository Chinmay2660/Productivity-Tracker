# GrowthHub

A full-stack questions and accountability tracker for study groups preparing for interviews. Built with Next.js 16, MongoDB, and Tailwind CSS.

## What it does

When you open the app, you immediately see:

- **Interview countdown** — days and hours until your interview
- **Interview readiness score** — calculated from topic completion, confidence, tasks, mock scores, and study streak
- **Today's focus plan** — auto-generated daily study priorities
- **Weak areas** — subjects and topics needing attention
- **Group accountability** — member readiness, study hours, and task completion

## Features

| Area | Capabilities |
|------|-------------|
| **Dashboard** | Countdown, readiness ring, today's plan, weak areas, group leaderboard |
| **Subjects** | Per-subject completion %, confidence, revision schedule |
| **Topics** | Status tracking (Not Started → Interview Ready), confidence levels |
| **Tasks** | Priority-based task management with completion tracking |
| **Interview Plan** | Auto-generated 14-day preparation timeline |
| **Groups** | Create/join with codes (`SWITCH-XXXXX`), member roles (owner/admin/member) |
| **Revision** | Smart revision queue based on weak confidence and spaced repetition |
| **Focus Timer** | Pomodoro-style sessions linked to subjects/topics |
| **Mock Interviews** | Log scores, weaknesses, auto-flag topics for revision |
| **Analytics** | Study hours, subject completion, mock score trends |
| **Settings** | Theme (light/dark/system), study preferences |

## Getting Started

```bash
npm install
cp .env.example .env.local
# Add your MongoDB URI to .env.local
npm run dev
```

Open [http://localhost:4000](http://localhost:4000). You'll be guided through onboarding.

## Tech Stack

Next.js 16 · MongoDB/Mongoose · Tailwind CSS · Recharts · react-hot-toast

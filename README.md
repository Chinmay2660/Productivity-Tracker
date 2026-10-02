# Technical Productivity Tracker

A full-stack productivity tracker for a small group of people practicing technical subjects
(DSA, JavaScript Problem Solving, System Design, and any custom subject added later).

Built with **Next.js (App Router) + TypeScript + MongoDB + Mongoose + Tailwind CSS**.

## Architecture Summary

- **People** and **Categories/Subjects** are stored in their own MongoDB collections — nothing
  is hardcoded. Adding a person or a subject from the UI immediately makes it available across
  the dashboard, filters, statistics, and analytics.
- **Tasks** (questions) store only `date`, `categoryId`, optional `content`, optional `link`.
- **Progress** is a separate collection keyed by `(taskId, personId)`, because status is
  per-person, not global — the same question can be `DONE` for one person and `NOT_STARTED`
  for another.
- Dashboard columns, filters, statistics, and analytics charts are all derived at request time
  from whatever people/categories currently exist in the database.

## Prerequisites

- Node.js 20+
- A running MongoDB instance (local or Atlas)

## Setup

```bash
npm install
cp .env.example .env.local
# edit .env.local and set MONGODB_URI
```

## Seed initial data

Seeds 3 people (Person 1–3) and 3 categories (DSA, JavaScript Problem Solving, System Design).
Safe to re-run — it skips anything that already exists.

```bash
npm run seed
```

## Run the app

```bash
npm run dev
```

Visit http://localhost:3000 — it redirects to `/dashboard`.

## Project Structure

```
src/
  app/
    dashboard/        Main productivity dashboard
    questions/        Full questions list with filters
    categories/        Manage subjects
    people/            Manage people
    analytics/          Charts and trends
    api/
      people/
      categories/
      tasks/
      progress/
      dashboard/
      analytics/
  components/
    dashboard/
    questions/
    categories/
    people/
    common/
  lib/
    mongodb.ts         Cached Mongoose connection
    utils.ts           Shared formatting/status helpers
    api.ts             Client-side fetch helpers
  models/
    Person.ts
    Category.ts
    Task.ts
    Progress.ts
  types/
scripts/
  seed.ts
```

## API Reference

| Resource | Endpoints |
|---|---|
| People | `GET/POST /api/people`, `PATCH/DELETE /api/people/:id` |
| Categories | `GET/POST /api/categories`, `PATCH/DELETE /api/categories/:id` |
| Tasks | `GET/POST /api/tasks`, `GET/PATCH/DELETE /api/tasks/:id` |
| Progress | `GET/POST /api/progress`, `PATCH/DELETE /api/progress/:id` |
| Dashboard | `GET /api/dashboard?start=&end=` |
| Analytics | `GET /api/analytics` |

`POST /api/tasks` accepts either a single question (`content`/`link`) or a bulk `questions: []`
array for the same date + subject, plus an `assignTo: personId[]` array to create progress rows
for each assigned person.

## Status Values

`NOT_STARTED` (red) → `IN_PROGRESS` (yellow) → `DONE` (green) → `REVISED` (pink)

## Notes

- No category or person count is hardcoded anywhere in the code — the seed data is just a
  starting point.
- All data is persisted in MongoDB via Mongoose; there is no mock/static data path.

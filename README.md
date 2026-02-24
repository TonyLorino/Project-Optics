<p align="center">
  <img src="public/project-optics-wordmark.svg" alt="Project Optics" width="360" />
</p>

<p align="center">
  A lightweight project-management dashboard that surfaces Azure DevOps metrics,
  work-item status, and sprint health.
</p>

---

## Features

- **Dashboard** — KPI cards with sprint-over-sprint trend badges (active projects, active items, story points, velocity, cycle time), sprint burndown, velocity chart, team workload, state & type distribution, sortable work-items table, and a Gantt timeline with inherited end-date resolution
- **Watch List** — RAID (Risk, Assumption, Issue, Dependency) tracking with six charts (type distribution, age distribution, state donut, top assignees, created vs resolved trend, project breakdown), metric cards, and a sortable table with parent work-item context
- **Reports** — per-project exportable reports with accomplishments, look-ahead, milestones, and watch list items; single-project enforcement with multi-area-path support
- **Filters** — slice data by project, area path, sprint, resource, date range, and state
- **URL Deep-Linking** — filter state is encoded in the URL hash for shareable, bookmarkable views
- **Code Splitting** — pages are lazily loaded via `React.lazy` + `Suspense` for faster initial load

## Tech Stack

| Layer     | Technology                    |
| --------- | ----------------------------- |
| Framework | React 19 · TypeScript · Vite 7 |
| Styling   | Tailwind CSS v4 · shadcn/ui  |
| Data      | TanStack Query v5             |
| State     | Zustand (persist middleware)  |
| Charts    | Recharts                      |
| HTTP      | Axios (via Vite dev proxy)    |
| Storage   | localStorage (Supabase-ready) |

## Prerequisites

- **Node.js** >= 18
- An **Azure DevOps** Personal Access Token (PAT) with _Work Items: Read_ and _Project and Team: Read_ scopes

## Getting Started

```bash
git clone https://github.com/TonyLorino/Project-Optics.git
cd Project-Optics
npm install
```

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

| Variable                | Description                    |
| ----------------------- | ------------------------------ |
| `VITE_ADO_ORGANIZATION` | Azure DevOps organization name |
| `VITE_ADO_PAT`          | Personal Access Token          |

Start the dev server:

```bash
npm run dev
```

## Available Scripts

| Command         | Description                          |
| --------------- | ------------------------------------ |
| `npm run dev`   | Start Vite dev server with HMR       |
| `npm run build` | Type-check and produce production build |
| `npm run lint`  | Run ESLint                           |
| `npm run preview` | Preview the production build locally |

## Deploy to Vercel

The repo includes a Vercel serverless proxy (`api/ado.ts`) that replaces the
Vite dev proxy in production.

1. Install the [Vercel CLI](https://vercel.com/docs/cli) and link the project:

```bash
vercel link
```

2. Add the following **Environment Variables** in the Vercel dashboard
   (Settings > Environment Variables). These are server-only -- do **not** prefix
   with `VITE_`:

| Variable           | Description                    |
| ------------------ | ------------------------------ |
| `ADO_ORGANIZATION` | Azure DevOps organization name |
| `ADO_PAT`          | Personal Access Token          |

3. Deploy:

```bash
vercel --prod
```

The `VITE_ADO_*` variables in `.env.local` are still used for local
development (`npm run dev`). The serverless function reads the non-prefixed
versions so the PAT is never bundled into client-side JavaScript.

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for directory layout, ADO integration details,
the storage-adapter pattern, and the Supabase migration path.

## License

This project is not yet licensed. A license will be added in a future release.

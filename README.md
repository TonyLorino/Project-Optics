<p align="center">
  <img src="public/project-optics-wordmark.svg" alt="Project Optics" width="360" />
</p>

<p align="center">
  A lightweight project-management dashboard that surfaces Azure DevOps metrics,
  work-item status, and sprint health.
</p>

---

## Features

- **Dashboard** — real-time metrics, work-item breakdowns, sprint burndown, and velocity charts
- **Watch List** — RAID log (Risk, Assumption, Issue, Dependency) tracking linked to ADO work items
- **Reports** — exportable sprint reports and health summaries
- **Filters** — slice data by project, sprint, resource, and state

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

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for directory layout, ADO integration details,
the storage-adapter pattern, and the Supabase migration path.

## License

This project is not yet licensed. A license will be added in a future release.

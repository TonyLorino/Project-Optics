# Project Optics — Architecture

## Overview

Project Optics is a lightweight project management dashboard that surfaces
Azure DevOps metrics, work-item status, and sprint health.

## Tech Stack

| Layer       | Technology                       |
|-------------|----------------------------------|
| Framework   | React 19 · TypeScript · Vite 7   |
| Styling     | Tailwind CSS v4 · shadcn/ui      |
| Data        | TanStack Query v5                |
| State       | Zustand (persist middleware)      |
| Charts      | Recharts                         |
| HTTP        | Axios (via Vite dev proxy)       |
| Storage     | localStorage (Supabase-ready)    |

## Directory Map

```
src/
├── components/
│   ├── ui/              # shadcn/ui primitives (auto-generated)
│   ├── dashboard/       # Dashboard page widgets (charts, tables, metrics)
│   ├── watchlist/       # Watch List page widgets (RaidTable, type chart, age chart)
│   ├── reports/         # Reports page widgets (ReportSlide)
│   ├── filters/         # Project / Sprint / State selectors
│   ├── layout/          # AppLayout, Sidebar, Header
│   └── ErrorBoundary.tsx
├── hooks/               # React Query + derived-data hooks
├── lib/                 # Utilities, constants, and helpers
├── pages/               # Route-level page components
│   ├── Dashboard.tsx
│   ├── WatchList.tsx
│   └── Reports.tsx
├── services/
│   ├── azureDevOps.ts   # Axios client (timeout, retry interceptor)
│   └── api/             # Per-resource API modules
├── storage/             # StorageAdapter interface + impls
├── store/               # Zustand stores
└── types/               # TypeScript interfaces
```

## Pages

- **Dashboard** — Five KPI cards (Active Projects, Active Items, Story Points, Avg Velocity, Avg Cycle Time) with enriched subtitles, sprint burndown, velocity chart, team workload, state distribution, work-item type breakdown, sortable/paginated work-items table, and a Gantt timeline that inherits end dates from the parent chain when an item lacks its own.
- **Watch List** — Tracks Risks, Issues, Dependencies, and Decisions (RAID items) linked to ADO work items. Includes Watch List Distribution (type) and Watch List Age (age-bucket bar chart) in a two-column layout, metric cards, and a sortable table with parent work-item context.
- **Reports** — Per-project exportable sprint reports with accomplishments, look-ahead, milestones, and linked watch list items. Enforces single-project selection (shows an info box when multiple projects are selected). Multiple area paths of the same project are supported, with comma-separated area names in the title. Supports image export via offscreen slide rendering.

## ADO Integration

- All requests go through `/api/ado/*`, which is proxied to `dev.azure.com`.
- **Local dev:** The Vite dev-server proxy (`vite.config.ts`) rewrites the path and injects the PAT from `VITE_ADO_PAT` in `.env.local`.
- **Production (Vercel):** A serverless function (`api/ado.ts`) performs the same rewrite and auth injection, reading `ADO_ORGANIZATION` and `ADO_PAT` from Vercel environment variables. The PAT is never bundled into client-side JavaScript.
- WIQL queries are issued per-project in parallel using `Promise.allSettled` so a single project failure does not crash the entire dashboard.
- Work-item detail fetches are batched in groups of 200 (ADO max).
- The Axios client enforces a 30-second timeout and retries 429 (rate-limit) responses with exponential backoff (up to 2 retries).
- WIQL query inputs are sanitized (single-quote escaping) to prevent injection.

## Gantt Timeline — Inherited End Dates

The Gantt chart determines bar end dates with a parent-chain lookup:
1. Use the item's own `closedDate` or `targetDate` if present.
2. Otherwise walk up the `parentId` chain (with cycle guard) to find the first ancestor with a viable end date.
3. Fall back to today only if no ancestor has a date either.

This ensures RAID items, tasks, and other leaf nodes inherit meaningful timelines from their parent features or user stories.

## Dashboard KPIs

Five metric cards powered by `useMetrics`:
- **Active Projects** — count of selected/visible projects, with archived and total counts.
- **Active Items** — items in Active state, with new, resolved, and total counts.
- **Story Points** — active (in-progress) story points as the primary value, completed and all-time totals in subtitle.
- **Avg Velocity** — points per sprint over the last 6 sprints, with total completed points.
- **Avg Cycle Time** — average days from activation to close, with the number of items measured.

## Error Handling

- A top-level `ErrorBoundary` wraps the page router to catch unhandled render errors and display a recovery UI instead of a white screen.
- React Query hooks use `Promise.allSettled` for parallel fetches, returning partial results on individual failures.
- Table and chart components accept an optional `error` prop for inline error rendering.
- localStorage operations log parse errors and surface quota-exceeded errors.

## TypeScript Strictness

The project enables `noUncheckedIndexedAccess` in `tsconfig.app.json`, which
forces explicit guards on all indexed array/object access. Non-null assertions
(`!`) are avoided in favor of type predicates and inline guards.

## Storage Adapter — Supabase Migration Path

All persistence is abstracted behind `StorageAdapter` (see `src/storage/types.ts`).

### Current: localStorage

The `localStorageAdapter` in `src/storage/localStorage.ts` serialises data
to `window.localStorage` with an `optics:` key prefix.

### Future: Supabase

To migrate:

1. **Create a Supabase project** and provision the following tables:

```sql
create table projects (
  id uuid primary key,
  name text not null,
  description text,
  state text,
  visibility text,
  is_archived boolean default false,
  synced_at timestamptz default now()
);

create table work_items (
  id integer primary key,
  project_name text not null,
  title text not null,
  state text not null,
  work_item_type text not null,
  assigned_to jsonb,
  story_points numeric,
  iteration_path text,
  area_path text,
  created_date timestamptz,
  changed_date timestamptz,
  tags text,
  watch_list_id uuid references watch_list_entries(id),
  synced_at timestamptz default now()
);

create table watch_list_entries (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null, -- 'Risk' | 'Assumption' | 'Issue' | 'Dependency'
  description text,
  status text default 'Open',
  owner text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

2. **Implement `supabaseAdapter`** in `src/storage/supabase.ts`:
   - Install `@supabase/supabase-js`
   - Implement every method on the `StorageAdapter` interface
   - Use Supabase realtime subscriptions for live updates

3. **Swap the adapter** — update import in hooks/components to use
   `supabaseAdapter` instead of `localStorageAdapter`.

4. **Move the Vite proxy to a serverless function** (Vercel / Cloudflare
   Workers) to keep the PAT server-side in production.

## Environment Variables

| Variable                | Description                      |
|-------------------------|----------------------------------|
| `VITE_ADO_ORGANIZATION` | Azure DevOps organization name   |
| `VITE_ADO_PAT`          | Personal Access Token            |

Store these in `.env.local` (git-ignored).

## Future Work

- **Supabase backend** — Replace localStorage with Supabase (see migration path above) to enable multi-user persistence and real-time collaboration.
- **Settings page** — PAT management, theme preferences, notification config.
- **% Complete metric** — Progress percentage calculation on the Reports page (currently commented out pending rework).
- **Additional Watch List charts** — Candidates include state breakdown, assignee distribution, created-vs-resolved trend, and per-project distribution.

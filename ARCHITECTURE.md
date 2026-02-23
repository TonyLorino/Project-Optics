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
│   ├── watchlist/       # Watch List page widgets (RaidTable, type chart)
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

- **Dashboard** — Real-time metrics, sprint burndown, velocity chart, team workload, state distribution, work-item type breakdown, and a sortable/paginated work-items table with Gantt timeline view.
- **Watch List** — Tracks Risks, Issues, Dependencies, and Decisions (RAID items) linked to ADO work items. Includes type distribution chart, metric cards, and a sortable table with parent work-item context.
- **Reports** — Per-project exportable sprint reports with accomplishments, look-ahead, milestones, and linked watch list items. Supports image export via offscreen slide rendering.

## ADO Integration

- All requests go through a Vite dev-server proxy (`/api/ado → dev.azure.com`).
- The organization name is read from `VITE_ADO_ORGANIZATION`; the PAT is injected server-side and never appears in browser network traffic.
- WIQL queries are issued per-project in parallel using `Promise.allSettled` so a single project failure does not crash the entire dashboard.
- Work-item detail fetches are batched in groups of 200 (ADO max).
- The Axios client enforces a 30-second timeout and retries 429 (rate-limit) responses with exponential backoff (up to 2 retries).
- WIQL query inputs are sanitized (single-quote escaping) to prevent injection.

> **Production note:** The Vite proxy only exists during `npm run dev`. A
> production build produces static files with no server to forward API calls.
> Before deploying, you must set up a backend proxy (serverless function, BFF,
> etc.) that rewrites `/api/ado/*` to `dev.azure.com/<org>/*` and attaches the
> PAT header. See the Supabase migration path below for the recommended approach.

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
- **Production proxy** — Deploy a serverless function or BFF to proxy ADO requests in production builds.
- **Settings page** — PAT management, theme preferences, notification config.
- **% Complete metric** — Progress percentage calculation on the Reports page (currently disabled pending rework).

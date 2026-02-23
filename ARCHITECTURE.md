# Project Optics — Architecture

## Overview

Project Optics is a lightweight project management dashboard that surfaces
Azure DevOps metrics, work-item status, and sprint health for the
Corporate Data Office organization.

## Tech Stack

| Layer       | Technology                       |
|-------------|----------------------------------|
| Framework   | React 18 + TypeScript + Vite     |
| Styling     | Tailwind CSS v4 + shadcn/ui      |
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
│   ├── dashboard/       # Dashboard-specific widgets
│   ├── filters/         # Project / Sprint selectors
│   └── layout/          # AppLayout, Sidebar, Header
├── hooks/               # React Query + derived-data hooks
├── lib/                 # Utilities and constants
├── pages/               # Route-level page components
├── services/
│   ├── azureDevOps.ts   # Axios client for ADO
│   └── api/             # Per-resource API modules
├── storage/             # StorageAdapter interface + impls
├── store/               # Zustand stores
└── types/               # TypeScript interfaces
```

## ADO Integration

- All requests go through a Vite dev-server proxy (`/api/ado → dev.azure.com`).
- The PAT is injected server-side; it never appears in browser network traffic.
- WIQL queries are issued per-project in parallel; results are merged client-side.
- Work-item detail fetches are batched in groups of 200 (ADO max).

> **Production note:** The Vite proxy only exists during `npm run dev`. A
> production build produces static files with no server to forward API calls.
> Before deploying, you must set up a backend proxy (serverless function, BFF,
> etc.) that rewrites `/api/ado/*` to `dev.azure.com/<org>/*` and attaches the
> PAT header. See the Supabase migration path below for the recommended approach.

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

## Future Features

- **Watch List**: RAID log linked to ADO work items via `watch_list_id`.
- **Reports**: Exportable sprint reports and health summaries.
- **Settings**: PAT management, theme preferences, notification config.

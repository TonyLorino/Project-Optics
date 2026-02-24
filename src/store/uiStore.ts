import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ActivePage = 'dashboard' | 'reports' | 'watchlist'

interface UIState {
  // Navigation
  activePage: ActivePage

  // Filters
  selectedProjects: string[]
  selectedSprint: string | null
  selectedResource: string | null
  showArchived: boolean
  dateRange: { from: string; to: string } | null

  // Appearance
  darkMode: boolean

  // Sync (non-persisted, set by active page)
  syncLastUpdated: Date | undefined
  syncIsFetching: boolean
  syncRefetch: (() => void) | null

  // Actions
  setActivePage: (page: ActivePage) => void
  setSelectedProjects: (projects: string[]) => void
  setSelectedSprint: (sprint: string | null) => void
  setSelectedResource: (resource: string | null) => void
  setDateRange: (range: { from: string; to: string } | null) => void
  toggleArchived: () => void
  toggleDarkMode: () => void
  setSyncState: (lastUpdated: Date | undefined, isFetching: boolean, refetch: () => void) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      activePage: 'dashboard',
      selectedProjects: [],
      selectedSprint: null,
      selectedResource: null,
      showArchived: false,
      dateRange: null,
      darkMode: typeof window !== 'undefined'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : false,
      syncLastUpdated: undefined,
      syncIsFetching: false,
      syncRefetch: null,

      setActivePage: (page) => set({ activePage: page }),
      setSelectedProjects: (projects) => set({ selectedProjects: projects }),
      setSelectedSprint: (sprint) => set({ selectedSprint: sprint }),
      setSelectedResource: (resource) => set({ selectedResource: resource }),
      setDateRange: (range) => set({ dateRange: range }),
      toggleArchived: () =>
        set((s) => ({ showArchived: !s.showArchived })),
      toggleDarkMode: () =>
        set((s) => ({ darkMode: !s.darkMode })),
      setSyncState: (lastUpdated, isFetching, refetch) =>
        set({ syncLastUpdated: lastUpdated, syncIsFetching: isFetching, syncRefetch: refetch }),
    }),
    {
      name: 'optics:ui-store',
      partialize: (state) => ({
        activePage: state.activePage,
        selectedProjects: state.selectedProjects,
        selectedSprint: state.selectedSprint,
        selectedResource: state.selectedResource,
        showArchived: state.showArchived,
        dateRange: state.dateRange,
        darkMode: state.darkMode,
      }),
    },
  ),
)

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ActivePage = 'dashboard' | 'reports' | 'watchlist'
export type ViewMode = 'area' | 'vertical'

interface UIState {
  // Navigation
  activePage: ActivePage

  // View mode
  viewMode: ViewMode

  // Filters
  selectedProjects: string[]
  selectedVerticals: string[]
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
  setViewMode: (mode: ViewMode) => void
  setSelectedProjects: (projects: string[]) => void
  setSelectedVerticals: (verticals: string[]) => void
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
      viewMode: 'area',
      selectedProjects: [],
      selectedVerticals: [],
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
      setViewMode: (mode) => set({ viewMode: mode }),
      setSelectedProjects: (projects) => set({ selectedProjects: projects }),
      setSelectedVerticals: (verticals) => set({ selectedVerticals: verticals }),
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
        viewMode: state.viewMode,
        selectedProjects: state.selectedProjects,
        selectedVerticals: state.selectedVerticals,
        selectedSprint: state.selectedSprint,
        selectedResource: state.selectedResource,
        showArchived: state.showArchived,
        dateRange: state.dateRange,
        darkMode: state.darkMode,
      }),
    },
  ),
)

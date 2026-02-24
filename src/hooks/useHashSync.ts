import { useEffect, useRef } from 'react'
import { useUIStore, type ActivePage } from '@/store/uiStore'

const VALID_PAGES = new Set<ActivePage>(['dashboard', 'reports', 'watchlist'])

function parseHash(): Record<string, string> {
  const raw = window.location.hash.slice(1)
  if (!raw) return {}
  const params: Record<string, string> = {}
  for (const pair of raw.split('&')) {
    const eqIdx = pair.indexOf('=')
    if (eqIdx === -1) continue
    const key = decodeURIComponent(pair.slice(0, eqIdx))
    const value = decodeURIComponent(pair.slice(eqIdx + 1))
    params[key] = value
  }
  return params
}

function buildHash(state: {
  activePage: ActivePage
  selectedProjects: string[]
  selectedSprint: string | null
  selectedResource: string | null
  showArchived: boolean
  dateRange: { from: string; to: string } | null
}): string {
  const parts: string[] = []
  parts.push(`page=${encodeURIComponent(state.activePage)}`)
  if (state.selectedProjects.length > 0) {
    parts.push(`projects=${state.selectedProjects.map(encodeURIComponent).join(',')}`)
  }
  if (state.selectedSprint) {
    parts.push(`sprint=${encodeURIComponent(state.selectedSprint)}`)
  }
  if (state.selectedResource) {
    parts.push(`resource=${encodeURIComponent(state.selectedResource)}`)
  }
  if (state.showArchived) {
    parts.push('archived=1')
  }
  if (state.dateRange) {
    parts.push(`from=${encodeURIComponent(state.dateRange.from)}`)
    parts.push(`to=${encodeURIComponent(state.dateRange.to)}`)
  }
  return parts.join('&')
}

export function useHashSync(): void {
  const suppressRef = useRef(false)

  useEffect(() => {
    const params = parseHash()
    if (Object.keys(params).length === 0) return

    const store = useUIStore.getState()

    if (params.page && VALID_PAGES.has(params.page as ActivePage)) {
      store.setActivePage(params.page as ActivePage)
    }
    if (params.projects) {
      store.setSelectedProjects(params.projects.split(',').map(decodeURIComponent))
    }
    if ('sprint' in params) {
      store.setSelectedSprint(params.sprint || null)
    }
    if ('resource' in params) {
      store.setSelectedResource(params.resource || null)
    }
    if (params.archived === '1') {
      if (!store.showArchived) store.toggleArchived()
    }
    if (params.from && params.to) {
      store.setDateRange({ from: params.from, to: params.to })
    }
  }, [])

  useEffect(() => {
    const unsubscribe = useUIStore.subscribe((state) => {
      suppressRef.current = true
      const hash = buildHash(state)
      window.history.replaceState(null, '', `#${hash}`)
      queueMicrotask(() => { suppressRef.current = false })
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    function onHashChange() {
      if (suppressRef.current) return
      const params = parseHash()
      const store = useUIStore.getState()

      if (params.page && VALID_PAGES.has(params.page as ActivePage)) {
        store.setActivePage(params.page as ActivePage)
      }
      if (params.projects) {
        store.setSelectedProjects(params.projects.split(',').map(decodeURIComponent))
      }
      if ('sprint' in params) {
        store.setSelectedSprint(params.sprint || null)
      }
      if ('resource' in params) {
        store.setSelectedResource(params.resource || null)
      }
    }

    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
}

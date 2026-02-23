import { STORAGE_PREFIX } from '@/lib/constants'
import type { StorageAdapter } from './types'
import type { Project } from '@/types/project'
import type { WorkItem } from '@/types/workItem'
import type { Sprint } from '@/types/sprint'

function key(suffix: string): string {
  return `${STORAGE_PREFIX}${suffix}`
}

function write(k: string, value: unknown): void {
  try {
    window.localStorage.setItem(k, JSON.stringify(value))
  } catch {
    console.warn(`[storage] Failed to write key "${k}"`)
  }
}

function read<T>(k: string): T | null {
  try {
    const raw = window.localStorage.getItem(k)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export const localStorageAdapter: StorageAdapter = {
  // ── Projects ─────────────────────────────────────────────
  async saveProjects(projects: Project[]) {
    write(key('projects'), projects)
  },
  async getProjects() {
    return read<Project[]>(key('projects'))
  },

  // ── Work Items ───────────────────────────────────────────
  async saveWorkItems(projectName: string, items: WorkItem[]) {
    write(key(`workitems:${projectName}`), items)
  },
  async getWorkItems(projectName: string) {
    return read<WorkItem[]>(key(`workitems:${projectName}`))
  },

  // ── Sprints ──────────────────────────────────────────────
  async saveSprints(projectName: string, sprints: Sprint[]) {
    write(key(`sprints:${projectName}`), sprints)
  },
  async getSprints(projectName: string) {
    return read<Sprint[]>(key(`sprints:${projectName}`))
  },

  // ── Sync timestamp ───────────────────────────────────────
  async saveSyncTimestamp(timestamp: Date) {
    write(key('sync-timestamp'), timestamp.toISOString())
  },
  async getLastSync() {
    const iso = read<string>(key('sync-timestamp'))
    return iso ? new Date(iso) : null
  },

  // ── Housekeeping ─────────────────────────────────────────
  async clear() {
    const toRemove: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i)
      if (k?.startsWith(STORAGE_PREFIX)) toRemove.push(k)
    }
    toRemove.forEach((k) => window.localStorage.removeItem(k))
  },
}

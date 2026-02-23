import type { Project } from '@/types/project'
import type { WorkItem } from '@/types/workItem'
import type { Sprint } from '@/types/sprint'

/**
 * Abstract storage interface.
 *
 * The localStorage implementation is used for the POC.
 * Swap in a Supabase implementation later by providing
 * a new module that satisfies this contract.
 */
export interface StorageAdapter {
  // Projects
  saveProjects(projects: Project[]): Promise<void>
  getProjects(): Promise<Project[] | null>

  // Work items (keyed per project)
  saveWorkItems(projectName: string, items: WorkItem[]): Promise<void>
  getWorkItems(projectName: string): Promise<WorkItem[] | null>

  // Sprints (keyed per project)
  saveSprints(projectName: string, sprints: Sprint[]): Promise<void>
  getSprints(projectName: string): Promise<Sprint[] | null>

  // Sync bookkeeping
  saveSyncTimestamp(timestamp: Date): Promise<void>
  getLastSync(): Promise<Date | null>

  // Housekeeping
  clear(): Promise<void>
}

import type { WorkItem } from '@/types/workItem'

const SEPARATOR = '\\'

export interface ParsedSelections {
  /** Unique project names to fetch work items from */
  projectNames: string[]
  /**
   * Map of project name -> selected area paths (full ADO format, e.g. "Project\Area").
   * Projects not in this map have no area filter (show all items).
   */
  areaFilters: Map<string, string[]>
}

/**
 * Parse the selectedProjects array into fetch targets and area filters.
 *
 * Entries without a backslash are whole-project selections.
 * Entries with a backslash (e.g. "Digital Nexus\Contracts") are area-specific.
 */
export function parseSelections(selections: string[]): ParsedSelections {
  const projectSet = new Set<string>()
  const wholeProjects = new Set<string>()
  const areaMap = new Map<string, string[]>()

  for (const entry of selections) {
    const sepIdx = entry.indexOf(SEPARATOR)
    if (sepIdx === -1) {
      projectSet.add(entry)
      wholeProjects.add(entry)
    } else {
      const projectName = entry.slice(0, sepIdx)
      projectSet.add(projectName)
      if (!areaMap.has(projectName)) areaMap.set(projectName, [])
      areaMap.get(projectName)!.push(entry)
    }
  }

  // Remove area filters for projects that also have a whole-project selection
  for (const proj of wholeProjects) {
    areaMap.delete(proj)
  }

  return {
    projectNames: [...projectSet],
    areaFilters: areaMap,
  }
}

/**
 * Extract unique project names from a selections array.
 */
export function getProjectsToFetch(selections: string[]): string[] {
  const projects = new Set<string>()
  for (const entry of selections) {
    const sepIdx = entry.indexOf(SEPARATOR)
    projects.add(sepIdx === -1 ? entry : entry.slice(0, sepIdx))
  }
  return [...projects]
}

/**
 * Filter work items based on area-path selections.
 * Items from projects with no area filter pass through unchanged.
 * Items from projects with area filters must match one of the selected area paths.
 */
export function filterByAreaSelections(
  workItems: WorkItem[],
  areaFilters: Map<string, string[]>,
): WorkItem[] {
  if (areaFilters.size === 0) return workItems

  return workItems.filter((item) => {
    const filters = areaFilters.get(item.projectName)
    if (!filters) return true
    return filters.some((f) => item.areaPath === f)
  })
}

/**
 * Extract the area name portion from a selection entry.
 * Returns null for whole-project entries.
 */
export function getAreaNameFromSelection(selection: string): string | null {
  const sepIdx = selection.indexOf(SEPARATOR)
  if (sepIdx === -1) return null
  return selection.slice(sepIdx + 1)
}

/**
 * Extract the project name from a selection entry (works for both formats).
 */
export function getProjectNameFromSelection(selection: string): string {
  const sepIdx = selection.indexOf(SEPARATOR)
  return sepIdx === -1 ? selection : selection.slice(0, sepIdx)
}

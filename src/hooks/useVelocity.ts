import { useMemo } from 'react'
import type { WorkItem } from '@/types/workItem'
import type { Sprint } from '@/types/sprint'
import type { VelocityDataPoint } from '@/types/metrics'

/**
 * Compute velocity data for the last N sprints.
 *
 * Groups closed/resolved work items by their iteration path
 * and sums story points.
 */
export function useVelocity(
  workItems: WorkItem[],
  sprints: Sprint[],
  lastN = 6,
): { velocityData: VelocityDataPoint[]; averageVelocity: number } {
  return useMemo(() => {
    // Sort sprints by start date descending, take last N past/current
    const sortedSprints = [...sprints]
      .filter((s) => s.timeFrame === 'past' || s.timeFrame === 'current')
      .sort((a, b) => {
        const da = a.startDate ? new Date(a.startDate).getTime() : 0
        const db = b.startDate ? new Date(b.startDate).getTime() : 0
        return db - da
      })
      .slice(0, lastN)
      .reverse() // Chronological order for chart

    const completed = workItems.filter(
      (w) => w.state === 'Closed' || w.state === 'Resolved',
    )

    const velocityData: VelocityDataPoint[] = sortedSprints.map((sprint) => {
      const sprintItems = completed.filter(
        (w) => w.iterationPath === sprint.path,
      )

      const projectBreakdown: Record<string, number> = {}
      let completedPoints = 0
      for (const item of sprintItems) {
        const pts = item.storyPoints ?? 0
        completedPoints += pts
        projectBreakdown[item.projectName] =
          (projectBreakdown[item.projectName] ?? 0) + pts
      }

      return {
        sprintName: sprint.name,
        sprintPath: sprint.path,
        completedPoints,
        completedItems: sprintItems.length,
        projectBreakdown,
      }
    })

    const totalPoints = velocityData.reduce(
      (sum, d) => sum + d.completedPoints,
      0,
    )
    const averageVelocity =
      velocityData.length > 0
        ? Math.round((totalPoints / velocityData.length) * 10) / 10
        : 0

    return { velocityData, averageVelocity }
  }, [workItems, sprints, lastN])
}

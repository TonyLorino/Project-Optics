import { useMemo } from 'react'
import { differenceInDays, parseISO } from 'date-fns'
import type { WorkItem } from '@/types/workItem'
import type {
  DashboardMetrics,
  StateDistributionEntry,
  WorkTypeDistributionEntry,
} from '@/types/metrics'

/**
 * Derive dashboard KPIs from a flat list of work items.
 */
export function useMetrics(workItems: WorkItem[]): DashboardMetrics {
  return useMemo(() => {
    const newCount = workItems.filter((w) => w.state === 'New').length
    const activeCount = workItems.filter((w) => w.state === 'Active').length
    const resolvedCount = workItems.filter((w) => w.state === 'Resolved').length
    const closedCount = workItems.filter((w) => w.state === 'Closed').length
    const removedCount = workItems.filter((w) => w.state === 'Removed').length

    const totalStoryPoints = workItems.reduce(
      (sum, w) => sum + (w.storyPoints ?? 0),
      0,
    )
    const completedItems = workItems.filter(
      (w) => w.state === 'Closed' || w.state === 'Resolved',
    )
    const completedStoryPoints = completedItems.reduce(
      (sum, w) => sum + (w.storyPoints ?? 0),
      0,
    )

    // Average cycle time: days between activation and close
    const cycleTimes = workItems
      .filter((w) => w.activatedDate && w.closedDate)
      .map((w) =>
        differenceInDays(parseISO(w.closedDate!), parseISO(w.activatedDate!)),
      )
      .filter((d) => d >= 0)

    const averageCycleTimeDays =
      cycleTimes.length > 0
        ? cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length
        : 0

    return {
      activeItemCount: activeCount,
      totalStoryPoints,
      completedStoryPoints,
      velocityAverage: 0, // calculated by useVelocity
      averageCycleTimeDays: Math.round(averageCycleTimeDays),
      totalItems: workItems.length,
      newCount,
      resolvedCount,
      closedCount,
      removedCount,
    }
  }, [workItems])
}

/**
 * Build state distribution data for charts.
 */
export function useStateDistribution(
  workItems: WorkItem[],
): StateDistributionEntry[] {
  return useMemo(() => {
    const total = workItems.length || 1
    const counts: Record<string, number> = {}
    for (const w of workItems) {
      counts[w.state] = (counts[w.state] ?? 0) + 1
    }
    return Object.entries(counts)
      .map(([state, count]) => ({
        state,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count)
  }, [workItems])
}

/**
 * Build work-item-type distribution data for charts.
 */
export function useWorkTypeDistribution(
  workItems: WorkItem[],
): WorkTypeDistributionEntry[] {
  return useMemo(() => {
    const total = workItems.length || 1
    const counts: Record<string, number> = {}
    for (const w of workItems) {
      counts[w.workItemType] = (counts[w.workItemType] ?? 0) + 1
    }
    return Object.entries(counts)
      .map(([type, count]) => ({
        type,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count)
  }, [workItems])
}

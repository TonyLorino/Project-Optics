import { useMemo } from 'react'
import { differenceInDays, parseISO } from 'date-fns'
import type { WorkItem } from '@/types/workItem'
import type { Sprint } from '@/types/sprint'

export interface SprintTrend {
  value: number
  label: string
}

export interface SprintTrends {
  activeItems?: SprintTrend
  storyPoints?: SprintTrend
  velocity?: SprintTrend
  cycleTime?: SprintTrend
}

function pctChange(current: number, previous: number): number | undefined {
  if (previous === 0) return current > 0 ? 100 : undefined
  return Math.round(((current - previous) / previous) * 100)
}

export function useSprintTrends(
  workItems: WorkItem[],
  sprints: Sprint[],
): SprintTrends {
  return useMemo(() => {
    const sorted = [...sprints]
      .filter((s) => s.timeFrame === 'past' || s.timeFrame === 'current')
      .sort((a, b) => {
        const da = a.startDate ? new Date(a.startDate).getTime() : 0
        const db = b.startDate ? new Date(b.startDate).getTime() : 0
        return db - da
      })

    const currentSprint = sorted[0]
    const previousSprint = sorted[1]
    if (!currentSprint || !previousSprint) return {}

    const currentPaths = new Set(
      sprints
        .filter((s) => s.timeFrame === 'current')
        .map((s) => s.path),
    )
    const prevPaths = new Set([previousSprint.path])

    const currentItems = workItems.filter((wi) => currentPaths.has(wi.iterationPath))
    const prevItems = workItems.filter((wi) => prevPaths.has(wi.iterationPath))

    const label = 'vs prev sprint'

    const curActive = currentItems.filter((w) => w.state === 'Active').length
    const prevActive = prevItems.filter((w) => w.state === 'Active').length
    const activeItemsDelta = pctChange(curActive, prevActive)

    const curSP = currentItems
      .filter((w) => w.state === 'Active')
      .reduce((s, w) => s + (w.storyPoints ?? 0), 0)
    const prevSP = prevItems
      .filter((w) => w.state === 'Active')
      .reduce((s, w) => s + (w.storyPoints ?? 0), 0)
    const spDelta = pctChange(curSP, prevSP)

    const closed = (items: WorkItem[]) =>
      items.filter((w) => w.state === 'Closed' || w.state === 'Resolved')
    const curVel = closed(currentItems).reduce((s, w) => s + (w.storyPoints ?? 0), 0)
    const prevVel = closed(prevItems).reduce((s, w) => s + (w.storyPoints ?? 0), 0)
    const velDelta = pctChange(curVel, prevVel)

    const avgCycle = (items: WorkItem[]) => {
      const times = items
        .filter((w): w is typeof w & { activatedDate: string; closedDate: string } =>
          w.activatedDate != null && w.closedDate != null,
        )
        .map((w) => differenceInDays(parseISO(w.closedDate), parseISO(w.activatedDate)))
        .filter((d) => d >= 0)
      return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0
    }
    const curCycle = avgCycle(currentItems)
    const prevCycle = avgCycle(prevItems)
    const cycleDelta = pctChange(curCycle, prevCycle)
    const cycleInverted = cycleDelta != null ? -cycleDelta : undefined

    return {
      activeItems: activeItemsDelta != null ? { value: activeItemsDelta, label } : undefined,
      storyPoints: spDelta != null ? { value: spDelta, label } : undefined,
      velocity: velDelta != null ? { value: velDelta, label } : undefined,
      cycleTime: cycleInverted != null ? { value: cycleInverted, label } : undefined,
    }
  }, [workItems, sprints])
}

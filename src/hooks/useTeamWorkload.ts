import { useMemo } from 'react'
import type { WorkItem } from '@/types/workItem'
import type { Sprint } from '@/types/sprint'

export interface TeamMemberData {
  name: string
  imageUrl?: string
  stories: number
  completedStories: number
  storyPoints: number
  velocity: number
}

/**
 * Derive per-member workload from the currently visible (filtered) work items.
 * "velocity" = completed story points in the current view (sprint/date range),
 * NOT averaged over all time.
 */
export function useTeamWorkload(
  workItems: WorkItem[],
  _sprints: Sprint[],
): TeamMemberData[] {
  return useMemo(() => {
    const stories = workItems.filter(
      (w) => w.workItemType === 'User Story' && w.assignedTo,
    )

    const memberMap = new Map<
      string,
      {
        imageUrl?: string
        stories: number
        completedStories: number
        points: number
        completedPoints: number
      }
    >()

    for (const item of stories) {
      if (!item.assignedTo) continue
      const name = item.assignedTo.displayName
      const entry = memberMap.get(name) ?? {
        imageUrl: item.assignedTo.imageUrl,
        stories: 0,
        completedStories: 0,
        points: 0,
        completedPoints: 0,
      }
      entry.stories += 1
      entry.points += item.storyPoints ?? 0

      if (item.state === 'Closed' || item.state === 'Resolved') {
        entry.completedStories += 1
        entry.completedPoints += item.storyPoints ?? 0
      }

      memberMap.set(name, entry)
    }

    const result: TeamMemberData[] = []
    for (const [name, entry] of memberMap) {
      result.push({
        name,
        imageUrl: entry.imageUrl,
        stories: entry.stories,
        completedStories: entry.completedStories,
        storyPoints: entry.points,
        velocity: entry.completedPoints,
      })
    }

    result.sort((a, b) => b.storyPoints - a.storyPoints)
    return result
  }, [workItems, _sprints])
}

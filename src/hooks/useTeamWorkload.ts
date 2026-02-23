import { useMemo } from 'react'
import type { WorkItem } from '@/types/workItem'
import type { Sprint } from '@/types/sprint'

export interface TeamMemberData {
  name: string
  imageUrl?: string
  stories: number
  storyPoints: number
  avgVelocity: number
}

/**
 * Derive per-member workload from the current sprint's user stories
 * and compute average velocity from the last 6 past/current sprints.
 */
export function useTeamWorkload(
  workItems: WorkItem[],
  sprints: Sprint[],
  lastN = 6,
): TeamMemberData[] {
  return useMemo(() => {
    // All user stories visible in the current filtered view (any state)
    const sprintStories = workItems.filter(
      (w) => w.workItemType === 'User Story' && w.assignedTo,
    )

    // Group by assignee for current sprint counts
    const memberMap = new Map<
      string,
      { imageUrl?: string; stories: number; points: number }
    >()

    for (const item of sprintStories) {
      if (!item.assignedTo) continue
      const name = item.assignedTo.displayName
      const entry = memberMap.get(name) ?? {
        imageUrl: item.assignedTo.imageUrl,
        stories: 0,
        points: 0,
      }
      entry.stories += 1
      entry.points += item.storyPoints ?? 0
      memberMap.set(name, entry)
    }

    // Average velocity: closed/resolved user stories across last N sprints
    const recentSprints = [...sprints]
      .filter((s) => s.timeFrame === 'past' || s.timeFrame === 'current')
      .sort((a, b) => {
        const da = a.startDate ? new Date(a.startDate).getTime() : 0
        const db = b.startDate ? new Date(b.startDate).getTime() : 0
        return db - da
      })
      .slice(0, lastN)

    const recentPaths = new Set(recentSprints.map((s) => s.path))

    const completedStories = workItems.filter(
      (w) =>
        w.workItemType === 'User Story' &&
        (w.state === 'Closed' || w.state === 'Resolved') &&
        w.assignedTo &&
        recentPaths.has(w.iterationPath),
    )

    const velocityByMember = new Map<string, number>()
    for (const item of completedStories) {
      const name = item.assignedTo!.displayName
      velocityByMember.set(
        name,
        (velocityByMember.get(name) ?? 0) + (item.storyPoints ?? 0),
      )
    }

    const sprintCount = recentSprints.length || 1

    const result: TeamMemberData[] = []
    for (const [name, entry] of memberMap) {
      const totalCompleted = velocityByMember.get(name) ?? 0
      result.push({
        name,
        imageUrl: entry.imageUrl,
        stories: entry.stories,
        storyPoints: entry.points,
        avgVelocity:
          Math.round((totalCompleted / sprintCount) * 10) / 10,
      })
    }

    result.sort((a, b) => b.storyPoints - a.storyPoints)
    return result
  }, [workItems, sprints, lastN])
}

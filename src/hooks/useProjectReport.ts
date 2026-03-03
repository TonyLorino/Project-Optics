import { useMemo } from 'react'
import { format } from 'date-fns'
import type { WorkItem } from '@/types/workItem'
import type { Sprint } from '@/types/sprint'
import type { WikiProjectData } from '@/lib/wikiParser'

export interface MilestoneRow {
  id: number
  name: string
  state: string
  targetDate: string | null
  completed: boolean
}

export interface WatchListRow {
  id: number
  type: 'Issue' | 'Risk'
  title: string
  owner: string
}

export interface ProjectReportData {
  projectName: string
  progressPercent: number
  overallStatus: 'green' | 'yellow' | 'red'
  endDate: string | null
  lastModified: string | null
  totalStoryPoints: number
  milestones: MilestoneRow[]
  watchList: WatchListRow[]
  programManager: string | null
  projectManager: string | null
  accomplishments: string | null
  lookAhead: string | null
  description: string | null
  wikiFields: Record<string, string>
}

export function useProjectReport(
  workItems: WorkItem[],
  sprints: Sprint[],
  projectName: string | null,
  wikiData?: WikiProjectData | null,
): ProjectReportData | null {
  return useMemo(() => {
    if (!projectName) return null

    const wikiFields = wikiData?.fields ?? {}
    const programManager = wikiFields['Program Manager'] ?? null
    const projectManager = wikiFields['Project Manager'] ?? null
    const accomplishments = wikiData?.accomplishments ?? null
    const lookAhead = wikiData?.lookAhead ?? null
    const description = wikiData?.description ?? null

    const items = workItems.filter((w) => w.projectName === projectName)

    if (items.length === 0) {
      return {
        projectName,
        progressPercent: 0,
        overallStatus: 'green',
        endDate: null,
        lastModified: null,
        totalStoryPoints: 0,
        milestones: [],
        watchList: [],
        programManager,
        projectManager,
        accomplishments,
        lookAhead,
        description,
        wikiFields,
      }
    }

    // Progress: completed story points / total story points
    const stories = items.filter((w) => w.workItemType === 'User Story')
    const totalSP = stories.reduce((sum, w) => sum + (w.storyPoints ?? 0), 0)
    const completedSP = stories
      .filter((w) => w.state === 'Closed' || w.state === 'Resolved')
      .reduce((sum, w) => sum + (w.storyPoints ?? 0), 0)
    const progressPercent =
      totalSP > 0 ? Math.round((completedSP / totalSP) * 100) : 0

    // Overall status
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const hasOpenRiskOrIssue = items.some(
      (w) =>
        (w.workItemType === 'Issue' || w.workItemType === 'Risk') &&
        w.state !== 'Closed' &&
        w.state !== 'Removed',
    )

    const hasOverdueTarget = items.some(
      (w) =>
        w.state !== 'Closed' &&
        w.state !== 'Removed' &&
        w.targetDate != null &&
        new Date(w.targetDate) < now,
    )

    const overallStatus: 'green' | 'yellow' | 'red' =
      hasOpenRiskOrIssue || hasOverdueTarget ? 'yellow' : 'green'

    // End date: latest targetDate across all items, fallback to latest sprint finishDate
    let endDate: string | null = null
    const targetDates = items
      .map((w) => w.targetDate)
      .filter((d): d is string => d != null)
      .sort()
    if (targetDates.length > 0) {
      const lastTarget = targetDates[targetDates.length - 1]
      if (lastTarget) endDate = format(new Date(lastTarget), 'yyyy-MM-dd')
    } else {
      const projectSprints = sprints
        .filter((s): s is Sprint & { finishDate: string } =>
          s.projectName === projectName && s.finishDate != null,
        )
        .sort((a, b) => new Date(b.finishDate).getTime() - new Date(a.finishDate).getTime())
      const firstSprint = projectSprints[0]
      if (firstSprint) {
        endDate = format(new Date(firstSprint.finishDate), 'yyyy-MM-dd')
      }
    }

    // Last modified: most recent changedDate
    const changedDates = items
      .map((w) => new Date(w.changedDate).getTime())
      .sort((a, b) => b - a)
    const lastChanged = changedDates[0]
    const lastModified =
      lastChanged != null ? format(new Date(lastChanged), 'yyyy-MM-dd') : null

    // Total story points (all items with SP)
    const totalStoryPoints = items.reduce(
      (sum, w) => sum + (w.storyPoints ?? 0),
      0,
    )

    // Milestones: active features + 2 most recently completed
    const activeMilestones: MilestoneRow[] = items
      .filter((w) => w.workItemType === 'Feature' && w.state === 'Active')
      .map((w) => ({
        id: w.id,
        name: w.title,
        state: w.state,
        targetDate: w.targetDate
          ? format(new Date(w.targetDate), 'yyyy-MM-dd')
          : null,
        completed: false,
      }))
      .sort((a, b) => {
        if (a.targetDate && b.targetDate) return a.targetDate.localeCompare(b.targetDate)
        if (a.targetDate) return -1
        if (b.targetDate) return 1
        return 0
      })

    const completedMilestones: MilestoneRow[] = items
      .filter((w) => w.workItemType === 'Feature' && (w.state === 'Closed' || w.state === 'Resolved'))
      .sort((a, b) => {
        const aDate = a.closedDate ?? a.stateChangeDate ?? a.changedDate
        const bDate = b.closedDate ?? b.stateChangeDate ?? b.changedDate
        return new Date(bDate).getTime() - new Date(aDate).getTime()
      })
      .slice(0, 2)
      .map((w) => ({
        id: w.id,
        name: w.title,
        state: w.state,
        targetDate: w.targetDate
          ? format(new Date(w.targetDate), 'yyyy-MM-dd')
          : null,
        completed: true,
      }))

    const milestones: MilestoneRow[] = [...activeMilestones, ...completedMilestones]

    // Watch list: Issues and Risks
    const watchList: WatchListRow[] = items
      .filter(
        (w) =>
          (w.workItemType === 'Issue' || w.workItemType === 'Risk') &&
          w.state !== 'Closed' &&
          w.state !== 'Removed',
      )
      .map((w) => ({
        id: w.id,
        type: w.workItemType as 'Issue' | 'Risk',
        title: w.title,
        owner: w.assignedTo?.displayName ?? 'Unassigned',
      }))

    return {
      projectName,
      progressPercent,
      overallStatus,
      endDate,
      lastModified,
      totalStoryPoints,
      milestones,
      watchList,
      programManager,
      projectManager,
      accomplishments,
      lookAhead,
      description,
      wikiFields,
    }
  }, [workItems, sprints, projectName, wikiData])
}

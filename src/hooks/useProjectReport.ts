import { useMemo } from 'react'
import { format } from 'date-fns'
import type { WorkItem } from '@/types/workItem'
import type { Sprint } from '@/types/sprint'
import type { WikiProjectData } from '@/lib/wikiParser'
import { STATE_COLORS } from '@/lib/colors'

const OVERDUE_COLOR = '#facc15'

export interface MilestoneRow {
  id: number
  name: string
  state: string
  targetDate: string | null
  completed: boolean
  statusColor: string
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

/**
 * Build report data from work items.
 *
 * - When `projectName` is provided, items are filtered to that project and wiki
 *   data is used for narrative fields.
 * - When `projectName` is null (cross-project mode), all provided items are
 *   aggregated and `displayLabel` is used as the report title. Wiki fields are
 *   left empty since they are per-project.
 */
export function useProjectReport(
  workItems: WorkItem[],
  sprints: Sprint[],
  projectName: string | null,
  wikiData?: WikiProjectData | null,
  displayLabel?: string,
): ProjectReportData | null {
  return useMemo(() => {
    const crossProject = projectName === null && displayLabel != null
    if (!projectName && !crossProject) return null

    const wikiFields = wikiData?.fields ?? {}
    const programManager = crossProject ? null : (wikiFields['Program Manager'] ?? null)
    const projectManager = crossProject ? null : (wikiFields['Project Manager'] ?? null)
    const accomplishments = crossProject ? null : (wikiData?.accomplishments ?? null)
    const lookAhead = crossProject ? null : (wikiData?.lookAhead ?? null)
    const description = crossProject ? null : (wikiData?.description ?? null)

    const items = crossProject
      ? workItems
      : workItems.filter((w) => w.projectName === projectName)

    const reportTitle = crossProject ? displayLabel! : projectName!

    if (items.length === 0) {
      return {
        projectName: reportTitle,
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
        wikiFields: crossProject ? {} : wikiFields,
      }
    }

    const stories = items.filter((w) => w.workItemType === 'User Story')
    const totalSP = stories.reduce((sum, w) => sum + (w.storyPoints ?? 0), 0)
    const completedSP = stories
      .filter((w) => w.state === 'Closed' || w.state === 'Resolved')
      .reduce((sum, w) => sum + (w.storyPoints ?? 0), 0)
    const progressPercent =
      totalSP > 0 ? Math.round((completedSP / totalSP) * 100) : 0

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

    let endDate: string | null = null
    const targetDates = items
      .map((w) => w.targetDate)
      .filter((d): d is string => d != null)
      .sort()
    if (targetDates.length > 0) {
      const lastTarget = targetDates[targetDates.length - 1]
      if (lastTarget) endDate = format(new Date(lastTarget), 'yyyy-MM-dd')
    } else if (!crossProject && projectName) {
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

    const changedDates = items
      .map((w) => new Date(w.changedDate).getTime())
      .sort((a, b) => b - a)
    const lastChanged = changedDates[0]
    const lastModified =
      lastChanged != null ? format(new Date(lastChanged), 'yyyy-MM-dd') : null

    const totalStoryPoints = items.reduce(
      (sum, w) => sum + (w.storyPoints ?? 0),
      0,
    )

    const activeMilestones: MilestoneRow[] = items
      .filter((w) => w.workItemType === 'Feature' && w.state === 'Active')
      .map((w) => {
        const td = w.targetDate ? format(new Date(w.targetDate), 'yyyy-MM-dd') : null
        const overdue = td != null && new Date(td) < now
        return {
          id: w.id,
          name: w.title,
          state: w.state,
          targetDate: td,
          completed: false,
          statusColor: overdue ? OVERDUE_COLOR : (STATE_COLORS[w.state] ?? '#d4d4d8'),
        }
      })
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
        statusColor: STATE_COLORS[w.state] ?? '#d4d4d8',
      }))

    const milestones: MilestoneRow[] = [...activeMilestones, ...completedMilestones]

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
      projectName: reportTitle,
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
      wikiFields: crossProject ? {} : wikiFields,
    }
  }, [workItems, sprints, projectName, wikiData, displayLabel])
}

import { adoClient } from '@/services/azureDevOps'
import {
  ADO_API_VERSION,
  WORK_ITEM_BATCH_SIZE,
  WIQL_ALL_ITEMS,
  WIQL_ITERATION_ITEMS,
} from '@/lib/constants'
import type { ADOWiqlResult, ADOWorkItem } from '@/types/ado'
import type { WorkItem, WorkItemState, WorkItemType } from '@/types/workItem'

// ── helpers ──────────────────────────────────────────────────

const VALID_STATES = new Set<string>(['New', 'Active', 'Resolved', 'Closed', 'Removed'])
const VALID_TYPES = new Set<string>(['User Story', 'Bug', 'Task', 'Epic', 'Feature', 'Issue', 'Risk'])

function toWorkItemState(raw: string): WorkItemState {
  return VALID_STATES.has(raw) ? (raw as WorkItemState) : ('New' as WorkItemState)
}

function toWorkItemType(raw: string): WorkItemType {
  return VALID_TYPES.has(raw) ? (raw as WorkItemType) : ('Task' as WorkItemType)
}

const ISSUE_RISK_PATTERN = /\/(Issue|Risk)\//i

function detectLinkedTypes(raw: ADOWorkItem): { hasLinkedIssue: boolean; hasLinkedRisk: boolean } {
  let hasLinkedIssue = false
  let hasLinkedRisk = false

  if (raw.relations) {
    for (const rel of raw.relations) {
      if (!rel.url) continue
      const match = ISSUE_RISK_PATTERN.exec(rel.url)
      if (match?.[1]) {
        const type = match[1].toLowerCase()
        if (type === 'issue') hasLinkedIssue = true
        if (type === 'risk') hasLinkedRisk = true
      }
      // Also check the relation attribute name
      const name = rel.attributes?.name?.toLowerCase() ?? ''
      if (name.includes('issue')) hasLinkedIssue = true
      if (name.includes('risk')) hasLinkedRisk = true
    }
  }

  return { hasLinkedIssue, hasLinkedRisk }
}

function mapWorkItem(raw: ADOWorkItem, allItemTypes: Map<number, string>): WorkItem {
  const f = raw.fields
  const { hasLinkedIssue: directIssue, hasLinkedRisk: directRisk } = detectLinkedTypes(raw)

  // Check if any related work item (by ID from relation URL) is an Issue or Risk
  let hasLinkedIssue = directIssue
  let hasLinkedRisk = directRisk

  // Extract parent ID from Hierarchy-Reverse (child→parent) relation
  let parentId: number | undefined
  if (raw.relations) {
    for (const rel of raw.relations) {
      if (rel.rel === 'System.LinkTypes.Hierarchy-Reverse') {
        const idMatch = /\/workItems\/(\d+)$/i.exec(rel.url)
        if (idMatch?.[1]) parentId = Number(idMatch[1])
      }
      const idMatch = /\/workItems\/(\d+)$/i.exec(rel.url)
      if (idMatch?.[1]) {
        const relatedType = allItemTypes.get(Number(idMatch[1]))
        if (relatedType === 'Issue') hasLinkedIssue = true
        if (relatedType === 'Risk') hasLinkedRisk = true
      }
    }
  }

  return {
    id: raw.id,
    projectName: f['System.TeamProject'],
    title: f['System.Title'],
    state: toWorkItemState(f['System.State']),
    workItemType: toWorkItemType(f['System.WorkItemType']),
    assignedTo: f['System.AssignedTo']
      ? {
          displayName: f['System.AssignedTo'].displayName,
          uniqueName: f['System.AssignedTo'].uniqueName,
          imageUrl: f['System.AssignedTo'].imageUrl,
        }
      : undefined,
    storyPoints: f['Microsoft.VSTS.Scheduling.StoryPoints'] ?? undefined,
    priority: f['Microsoft.VSTS.Common.Priority'] ?? undefined,
    iterationPath: f['System.IterationPath'],
    areaPath: f['System.AreaPath'],
    createdDate: f['System.CreatedDate'],
    changedDate: f['System.ChangedDate'],
    stateChangeDate: f['Microsoft.VSTS.Common.StateChangeDate'] ?? undefined,
    closedDate: f['Microsoft.VSTS.Common.ClosedDate'] ?? undefined,
    resolvedDate: (f['Microsoft.VSTS.Common.ResolvedDate'] as string | undefined) ?? undefined,
    targetDate: (f['Microsoft.VSTS.Scheduling.TargetDate'] as string | undefined) ?? undefined,
    activatedDate: f['Microsoft.VSTS.Common.ActivatedDate'] ?? undefined,
    tags: f['System.Tags'] ?? undefined,
    description: f['System.Description'] ?? undefined,
    reason: f['System.Reason'] ?? undefined,
    parentId,
    hasLinkedIssue,
    hasLinkedRisk,
  }
}

/** Split an array into chunks of `size`. */
function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }
  return result
}

// ── public API ───────────────────────────────────────────────

/**
 * Run a WIQL query against a project and return the matching work-item IDs.
 */
export async function queryWorkItemIds(
  projectName: string,
  wiql: string,
): Promise<number[]> {
  const { data } = await adoClient.post<ADOWiqlResult>(
    `/${encodeURIComponent(projectName)}/_apis/wit/wiql?api-version=${ADO_API_VERSION}`,
    { query: wiql },
  )
  return (data.workItems ?? []).map((wi) => wi.id)
}

/**
 * Fetch full details for the given work-item IDs.
 * Automatically batches in groups of 200 (ADO limit).
 * Includes $expand=Relations to detect linked Issue/Risk types.
 */
export async function fetchWorkItemDetails(
  ids: number[],
): Promise<WorkItem[]> {
  if (ids.length === 0) return []

  const batches = chunk(ids, WORK_ITEM_BATCH_SIZE)

  const rawItems: ADOWorkItem[] = []

  const settled = await Promise.allSettled(
    batches.map(async (batch) => {
      const { data } = await adoClient.get<{ value: ADOWorkItem[] }>(
        `/_apis/wit/workitems?ids=${batch.join(',')}&$expand=Relations&api-version=${ADO_API_VERSION}`,
      )
      return data.value ?? []
    }),
  )
  for (const result of settled) {
    if (result.status === 'fulfilled') {
      rawItems.push(...result.value)
    } else {
      console.warn('[fetchWorkItemDetails] Batch failed:', result.reason)
    }
  }

  // Build a lookup of ID -> WorkItemType so we can cross-reference relations
  const typeMap = new Map<number, string>()
  for (const raw of rawItems) {
    typeMap.set(raw.id, raw.fields['System.WorkItemType'])
  }

  return rawItems.map((raw) => mapWorkItem(raw, typeMap))
}

/**
 * Fetch all work items for a project, optionally scoped to an iteration.
 */
export async function fetchWorkItemsByProject(
  projectName: string,
  iterationPath?: string,
): Promise<WorkItem[]> {
  const wiql = iterationPath
    ? WIQL_ITERATION_ITEMS(iterationPath)
    : WIQL_ALL_ITEMS

  const ids = await queryWorkItemIds(projectName, wiql)
  return fetchWorkItemDetails(ids)
}

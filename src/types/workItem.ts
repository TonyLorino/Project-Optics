export type WorkItemState = 'New' | 'Active' | 'Resolved' | 'Closed' | 'Removed'

export type WorkItemType = 'User Story' | 'Bug' | 'Task' | 'Epic' | 'Feature' | 'Issue' | 'Risk'

export interface WorkItem {
  id: number
  projectName: string
  title: string
  state: WorkItemState
  workItemType: WorkItemType
  assignedTo?: {
    displayName: string
    uniqueName: string
    imageUrl?: string
  }
  storyPoints?: number
  priority?: number
  iterationPath: string
  areaPath: string
  createdDate: string
  changedDate: string
  stateChangeDate?: string
  closedDate?: string
  resolvedDate?: string
  targetDate?: string
  activatedDate?: string
  tags?: string
  description?: string
  reason?: string
  parentId?: number
  hasLinkedIssue: boolean
  hasLinkedRisk: boolean
  // Future: Watch List linkage
  watchListId?: string
}

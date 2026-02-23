// ─── Azure DevOps API response types ───────────────────────────

export interface ADOListResponse<T> {
  count: number
  value: T[]
}

export interface ADOProject {
  id: string
  name: string
  description: string | null
  state: 'wellFormed' | 'createPending' | 'deleting' | 'deleted'
  visibility: 'private' | 'public'
  url: string
}

export interface ADOTeam {
  id: string
  name: string
  description: string
  url: string
  projectName: string
  projectId: string
}

export interface ADOIterationAttributes {
  startDate: string | null
  finishDate: string | null
  timeFrame: 'past' | 'current' | 'future'
}

export interface ADOIteration {
  id: string
  name: string
  path: string
  attributes: ADOIterationAttributes
  url: string
}

export interface ADOWorkItemReference {
  id: number
  url: string
}

export interface ADOWiqlResult {
  queryType: string
  queryResultType: string
  asOf: string
  workItems: ADOWorkItemReference[]
}

export interface ADOIdentityRef {
  displayName: string
  uniqueName: string
  imageUrl?: string
  id?: string
}

export interface ADOWorkItemFields {
  'System.Id': number
  'System.Title': string
  'System.State': string
  'System.WorkItemType': string
  'System.AssignedTo'?: ADOIdentityRef
  'System.IterationPath': string
  'System.AreaPath': string
  'System.CreatedDate': string
  'System.ChangedDate': string
  'System.Tags'?: string
  'System.TeamProject': string
  'System.Description'?: string
  'System.Reason'?: string
  'Microsoft.VSTS.Scheduling.StoryPoints'?: number
  'Microsoft.VSTS.Common.Priority'?: number
  'Microsoft.VSTS.Common.StateChangeDate'?: string
  'Microsoft.VSTS.Common.ClosedDate'?: string
  'Microsoft.VSTS.Common.ActivatedDate'?: string
  [key: string]: unknown
}

export interface ADOWorkItemRelation {
  rel: string
  url: string
  attributes: {
    name?: string
    [key: string]: unknown
  }
}

export interface ADOWorkItem {
  id: number
  rev: number
  fields: ADOWorkItemFields
  relations?: ADOWorkItemRelation[]
  url: string
}

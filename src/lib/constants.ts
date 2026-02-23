/** Prefix used by archived projects in the CorporateDataOffice org */
export const ARCHIVED_PROJECT_PREFIX = 'z'

/** ADO REST API version */
export const ADO_API_VERSION = '7.1'

/** Work item fields requested in WIQL and detail queries */
export const WORK_ITEM_FIELDS = [
  'System.Id',
  'System.Title',
  'System.State',
  'System.WorkItemType',
  'System.AssignedTo',
  'System.IterationPath',
  'System.AreaPath',
  'System.CreatedDate',
  'System.ChangedDate',
  'System.Tags',
  'System.TeamProject',
  'System.Description',
  'System.Reason',
  'Microsoft.VSTS.Scheduling.StoryPoints',
  'Microsoft.VSTS.Common.Priority',
  'Microsoft.VSTS.Common.StateChangeDate',
  'Microsoft.VSTS.Common.ClosedDate',
  'Microsoft.VSTS.Common.ActivatedDate',
  'Microsoft.VSTS.Common.ResolvedDate',
] as const

/** Maximum number of work item IDs per detail fetch (ADO limit is 200) */
export const WORK_ITEM_BATCH_SIZE = 200

/** WIQL query for all work items in a project */
export const WIQL_ALL_ITEMS = `
  SELECT [System.Id]
  FROM WorkItems
  WHERE [System.TeamProject] = @project
  ORDER BY [System.ChangedDate] DESC
`

/** WIQL query for work items in a specific iteration */
export const WIQL_ITERATION_ITEMS = (iterationPath: string) => {
  const sanitized = iterationPath.replace(/'/g, "''")
  return `
  SELECT [System.Id]
  FROM WorkItems
  WHERE [System.TeamProject] = @project
    AND [System.IterationPath] = '${sanitized}'
  ORDER BY [System.ChangedDate] DESC
`
}

/** Polling interval in ms (1 hour) */
export const REFETCH_INTERVAL_MS = 3_600_000

/** Storage key prefix */
export const STORAGE_PREFIX = 'optics:'

/** Default page size for paginated tables */
export const TABLE_PAGE_SIZE = 20

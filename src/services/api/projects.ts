import { adoClient } from '@/services/azureDevOps'
import { ADO_API_VERSION, ARCHIVED_PROJECT_PREFIX } from '@/lib/constants'
import type { ADOListResponse, ADOProject } from '@/types/ado'
import type { Project } from '@/types/project'

/**
 * Fetch every project visible to the authenticated user in the org.
 */
export async function fetchProjects(): Promise<Project[]> {
  const { data } = await adoClient.get<ADOListResponse<ADOProject>>(
    `/_apis/projects?api-version=${ADO_API_VERSION}&$top=100`,
  )

  return data.value.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    state: p.state,
    visibility: p.visibility,
    isArchived: p.name.toLowerCase().startsWith(ARCHIVED_PROJECT_PREFIX)
      || p.name.toLowerCase().includes('(archived)'),
  }))
}

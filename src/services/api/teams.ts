import { adoClient } from '@/services/azureDevOps'
import { ADO_API_VERSION } from '@/lib/constants'
import type { ADOListResponse, ADOTeam } from '@/types/ado'
import type { Team } from '@/types/project'

/**
 * Fetch all teams for a given project.
 */
export async function fetchTeams(projectName: string): Promise<Team[]> {
  const { data } = await adoClient.get<ADOListResponse<ADOTeam>>(
    `/_apis/projects/${encodeURIComponent(projectName)}/teams?api-version=${ADO_API_VERSION}`,
  )

  return data.value.map((t) => ({
    id: t.id,
    name: t.name,
    projectName: projectName,
    projectId: t.projectId,
  }))
}

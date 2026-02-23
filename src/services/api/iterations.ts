import { adoClient } from '@/services/azureDevOps'
import { ADO_API_VERSION } from '@/lib/constants'
import type { ADOListResponse, ADOIteration } from '@/types/ado'
import type { Sprint } from '@/types/sprint'

/**
 * Fetch iterations (sprints) for a specific project + team pair.
 */
export async function fetchIterations(
  projectName: string,
  teamName: string,
): Promise<Sprint[]> {
  const { data } = await adoClient.get<ADOListResponse<ADOIteration>>(
    `/${encodeURIComponent(projectName)}/${encodeURIComponent(teamName)}/_apis/work/teamsettings/iterations?api-version=${ADO_API_VERSION}`,
  )

  return data.value.map((it) => ({
    id: it.id,
    name: it.name,
    path: it.path,
    projectName,
    startDate: it.attributes.startDate,
    finishDate: it.attributes.finishDate,
    timeFrame: it.attributes.timeFrame,
  }))
}

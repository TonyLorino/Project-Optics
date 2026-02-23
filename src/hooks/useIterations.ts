import { useQuery } from '@tanstack/react-query'
import { fetchIterations } from '@/services/api/iterations'
import { fetchTeams } from '@/services/api/teams'
import type { Sprint } from '@/types/sprint'
import { REFETCH_INTERVAL_MS } from '@/lib/constants'

/**
 * Fetches iterations (sprints) for the given projects.
 *
 * ADO requires both a project and a team name.  We first
 * fetch the default team for each project, then fetch
 * its iterations.
 */
export function useIterations(projectNames: string[]) {
  return useQuery({
    queryKey: ['iterations', projectNames],
    queryFn: async (): Promise<Sprint[]> => {
      const results = await Promise.all(
        projectNames.map(async (projectName) => {
          try {
            const teams = await fetchTeams(projectName)
            if (teams.length === 0) return [] as Sprint[]
            // Use the first team as default
            return fetchIterations(projectName, teams[0].name)
          } catch {
            // Some projects may not have iterations configured
            return [] as Sprint[]
          }
        }),
      )
      return results.flat()
    },
    enabled: projectNames.length > 0,
    staleTime: 5 * 60 * 1000,
    refetchInterval: REFETCH_INTERVAL_MS,
  })
}

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
    queryKey: ['iterations', [...projectNames].sort().join(',')],
    queryFn: async (): Promise<Sprint[]> => {
      const results = await Promise.all(
        projectNames.map(async (projectName) => {
          try {
            const teams = await fetchTeams(projectName)
            const defaultTeam = teams[0]
            if (!defaultTeam) return [] as Sprint[]
            return fetchIterations(projectName, defaultTeam.name)
          } catch {
            // Some projects may not have iterations configured
            return [] as Sprint[]
          }
        }),
      )
      return results.flat()
    },
    enabled: projectNames.length > 0,
    staleTime: 5 * 60 * 1000, // Sprint definitions are stable; 5 min cache
    refetchInterval: REFETCH_INTERVAL_MS,
  })
}

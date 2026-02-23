import { useQuery } from '@tanstack/react-query'
import { fetchAreaPaths } from '@/services/api/areaPaths'

/**
 * Fetch area paths for a list of projects in parallel.
 * Returns a map of project name -> child area path names.
 */
export function useAreaPaths(projectNames: string[]) {
  return useQuery({
    queryKey: ['areaPaths', [...projectNames].sort().join(',')],
    queryFn: async (): Promise<Record<string, string[]>> => {
      const settled = await Promise.allSettled(
        projectNames.map(async (name) => {
          const areas = await fetchAreaPaths(name)
          return [name, areas] as [string, string[]]
        }),
      )
      const entries: [string, string[]][] = []
      for (const result of settled) {
        if (result.status === 'fulfilled') {
          entries.push(result.value)
        } else {
          console.warn('[useAreaPaths] Fetch failed:', result.reason)
        }
      }
      return Object.fromEntries(entries)
    },
    enabled: projectNames.length > 0,
    staleTime: 5 * 60 * 1000, // Area paths rarely change; 5 min cache
    gcTime: 10 * 60 * 1000,
  })
}

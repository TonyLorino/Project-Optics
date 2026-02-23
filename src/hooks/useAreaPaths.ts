import { useQuery } from '@tanstack/react-query'
import { fetchAreaPaths } from '@/services/api/areaPaths'

/**
 * Fetch area paths for a list of projects in parallel.
 * Returns a map of project name -> child area path names.
 */
export function useAreaPaths(projectNames: string[]) {
  return useQuery({
    queryKey: ['areaPaths', projectNames],
    queryFn: async (): Promise<Record<string, string[]>> => {
      const entries = await Promise.all(
        projectNames.map(async (name) => {
          const areas = await fetchAreaPaths(name)
          return [name, areas] as const
        }),
      )
      return Object.fromEntries(entries)
    },
    enabled: projectNames.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

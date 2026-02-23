import { useQuery } from '@tanstack/react-query'
import { fetchProjectWikiData } from '@/services/api/wiki'
import { REFETCH_INTERVAL_MS } from '@/lib/constants'

/**
 * Fetch the ProjectOptics wiki page for a single project.
 * When areaName is provided, fetches /ProjectOptics-{areaName} instead.
 * Returns parsed wiki data or null if the page doesn't exist.
 */
export function useProjectWiki(
  projectName: string | null,
  areaName?: string | null,
) {
  return useQuery({
    queryKey: ['wiki', projectName, areaName ?? '__root__'],
    queryFn: () => fetchProjectWikiData(projectName!, areaName),
    enabled: projectName != null,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchInterval: REFETCH_INTERVAL_MS,
  })
}

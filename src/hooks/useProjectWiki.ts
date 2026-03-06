import { useQuery } from '@tanstack/react-query'
import { fetchProjectWikiData } from '@/services/api/wiki'
import { REFETCH_INTERVAL_MS } from '@/lib/constants'
import type { WikiProjectData } from '@/lib/wikiParser'
import type { WikiConflictError } from '@/lib/wikiParser'

/**
 * Fetch the ProjectOptics wiki page for a single project.
 * When areaName is provided, fetches ProjectOptics-{areaName} instead.
 * Searches the full wiki tree. Returns parsed wiki data, a conflict
 * error (if multiple pages share the name), or null.
 */
export function useProjectWiki(
  projectName: string | null,
  areaName?: string | null,
) {
  return useQuery<WikiProjectData | WikiConflictError | null>({
    queryKey: ['wiki', projectName, areaName ?? '__root__'],
    queryFn: () => fetchProjectWikiData(projectName!, areaName),
    enabled: projectName != null,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchInterval: REFETCH_INTERVAL_MS,
  })
}

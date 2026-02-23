import { useQuery } from '@tanstack/react-query'
import { fetchWorkItemsByProject } from '@/services/api/workItems'
import { REFETCH_INTERVAL_MS } from '@/lib/constants'
import type { WorkItem } from '@/types/workItem'

/**
 * Fetches work items across one or more projects, optionally
 * filtered to a specific iteration path.
 *
 * Because ADO does not support cross-project WIQL, we fan
 * out parallel queries per project and merge the results.
 */
export function useWorkItems(
  projectNames: string[],
  iterationPath?: string,
) {
  return useQuery({
    queryKey: ['workItems', [...projectNames].sort().join(','), iterationPath ?? '__all__'],
    queryFn: async (): Promise<WorkItem[]> => {
      const settled = await Promise.allSettled(
        projectNames.map((p) => fetchWorkItemsByProject(p, iterationPath)),
      )
      const items: WorkItem[] = []
      for (const result of settled) {
        if (result.status === 'fulfilled') {
          items.push(...result.value)
        } else {
          console.warn('[useWorkItems] Project fetch failed:', result.reason)
        }
      }
      return items
    },
    enabled: projectNames.length > 0,
    staleTime: 60 * 1000, // Work items update frequently; 1 min freshness
    refetchInterval: REFETCH_INTERVAL_MS,
    refetchOnWindowFocus: true,
  })
}

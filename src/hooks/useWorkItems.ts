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
    queryKey: ['workItems', projectNames, iterationPath ?? '__all__'],
    queryFn: async (): Promise<WorkItem[]> => {
      const results = await Promise.all(
        projectNames.map((p) => fetchWorkItemsByProject(p, iterationPath)),
      )
      return results.flat()
    },
    enabled: projectNames.length > 0,
    staleTime: 60 * 1000,
    refetchInterval: REFETCH_INTERVAL_MS,
    refetchOnWindowFocus: true,
  })
}

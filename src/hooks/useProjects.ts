import { useQuery } from '@tanstack/react-query'
import { fetchProjects } from '@/services/api/projects'

/**
 * Fetches the list of all projects in the organization.
 * Projects rarely change so we use a longer stale time.
 */
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

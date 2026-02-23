import { useMemo, useEffect, useRef } from 'react'
import {
  AlertTriangle,
  ShieldAlert,
  Flame,
  Clock,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { FilterBar } from '@/components/filters/FilterBar'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { DashboardError } from '@/components/dashboard/DashboardError'
import { RaidTypeChart } from '@/components/watchlist/RaidTypeChart'
import { RaidPriorityChart } from '@/components/watchlist/RaidPriorityChart'
import { RaidTable } from '@/components/watchlist/RaidTable'
import { useProjects } from '@/hooks/useProjects'
import { useWorkItems } from '@/hooks/useWorkItems'
import { useIterations } from '@/hooks/useIterations'
import {
  useRaidMetrics,
  useRaidTypeDistribution,
  useRaidPriorityDistribution,
} from '@/hooks/useRaidMetrics'
import { useAreaPaths } from '@/hooks/useAreaPaths'
import { useUIStore } from '@/store/uiStore'
import { parseSelections, filterByAreaSelections } from '@/lib/selectionHelpers'

export function WatchList() {
  const {
    selectedProjects,
    selectedSprint,
    selectedResource,
    showArchived,
    setSelectedProjects,
    setSelectedSprint,
    setSelectedResource,
    toggleArchived,
    setSyncState,
  } = useUIStore()

  const {
    data: projects = [],
    isLoading: projectsLoading,
  } = useProjects()

  const hasInitialized = useRef(false)
  useEffect(() => {
    if (!hasInitialized.current && projects.length > 0 && selectedProjects.length === 0) {
      hasInitialized.current = true
      const visible = showArchived
        ? projects
        : projects.filter((p) => !p.isArchived)
      setSelectedProjects(visible.map((p) => p.name))
    }
  }, [projects, selectedProjects.length, showArchived, setSelectedProjects])

  const { projectNames: parsedProjectNames, areaFilters } = useMemo(
    () => parseSelections(selectedProjects),
    [selectedProjects],
  )

  const activeProjectNames = useMemo(() => {
    const visible = showArchived
      ? projects
      : projects.filter((p) => !p.isArchived)
    const visibleNames = new Set(visible.map((p) => p.name))
    return parsedProjectNames.filter((name) => visibleNames.has(name))
  }, [projects, parsedProjectNames, showArchived])

  const allVisibleProjectNames = useMemo(() => {
    const visible = showArchived
      ? projects
      : projects.filter((p) => !p.isArchived)
    return visible.map((p) => p.name)
  }, [projects, showArchived])

  const { data: areaPaths = {} } = useAreaPaths(allVisibleProjectNames)

  const {
    data: iterations = [],
    isLoading: iterationsLoading,
  } = useIterations(activeProjectNames)

  const resolvedSprintPath = useMemo(() => {
    if (selectedSprint === null) return undefined
    if (selectedSprint === '__current__') {
      const current = iterations.find((s) => s.timeFrame === 'current')
      return current?.path
    }
    return selectedSprint
  }, [selectedSprint, iterations])

  const {
    data: workItemsRaw = [],
    isLoading: workItemsLoading,
    isFetching,
    dataUpdatedAt,
    refetch,
    error: workItemsError,
  } = useWorkItems(activeProjectNames, resolvedSprintPath)

  const areaFilteredWorkItems = useMemo(
    () => filterByAreaSelections(workItemsRaw, areaFilters),
    [workItemsRaw, areaFilters],
  )

  const uniqueResources = useMemo(() => {
    const map = new Map<string, { displayName: string; uniqueName: string }>()
    for (const wi of areaFilteredWorkItems) {
      if (wi.assignedTo) {
        map.set(wi.assignedTo.uniqueName, {
          displayName: wi.assignedTo.displayName,
          uniqueName: wi.assignedTo.uniqueName,
        })
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.displayName.localeCompare(b.displayName),
    )
  }, [areaFilteredWorkItems])

  const workItems = useMemo(
    () => selectedResource
      ? areaFilteredWorkItems.filter((wi) => wi.assignedTo?.uniqueName === selectedResource)
      : areaFilteredWorkItems,
    [areaFilteredWorkItems, selectedResource],
  )

  useEffect(() => {
    if (workItemsError) {
      const msg =
        workItemsError instanceof Error
          ? workItemsError.message
          : 'Failed to fetch work items'
      toast.error('Azure DevOps Error', {
        description: msg.includes('401')
          ? 'Unauthorized — check your PAT token in .env.local'
          : msg,
      })
    }
  }, [workItemsError])

  const metrics = useRaidMetrics(workItems)
  const typeDistribution = useRaidTypeDistribution(workItems)
  const priorityDistribution = useRaidPriorityDistribution(workItems)

  const isLoading = projectsLoading || workItemsLoading || iterationsLoading

  const refetchRef = useRef(refetch)
  refetchRef.current = refetch
  const stableRefetch = useMemo(() => () => { void refetchRef.current() }, [])

  useEffect(() => {
    setSyncState(
      dataUpdatedAt ? new Date(dataUpdatedAt) : undefined,
      isFetching,
      stableRefetch,
    )
  }, [dataUpdatedAt, isFetching, stableRefetch, setSyncState])

  return (
    <div className="p-4 md:px-6 md:pt-4 md:pb-6 lg:px-8 lg:pt-4 lg:pb-8 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <motion.h1
          initial={{ opacity: 0, filter: 'blur(6px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent"
        >
          Watch List
        </motion.h1>
        <p className="text-sm mt-1 font-medium tracking-wide text-muted-foreground/70">
          Risks, Issues, Dependencies &amp; Decisions
        </p>
      </div>

      {workItemsError && !isLoading && (
        <DashboardError
          message={
            workItemsError instanceof Error
              ? workItemsError.message.includes('401')
                ? 'Unable to connect to Azure DevOps. Check your PAT token in .env.local and ensure it has "Work Items: Read" and "Project and Team: Read" scopes.'
                : workItemsError.message
              : 'An unexpected error occurred while fetching data.'
          }
          onRetry={() => { void refetch() }}
        />
      )}

      <FilterBar
        projects={projects}
        sprints={iterations}
        resources={uniqueResources}
        selectedProjects={selectedProjects}
        selectedSprint={selectedSprint}
        selectedResource={selectedResource}
        showArchived={showArchived}
        areaPaths={areaPaths}
        onProjectsChange={setSelectedProjects}
        onSprintChange={setSelectedSprint}
        onResourceChange={setSelectedResource}
        onToggleArchived={toggleArchived}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          <MetricCard
            key="issues"
            icon={<AlertTriangle className="h-5 w-5" />}
            label="Open Issues"
            value={metrics.openIssues}
            subtitle={`${metrics.totalRaidItems} total RAID items`}
            isLoading={isLoading}
          />,
          <MetricCard
            key="risks"
            icon={<ShieldAlert className="h-5 w-5" />}
            label="Open Risks"
            value={metrics.openRisks}
            isLoading={isLoading}
          />,
          <MetricCard
            key="high"
            icon={<Flame className="h-5 w-5" />}
            label="High Priority"
            value={metrics.highPriority}
            subtitle="P1 / P2 open items"
            isLoading={isLoading}
          />,
          <MetricCard
            key="age"
            icon={<Clock className="h-5 w-5" />}
            label="Avg Age"
            value={`${metrics.avgAgeDays}d`}
            subtitle="Open RAID items"
            isLoading={isLoading}
          />,
        ].map((card, i) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3, ease: 'easeOut' }}
          >
            {card}
          </motion.div>
        ))}
      </div>

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.3, ease: 'easeOut' }}
      >
        <RaidTypeChart data={typeDistribution} isLoading={isLoading} />
        <RaidPriorityChart data={priorityDistribution} isLoading={isLoading} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.3, ease: 'easeOut' }}
      >
        <RaidTable
          workItems={workItems}
          allWorkItems={workItems}
          isLoading={isLoading}
        />
      </motion.div>
    </div>
  )
}

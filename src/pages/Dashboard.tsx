import { useMemo, useEffect, useRef } from 'react'
import {
  Activity,
  Target,
  Zap,
  Clock,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { FilterBar } from '@/components/filters/FilterBar'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { SprintBurndown } from '@/components/dashboard/SprintBurndown'
import { VelocityChart } from '@/components/dashboard/VelocityChart'
import { StateDistribution } from '@/components/dashboard/StateDistribution'
import { WorkTypeChart } from '@/components/dashboard/WorkTypeChart'
import { TeamWorkload } from '@/components/dashboard/TeamWorkload'
import { GanttChart } from '@/components/dashboard/GanttChart'
import { WorkItemsTable } from '@/components/dashboard/WorkItemsTable'
import { DashboardError } from '@/components/dashboard/DashboardError'
import { useProjects } from '@/hooks/useProjects'
import { useWorkItems } from '@/hooks/useWorkItems'
import { useIterations } from '@/hooks/useIterations'
import {
  useMetrics,
  useStateDistribution,
  useWorkTypeDistribution,
} from '@/hooks/useMetrics'
import { useVelocity } from '@/hooks/useVelocity'
import { useTeamWorkload } from '@/hooks/useTeamWorkload'
import { useAreaPaths } from '@/hooks/useAreaPaths'
import { useUIStore } from '@/store/uiStore'
import { parseSelections, filterByAreaSelections } from '@/lib/selectionHelpers'

export function Dashboard() {
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

  // ── Data fetching ─────────────────────────────────────────

  const {
    data: projects = [],
    isLoading: projectsLoading,
  } = useProjects()

  // Auto-select all visible projects on first load only
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

  // Parse selections into project names and area filters
  const { projectNames: parsedProjectNames, areaFilters } = useMemo(
    () => parseSelections(selectedProjects),
    [selectedProjects],
  )

  // Only include projects that are visible (respect archived toggle)
  const activeProjectNames = useMemo(() => {
    const visible = showArchived
      ? projects
      : projects.filter((p) => !p.isArchived)
    const visibleNames = new Set(visible.map((p) => p.name))
    return parsedProjectNames.filter((name) => visibleNames.has(name))
  }, [projects, parsedProjectNames, showArchived])

  // Fetch area paths for all visible projects (for the selector dropdown)
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

  // Resolve the sprint filter
  const resolvedSprintPath = useMemo(() => {
    if (selectedSprint === null) return undefined // all sprints
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

  // Unfiltered fetch for velocity trend — always shows last 6 sprints
  const { data: allWorkItemsRaw = [] } = useWorkItems(activeProjectNames)

  // Apply area path filtering client-side
  const areaFilteredWorkItems = useMemo(
    () => filterByAreaSelections(workItemsRaw, areaFilters),
    [workItemsRaw, areaFilters],
  )
  const areaFilteredAllWorkItems = useMemo(
    () => filterByAreaSelections(allWorkItemsRaw, areaFilters),
    [allWorkItemsRaw, areaFilters],
  )

  // Extract unique resources from area-filtered items (before resource filter)
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

  // Apply resource filter
  const workItems = useMemo(
    () => selectedResource
      ? areaFilteredWorkItems.filter((wi) => wi.assignedTo?.uniqueName === selectedResource)
      : areaFilteredWorkItems,
    [areaFilteredWorkItems, selectedResource],
  )
  const allWorkItems = useMemo(
    () => selectedResource
      ? areaFilteredAllWorkItems.filter((wi) => wi.assignedTo?.uniqueName === selectedResource)
      : areaFilteredAllWorkItems,
    [areaFilteredAllWorkItems, selectedResource],
  )

  // ── Error toasts ──────────────────────────────────────────

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

  // ── Derived metrics ───────────────────────────────────────

  const metrics = useMetrics(workItems)
  const stateDistribution = useStateDistribution(workItems)
  const workTypeDistribution = useWorkTypeDistribution(workItems)
  const { velocityData, averageVelocity } = useVelocity(
    allWorkItems,
    iterations,
  )
  const teamWorkload = useTeamWorkload(workItems, iterations)

  const currentSprint = iterations.find((s) => s.timeFrame === 'current')

  const isLoading = projectsLoading || workItemsLoading || iterationsLoading
  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : undefined

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
      {/* Page header */}
      <div>
        <motion.h1
          initial={{ opacity: 0, filter: 'blur(6px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent"
        >
          Dashboard
        </motion.h1>
        <p className="text-sm mt-1 font-medium tracking-wide text-muted-foreground/70">
          Corporate Data &amp; AI Office
        </p>
      </div>

      {/* Error state */}
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

      {/* Filters */}
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

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          <MetricCard
            key="active"
            icon={<Activity className="h-5 w-5" />}
            label="Active Items"
            value={metrics.activeItemCount}
            subtitle={`${metrics.totalItems} total across ${activeProjectNames.length} project${activeProjectNames.length !== 1 ? 's' : ''}`}
            isLoading={isLoading}
          />,
          <MetricCard
            key="sp"
            icon={<Target className="h-5 w-5" />}
            label="Story Points"
            value={metrics.totalStoryPoints.toLocaleString()}
            subtitle={`${metrics.completedStoryPoints.toLocaleString()} completed`}
            isLoading={isLoading}
          />,
          <MetricCard
            key="velocity"
            icon={<Zap className="h-5 w-5" />}
            label="Avg Velocity"
            value={averageVelocity}
            subtitle="Points per sprint (last 6)"
            isLoading={isLoading}
          />,
          <MetricCard
            key="cycle"
            icon={<Clock className="h-5 w-5" />}
            label="Avg Cycle Time"
            value={`${metrics.averageCycleTimeDays}d`}
            subtitle="Activation to close"
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

      {/* Charts row 1 */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.3, ease: 'easeOut' }}
      >
        <SprintBurndown
          workItems={allWorkItems}
          sprint={
            resolvedSprintPath
              ? iterations.find((s) => s.path === resolvedSprintPath)
              : currentSprint
          }
          isLoading={isLoading}
        />
        <VelocityChart
          data={velocityData}
          averageVelocity={averageVelocity}
          isLoading={isLoading}
        />
      </motion.div>

      {/* Charts row 2 */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.3, ease: 'easeOut' }}
      >
        <StateDistribution
          data={stateDistribution}
          isLoading={isLoading}
        />
        <WorkTypeChart
          data={workTypeDistribution}
          isLoading={isLoading}
        />
      </motion.div>

      {/* Team workload */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.3, ease: 'easeOut' }}
      >
        <TeamWorkload data={teamWorkload} isLoading={isLoading} />
      </motion.div>

      {/* Gantt timeline */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.3, ease: 'easeOut' }}
      >
        <GanttChart workItems={workItems} isLoading={isLoading} />
      </motion.div>

      {/* Work items table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, duration: 0.3, ease: 'easeOut' }}
      >
        <WorkItemsTable workItems={workItems} isLoading={isLoading} />
      </motion.div>
    </div>
  )
}

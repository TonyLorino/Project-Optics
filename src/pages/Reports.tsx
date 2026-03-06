import { useMemo, useEffect, useRef, useCallback, useState } from 'react'
import {
  ClipboardList,
  FolderOpen,
  Kanban,
  Download,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { toPng } from 'html-to-image'
import Markdown from 'react-markdown'
import { FilterBar } from '@/components/filters/FilterBar'
import { DashboardError } from '@/components/dashboard/DashboardError'
import { ReportSlide } from '@/components/reports/ReportSlide'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { useProjects } from '@/hooks/useProjects'
import { useWorkItems } from '@/hooks/useWorkItems'
import { useIterations } from '@/hooks/useIterations'
import { useProjectReport } from '@/hooks/useProjectReport'
import { useProjectWiki } from '@/hooks/useProjectWiki'
import { useAreaPaths } from '@/hooks/useAreaPaths'
import { useUIStore } from '@/store/uiStore'
import { parseSelections, filterByAreaSelections, getAreaNameFromSelection } from '@/lib/selectionHelpers'
import { collectTags, filterByTags, getTagDisplayValue } from '@/lib/tagHelpers'
import { STATE_COLORS, LINKED_ISSUE_COLOR, LINKED_RISK_COLOR } from '@/lib/colors'
import { cn } from '@/lib/utils'
import { ADO_ORGANIZATION } from '@/lib/constants'
import { extractUrl, isWikiConflict } from '@/lib/wikiParser'
import { GanttChart } from '@/components/dashboard/GanttChart'

function StatusDot({ status }: { status: 'green' | 'yellow' | 'red' }) {
  const colors = {
    green: 'bg-green-400',
    yellow: 'bg-yellow-400',
    red: 'bg-red-400',
  }
  return <span className={cn('inline-block h-3 w-3 rounded-full', colors[status])} />
}

function MilestoneStatusDot({ state }: { state: string }) {
  const color = STATE_COLORS[state] ?? STATE_COLORS.New
  return (
    <span
      className="inline-block h-3 w-3 rounded-full"
      style={{ backgroundColor: color }}
    />
  )
}

export function Reports() {
  const {
    selectedProjects,
    selectedSprint,
    selectedResource,
    showArchived,
    dateRange,
    selectedTags,
    setSelectedProjects,
    setSelectedSprint,
    setSelectedResource,
    setDateRange,
    setSelectedTags,
    toggleArchived,
    setSyncState,
  } = useUIStore()

  // ── Data fetching ──────────────────────────────────────────

  const { data: projects = [], isLoading: projectsLoading } = useProjects()

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

  const { data: iterations = [], isLoading: iterationsLoading } =
    useIterations(activeProjectNames)

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

  // Apply area path filtering, then tag filtering (both additive)
  const filteredWorkItems = useMemo(
    () => filterByTags(filterByAreaSelections(workItemsRaw, areaFilters), selectedTags),
    [workItemsRaw, areaFilters, selectedTags],
  )

  const availableTags = useMemo(
    () => collectTags(workItemsRaw),
    [workItemsRaw],
  )

  const uniqueResources = useMemo(() => {
    const map = new Map<string, { displayName: string; uniqueName: string }>()
    for (const wi of filteredWorkItems) {
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
  }, [filteredWorkItems])

  const resourceFilteredWorkItems = useMemo(
    () => selectedResource
      ? filteredWorkItems.filter((wi) => wi.assignedTo?.uniqueName === selectedResource)
      : filteredWorkItems,
    [filteredWorkItems, selectedResource],
  )

  const workItems = useMemo(() => {
    if (!dateRange) return resourceFilteredWorkItems
    const from = new Date(dateRange.from).getTime()
    const to = new Date(dateRange.to).getTime() + 86_400_000
    return resourceFilteredWorkItems.filter((wi) => {
      const d = new Date(wi.changedDate).getTime()
      return d >= from && d < to
    })
  }, [resourceFilteredWorkItems, dateRange])

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

  // ── Report resolution ──────────────────────────────────────

  const hasTags = selectedTags.length > 0
  const isSingleProject = activeProjectNames.length === 1
  const isMultiProject = activeProjectNames.length > 1
  const isCrossProjectReport = isMultiProject && hasTags
  const showMultiProjectGate = isMultiProject && !hasTags

  const reportProject = isSingleProject ? activeProjectNames[0]! : null

  const reportAreaNames = useMemo(() => {
    if (!reportProject) return []
    const filters = areaFilters.get(reportProject)
    if (!filters) return []
    return filters
      .map((sel) => getAreaNameFromSelection(sel))
      .filter((n): n is string => n != null)
  }, [reportProject, areaFilters])

  const reportAreaLabel = reportAreaNames.length > 0 ? reportAreaNames.join(', ') : null
  const reportTagLabel = hasTags ? selectedTags.map(getTagDisplayValue).join(', ') : null

  const reportSubLabel = useMemo(() => {
    const parts: string[] = []
    if (reportAreaLabel) parts.push(reportAreaLabel)
    if (reportTagLabel && !isCrossProjectReport) parts.push(reportTagLabel)
    return parts.length > 0 ? parts.join(' - ') : null
  }, [reportAreaLabel, reportTagLabel, isCrossProjectReport])

  // Wiki only loads for single-project, non-cross-project reports
  const wikiAreaName = !isCrossProjectReport && reportAreaNames.length > 0 ? reportAreaNames[0]! : null
  const { data: wikiRaw, isLoading: wikiLoading } = useProjectWiki(
    isCrossProjectReport ? null : reportProject,
    wikiAreaName,
  )

  const wikiConflict = isWikiConflict(wikiRaw) ? wikiRaw : null
  const wikiData = isWikiConflict(wikiRaw) ? undefined : wikiRaw

  const report = useProjectReport(
    workItems,
    iterations,
    isCrossProjectReport ? null : reportProject,
    isCrossProjectReport ? undefined : wikiData,
    isCrossProjectReport ? reportTagLabel ?? undefined : undefined,
  )

  const showWikiSections = !isCrossProjectReport && reportProject != null

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

  // ── Slide export ───────────────────────────────────────────
  const slideRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)

  const handleExportSlide = useCallback(async () => {
    if (!slideRef.current || !report) return
    setExporting(true)
    try {
      await document.fonts.ready
      const dataUrl = await toPng(slideRef.current, { pixelRatio: 1, width: 1280, height: 720 })
      const link = document.createElement('a')
      const today = new Date().toISOString().slice(0, 10)
      const base = reportSubLabel
        ? `${report.projectName} - ${reportSubLabel}`
        : report.projectName
      link.download = `${base} - ${today}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      toast.error('Export failed', {
        description: err instanceof Error ? err.message : 'Could not generate slide image',
      })
    } finally {
      setExporting(false)
    }
  }, [report, reportSubLabel])

  const adoBaseUrl = `https://dev.azure.com/${ADO_ORGANIZATION}`
  const groupMode = hasTags ? 'tag' as const : 'area' as const

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
          Project Reports
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
                ? 'Unable to connect to Azure DevOps. Check your PAT token.'
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
        dateRange={dateRange}
        onProjectsChange={setSelectedProjects}
        onSprintChange={setSelectedSprint}
        onResourceChange={setSelectedResource}
        onToggleArchived={toggleArchived}
        onDateRangeChange={setDateRange}
        tags={availableTags}
        selectedTags={selectedTags}
        onTagsChange={setSelectedTags}
      />

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      )}

      {/* Multi-project gate (only when no tags are filtering) */}
      {!isLoading && showMultiProjectGate && (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              Please select a single project to view its report, or select a tag to view a cross-project report.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Report card */}
      {!isLoading && !showMultiProjectGate && report && (
        <div className="space-y-6">
          {/* ── Header area ──────────────────────────────────────── */}
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3, ease: 'easeOut' }}
          >
            {/* Project title row */}
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-extrabold tracking-tight">
                  {report.projectName}{reportSubLabel ? ` - ${reportSubLabel}` : ''}
                </h2>
                <div className="flex items-center gap-1.5">
                  {(() => {
                    const docsRaw = report.wikiFields['Project Documents']
                    const docsUrl = docsRaw ? extractUrl(docsRaw) : null
                    if (!docsUrl) return null
                    return (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a
                            href={docsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-muted/50"
                          >
                            <FolderOpen className="h-4 w-4" />
                          </a>
                        </TooltipTrigger>
                        <TooltipContent>Project Documents</TooltipContent>
                      </Tooltip>
                    )
                  })()}
                  {!isCrossProjectReport && reportProject && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a
                            href={`${adoBaseUrl}/${encodeURIComponent(reportProject)}/_backlogs/backlog`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-muted/50"
                          >
                            <ClipboardList className="h-4 w-4" />
                          </a>
                        </TooltipTrigger>
                        <TooltipContent>Backlog</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a
                            href={`${adoBaseUrl}/${encodeURIComponent(reportProject)}/_boards`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-muted/50"
                          >
                            <Kanban className="h-4 w-4" />
                          </a>
                        </TooltipTrigger>
                        <TooltipContent>Board</TooltipContent>
                      </Tooltip>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium">Overall Health:</span>
                  <StatusDot status={report.overallStatus} />
                </div>
                <span className="text-xs text-muted-foreground">
                  Updated: {report.lastModified ?? '—'}
                </span>
              </div>
            </div>

            {/* Meta fields row */}
            <div className="flex items-end justify-between text-sm">
              <div className="flex gap-6">
                <MetaField label="Program Manager" value={report.programManager ?? '—'} />
                <MetaField label="Project Manager" value={report.projectManager ?? '—'} />
              </div>
              <div className="flex gap-6">
                <MetaField label="End Date" value={report.endDate ?? '—'} align="right" />
              </div>
            </div>
          </motion.div>

          {/* Wiki conflict error */}
          {wikiConflict && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3, ease: 'easeOut' }}
            >
              <Card className="border-destructive/50">
                <CardContent className="py-4">
                  <p className="text-sm font-medium text-destructive">
                    Multiple ProjectOptics pages found in the wiki:
                  </p>
                  <ul className="mt-1.5 list-disc list-inside text-sm text-muted-foreground">
                    {wikiConflict.paths.map((p) => (
                      <li key={p}><code className="text-xs">{p}</code></li>
                    ))}
                  </ul>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Please remove or rename duplicates so the report can load wiki data.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── Row 1: Accomplishments + Look Ahead (single-project with wiki only) */}
          {showWikiSections && !wikiConflict && (
            <motion.div
              className="grid grid-cols-1 lg:grid-cols-2 gap-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.3, ease: 'easeOut' }}
            >
              <Card className="py-0 gap-0">
                <CardHeader className="px-4 pt-3 pb-0">
                  <CardTitle className="text-base">Accomplishments</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 pt-1">
                  {wikiLoading ? (
                    <Skeleton className="h-20 w-full" />
                  ) : report.accomplishments ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5 [&_p]:my-1.5 leading-snug">
                      <Markdown>{report.accomplishments}</Markdown>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      —
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="py-0 gap-0">
                <CardHeader className="px-4 pt-3 pb-0">
                  <CardTitle className="text-base">
                    Look Ahead (Next 1-2 Weeks)
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 pt-1">
                  {wikiLoading ? (
                    <Skeleton className="h-20 w-full" />
                  ) : report.lookAhead ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5 [&_p]:my-1.5 leading-snug">
                      <Markdown>{report.lookAhead}</Markdown>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      —
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── Row 2: Milestones + Watch List ─────────────────── */}
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.3, ease: 'easeOut' }}
          >
            <Card className="py-0 gap-0">
              <CardHeader className="px-4 pt-3 pb-0">
                <CardTitle className="text-base">Milestones</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 pt-1">
                {report.milestones.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No active milestones
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th className="pb-2 font-medium text-muted-foreground">Name</th>
                          <th className="pb-2 font-medium text-muted-foreground text-center w-16">Status</th>
                          <th className="pb-2 font-medium text-muted-foreground text-right w-28">Target Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.milestones.map((m) => (
                          <tr key={m.id} className={cn(
                            "border-b border-border/50 last:border-0",
                            m.completed && "opacity-50",
                          )}>
                            <td className="py-2 pr-2">{m.name}</td>
                            <td className="py-2 text-center w-16">
                              <MilestoneStatusDot state={m.state} />
                            </td>
                            <td className="py-2 text-right text-muted-foreground w-28">
                              {m.targetDate ?? '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="py-0 gap-0">
              <CardHeader className="px-4 pt-3 pb-0">
                <CardTitle className="text-base">Watch List</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 pt-1">
                {report.watchList.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No open risks or issues
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th className="pb-2 font-medium text-muted-foreground">Type</th>
                          <th className="pb-2 font-medium text-muted-foreground">Title</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.watchList.map((w) => (
                          <tr key={w.id} className="border-b border-border/50 last:border-0">
                            <td className="py-2 pr-4">
                              <span
                                className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                                style={{
                                  backgroundColor:
                                    w.type === 'Issue'
                                      ? LINKED_ISSUE_COLOR
                                      : LINKED_RISK_COLOR,
                                  color: w.type === 'Issue' ? '#7f1d1d' : '#78350f',
                                }}
                              >
                                {w.type}
                              </span>
                            </td>
                            <td className="py-2 pr-4">{w.title}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Description (wiki-sourced, single-project only) */}
          {showWikiSections && !wikiConflict && report.description && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.3, ease: 'easeOut' }}
            >
              <Card className="py-0">
                <CardContent className="px-4 py-3">
                  <div className="prose prose-sm dark:prose-invert max-w-none text-center">
                    <Markdown>{report.description}</Markdown>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Export button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              disabled={exporting}
              onClick={() => { void handleExportSlide() }}
            >
              <Download className="h-4 w-4" />
              {exporting ? 'Exporting...' : 'Export Slide'}
            </Button>
          </div>

          {/* Timeline / Gantt */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.3, ease: 'easeOut' }}
          >
            <GanttChart workItems={workItems} isLoading={isLoading} groupMode={groupMode} />
          </motion.div>

          {/* Offscreen slide for image capture */}
          <div aria-hidden style={{ position: 'absolute', left: -9999, top: 0, overflow: 'hidden' }}>
            <ReportSlide ref={slideRef} report={report} areaName={reportSubLabel} />
          </div>
        </div>
      )}

      {/* No projects selected */}
      {!isLoading && activeProjectNames.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              Select at least one project to view its report
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function MetaField({ label, value, align = 'left' }: { label: string; value: string; align?: 'left' | 'right' }) {
  return (
    <div className={cn('space-y-0.5', align === 'right' && 'text-right')}>
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
      <p className="font-medium truncate" title={value}>{value}</p>
    </div>
  )
}

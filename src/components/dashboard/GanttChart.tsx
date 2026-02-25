import { useState, useMemo, useCallback, useRef } from 'react'
import { parseISO, differenceInCalendarDays, addDays, format, startOfWeek } from 'date-fns'
import { ChevronDown, ChevronsDownUp, ChevronsUpDown, FolderOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { WorkItem, WorkItemState } from '@/types/workItem'
import { cn } from '@/lib/utils'
import { getWorkItemColor } from '@/lib/colors'
import { StateFilter, ALL_STATES } from './StateFilter'
import { TypeFilter, DEFAULT_SELECTED_TYPES, AREA_PATH_KEY } from './TypeFilter'
import {
  type TreeNode,
  buildTree,
  hierarchyRank,
  groupByAreaPath,
  flattenGroupedTree,
  collectAllExpandableIds,
  filterByTypes,
} from '@/lib/workItemTree'

const ROW_HEIGHT = 36
const BAR_HEIGHT = 20
const BAR_Y_OFFSET = (ROW_HEIGHT - BAR_HEIGHT) / 2
const LABEL_WIDTH = 260
const PADDING_DAYS = 7

type ZoomLevel = 'month' | 'quarter' | 'year'
const ZOOM_PX_PER_DAY: Record<ZoomLevel, number> = {
  month: 12,
  quarter: 4,
  year: 2,
}

function sortNodes(nodes: TreeNode[]): void {
  nodes.sort((a, b) => {
    const hDiff = hierarchyRank(a.item.workItemType) - hierarchyRank(b.item.workItemType)
    if (hDiff !== 0) return hDiff
    return getStartDate(a.item).getTime() - getStartDate(b.item).getTime()
  })
  for (const n of nodes) {
    if (n.children.length > 0) sortNodes(n.children)
  }
}

function getStartDate(item: WorkItem): Date {
  return parseISO(item.activatedDate ?? item.createdDate)
}

function findInheritedEndDate(item: WorkItem, lookup: Map<number, WorkItem>): Date | null {
  const visited = new Set<number>()
  let current: WorkItem | undefined = item
  while (current?.parentId != null && !visited.has(current.parentId)) {
    visited.add(current.parentId)
    const parent = lookup.get(current.parentId)
    if (!parent) break
    if (parent.closedDate) return parseISO(parent.closedDate)
    if (parent.targetDate) return parseISO(parent.targetDate)
    current = parent
  }
  return null
}

function getEndDate(item: WorkItem, lookup?: Map<number, WorkItem>): Date {
  if (item.closedDate) return parseISO(item.closedDate)
  if (item.targetDate) return parseISO(item.targetDate)
  if (lookup) {
    const inherited = findInheritedEndDate(item, lookup)
    if (inherited) return inherited
  }
  return new Date()
}

interface TooltipData {
  item: WorkItem
  x: number
  y: number
}

interface GanttChartProps {
  workItems: WorkItem[]
  isLoading?: boolean
  error?: Error | null
}

export function GanttChart({ workItems, isLoading, error }: GanttChartProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('quarter')
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(() => new Set(DEFAULT_SELECTED_TYPES))
  const [selectedStates, setSelectedStates] = useState<Set<WorkItemState>>(() => new Set(ALL_STATES))
  const containerRef = useRef<HTMLDivElement>(null)

  const parentLookup = useMemo(() => {
    const map = new Map<number, WorkItem>()
    for (const wi of workItems) map.set(wi.id, wi)
    return map
  }, [workItems])

  const stateFilteredItems = useMemo(() => {
    if (selectedStates.size === ALL_STATES.length) return workItems
    return workItems.filter((wi) => selectedStates.has(wi.state as WorkItemState))
  }, [workItems, selectedStates])

  const groups = useMemo(() => {
    const filtered = filterByTypes(stateFilteredItems, selectedTypes)
    const roots = buildTree(filtered)
    sortNodes(roots)
    if (selectedTypes.has(AREA_PATH_KEY)) {
      const grouped = groupByAreaPath(roots)
      for (const g of grouped) sortNodes(g.roots)
      return grouped
    }
    return [{ groupId: '', label: '', roots }]
  }, [stateFilteredItems, selectedTypes])

  const groupDateRanges = useMemo(() => {
    const ranges = new Map<string, { start: Date; end: Date }>()
    function walkNodes(nodes: TreeNode[], min: { v: number }, max: { v: number }): void {
      for (const node of nodes) {
        const s = getStartDate(node.item).getTime()
        const e = getEndDate(node.item, parentLookup).getTime()
        if (s < min.v) min.v = s
        if (e > max.v) max.v = e
        if (node.children.length > 0) walkNodes(node.children, min, max)
      }
    }
    for (const group of groups) {
      if (!group.label) continue
      const min = { v: Infinity }
      const max = { v: -Infinity }
      walkNodes(group.roots, min, max)
      if (min.v !== Infinity) {
        ranges.set(group.groupId, { start: new Date(min.v), end: new Date(max.v) })
      }
    }
    return ranges
  }, [groups, parentLookup])

  const visibleRows = useMemo(
    () => flattenGroupedTree(groups, expandedIds),
    [groups, expandedIds],
  )

  const pxPerDay = ZOOM_PX_PER_DAY[zoomLevel]

  const { rangeStart, totalDays } = useMemo(() => {
    let minDate = Infinity
    let maxDate = -Infinity
    for (const row of visibleRows) {
      if (row.kind === 'item') {
        const s = getStartDate(row.item).getTime()
        const e = getEndDate(row.item, parentLookup).getTime()
        if (s < minDate) minDate = s
        if (e > maxDate) maxDate = e
      } else {
        const range = groupDateRanges.get(row.groupId)
        if (range) {
          if (range.start.getTime() < minDate) minDate = range.start.getTime()
          if (range.end.getTime() > maxDate) maxDate = range.end.getTime()
        }
      }
    }
    if (minDate === Infinity) {
      return { rangeStart: new Date(), totalDays: 30 }
    }
    const padded_start = addDays(new Date(minDate), -PADDING_DAYS)
    const padded_end = addDays(new Date(maxDate), PADDING_DAYS)
    const days = Math.max(differenceInCalendarDays(padded_end, padded_start), 14)
    return { rangeStart: padded_start, totalDays: days }
  }, [visibleRows, groupDateRanges, parentLookup])

  const timelineWidth = totalDays * pxPerDay

  const MIN_LABEL_GAP = 70

  const monthMarkers = useMemo(() => {
    const markers: { label: string; x: number }[] = []
    let d = startOfWeek(rangeStart, { weekStartsOn: 1 })
    const end = addDays(rangeStart, totalDays)
    let lastMonth = -1
    let lastX = -Infinity
    while (d <= end) {
      if (d.getMonth() !== lastMonth && d >= rangeStart) {
        lastMonth = d.getMonth()
        const x = differenceInCalendarDays(d, rangeStart) * pxPerDay
        if (x - lastX >= MIN_LABEL_GAP) {
          markers.push({ label: format(d, 'MMM yyyy'), x })
          lastX = x
        }
      }
      d = addDays(d, 7)
    }
    return markers
  }, [rangeStart, totalDays, pxPerDay])

  const weekLines = useMemo(() => {
    const lines: number[] = []
    let d = startOfWeek(addDays(rangeStart, 7), { weekStartsOn: 1 })
    const end = addDays(rangeStart, totalDays)
    while (d <= end) {
      lines.push(differenceInCalendarDays(d, rangeStart) * pxPerDay)
      d = addDays(d, 7)
    }
    return lines
  }, [rangeStart, totalDays, pxPerDay])

  const todayX = useMemo(() => {
    const days = differenceInCalendarDays(new Date(), rangeStart)
    if (days < 0 || days > totalDays) return null
    return days * pxPerDay
  }, [rangeStart, totalDays, pxPerDay])

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const allExpandableIds = useMemo(
    () => collectAllExpandableIds(groups),
    [groups],
  )

  const isExpanded = expandedIds.size > 0

  const toggleExpandAll = useCallback(() => {
    setExpandedIds((prev) =>
      prev.size > 0 ? new Set() : new Set(allExpandableIds),
    )
  }, [allExpandableIds])

  const handleBarHover = useCallback(
    (item: WorkItem, e: React.MouseEvent) => {
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      const rawX = e.clientX - rect.left
      const clampedX = Math.min(rawX + 12, container.clientWidth - 270)
      setTooltip({
        item,
        x: clampedX,
        y: e.clientY - rect.top + 12,
      })
    },
    [],
  )

  const handleBarLeave = useCallback(() => setTooltip(null), [])

  const itemsWithDates = stateFilteredItems.filter(
    (wi) => wi.activatedDate || wi.createdDate,
  )

  const chartHeight = visibleRows.length * ROW_HEIGHT
  const hasContent = !isLoading && itemsWithDates.length > 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Timeline</CardTitle>
        <div className="flex items-center gap-2">
          <TypeFilter selected={selectedTypes} onChange={setSelectedTypes} />
          <StateFilter selected={selectedStates} onChange={setSelectedStates} />
          <Select value={zoomLevel} onValueChange={(v) => setZoomLevel(v as ZoomLevel)}>
            <SelectTrigger className="h-7 w-[100px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="quarter">Quarter</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={toggleExpandAll}>
            {isExpanded ? (
              <><ChevronsDownUp className="h-3.5 w-3.5 mr-1" />Collapse</>
            ) : (
              <><ChevronsUpDown className="h-3.5 w-3.5 mr-1" />Expand</>
            )}
          </Button>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {itemsWithDates.length} items
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="h-32 flex flex-col items-center justify-center gap-1 text-sm">
            <span className="text-destructive font-medium">Failed to load timeline</span>
            <span className="text-muted-foreground">{error.message}</span>
          </div>
        ) : !hasContent ? (
          <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
            No items with date data to display
          </div>
        ) : (
        <div ref={containerRef} className="relative rounded-md border overflow-hidden">
          <div className="flex">
            {/* Left label column */}
            <div
              className="shrink-0 border-r bg-background z-10"
              style={{ width: LABEL_WIDTH }}
            >
              {/* Header spacer */}
              <div className="h-8 border-b px-2 flex items-center">
                <span className="text-xs font-medium text-muted-foreground">
                  Work Item
                </span>
              </div>
              {/* Today strip spacer */}
              <div className="h-5 border-b bg-muted/20" />
              {/* Rows */}
              {visibleRows.map((row) => {
                if (row.kind === 'group') {
                  return (
                    <div
                      key={row.groupId}
                      className="flex items-center gap-1.5 border-b px-2 bg-muted/40 hover:bg-muted/60 transition-colors"
                      style={{ height: ROW_HEIGHT, paddingLeft: '8px' }}
                    >
                      <button
                        onClick={() => toggleExpand(row.groupId)}
                        className="shrink-0 p-0.5 rounded hover:bg-muted transition-colors"
                      >
                        <ChevronDown
                          className={cn(
                            'h-3.5 w-3.5 text-muted-foreground transition-transform duration-150',
                            !expandedIds.has(row.groupId) && '-rotate-90',
                          )}
                        />
                      </button>
                      <FolderOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate text-xs font-semibold" title={row.label}>
                        {row.label}
                      </span>
                    </div>
                  )
                }

                const { item, depth, hasChildren } = row
                const expandId = `wi:${item.id}`

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-center gap-1 border-b px-2 hover:bg-muted/50 transition-colors',
                      depth > 0 && 'bg-muted/20',
                    )}
                    style={{ height: ROW_HEIGHT, paddingLeft: `${8 + depth * 16}px` }}
                  >
                    {hasChildren ? (
                      <button
                        onClick={() => toggleExpand(expandId)}
                        className="shrink-0 p-0.5 rounded hover:bg-muted transition-colors"
                      >
                        <ChevronDown
                          className={cn(
                            'h-3.5 w-3.5 text-muted-foreground transition-transform duration-150',
                            !expandedIds.has(expandId) && '-rotate-90',
                          )}
                        />
                      </button>
                    ) : (
                      <span className="shrink-0 w-4" />
                    )}
                    <Badge
                      variant="outline"
                      className="shrink-0 text-[10px] px-1 py-0 font-normal leading-tight"
                    >
                      {item.workItemType === 'User Story' ? 'Story' : item.workItemType}
                    </Badge>
                    <span
                      className={cn(
                        'truncate text-xs',
                        hasChildren ? 'font-semibold' : 'font-normal',
                      )}
                      title={item.title}
                    >
                      {item.title}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Right timeline area */}
            <div className="overflow-x-auto flex-1 min-w-0">
              {/* Month header */}
              <div className="h-8 border-b relative" style={{ width: timelineWidth }}>
                {monthMarkers.map((m, i) => (
                  <span
                    key={i}
                    className="absolute top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground whitespace-nowrap"
                    style={{ left: m.x + 4 }}
                  >
                    {m.label}
                  </span>
                ))}
              </div>

              {/* Today indicator strip */}
              <div className="h-5 border-b relative bg-muted/20" style={{ width: timelineWidth }}>
                {todayX !== null && (
                  <span
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-[9px] font-semibold text-red-500 whitespace-nowrap"
                    style={{ left: todayX }}
                  >
                    Today
                  </span>
                )}
              </div>

              {/* Chart body */}
              <div className="relative" style={{ width: timelineWidth, height: chartHeight }}>
                {/* Week gridlines */}
                {weekLines.map((x, i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 border-l border-dashed border-border/40"
                    style={{ left: x }}
                  />
                ))}

                {/* Row backgrounds + bars */}
                {visibleRows.map((row, idx) => {
                  const y = idx * ROW_HEIGHT

                  if (row.kind === 'group') {
                    const range = groupDateRanges.get(row.groupId)
                    let groupBar: React.ReactNode = null
                    if (range) {
                      const sDays = differenceInCalendarDays(range.start, rangeStart)
                      const eDays = differenceInCalendarDays(range.end, rangeStart)
                      const gLeft = Math.max(0, sDays * pxPerDay)
                      const gWidth = Math.max(4, (eDays - Math.max(0, sDays)) * pxPerDay)
                      groupBar = (
                        <div
                          className="absolute rounded-sm opacity-50"
                          style={{
                            left: gLeft,
                            top: BAR_Y_OFFSET,
                            width: gWidth,
                            height: BAR_HEIGHT,
                            backgroundColor: '#94a3b8',
                          }}
                        />
                      )
                    }
                    return (
                      <div
                        key={row.groupId}
                        className="absolute left-0 right-0 border-b bg-muted/40"
                        style={{ top: y, height: ROW_HEIGHT }}
                      >
                        {groupBar}
                      </div>
                    )
                  }

                  const { item, depth } = row
                  const startDays = differenceInCalendarDays(getStartDate(item), rangeStart)
                  const endDays = differenceInCalendarDays(getEndDate(item, parentLookup), rangeStart)
                  const barLeft = Math.max(0, startDays * pxPerDay)
                  const barWidth = Math.max(4, (endDays - Math.max(0, startDays)) * pxPerDay)
                  const color = getWorkItemColor(item)

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'absolute left-0 right-0 border-b',
                        depth > 0 && 'bg-muted/20',
                      )}
                      style={{ top: y, height: ROW_HEIGHT }}
                    >
                      <div
                        className="absolute rounded-sm cursor-pointer shadow-sm transition-opacity hover:opacity-80"
                        style={{
                          left: barLeft,
                          top: BAR_Y_OFFSET,
                          width: barWidth,
                          height: BAR_HEIGHT,
                          backgroundColor: color,
                        }}
                        onMouseEnter={(e) => handleBarHover(item, e)}
                        onMouseMove={(e) => handleBarHover(item, e)}
                        onMouseLeave={handleBarLeave}
                      />
                    </div>
                  )
                })}

                {/* Today vertical line */}
                {todayX !== null && (
                  <div
                    className="absolute top-0 bottom-0 w-px border-l-2 border-dashed border-red-500/70 z-10 pointer-events-none"
                    style={{ left: todayX }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Tooltip */}
          {tooltip && (
            <div
              className="absolute z-50 pointer-events-none bg-popover border rounded-lg shadow-lg p-3 text-xs max-w-[260px]"
              style={{
                left: tooltip.x,
                top: tooltip.y,
              }}
            >
              <p className="font-semibold truncate">{tooltip.item.title}</p>
              <div className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-muted-foreground">
                <span>Type</span>
                <span className="text-foreground">{tooltip.item.workItemType}</span>
                <span>State</span>
                <span className="text-foreground">{tooltip.item.state}</span>
                <span>Start</span>
                <span className="text-foreground">
                  {format(getStartDate(tooltip.item), 'MMM d, yyyy')}
                </span>
                <span>End</span>
                <span className="text-foreground">
                  {(() => {
                    if (tooltip.item.closedDate)
                      return format(parseISO(tooltip.item.closedDate), 'MMM d, yyyy')
                    if (tooltip.item.targetDate)
                      return `${format(parseISO(tooltip.item.targetDate), 'MMM d, yyyy')} (target)`
                    const inherited = findInheritedEndDate(tooltip.item, parentLookup)
                    if (inherited)
                      return `${format(inherited, 'MMM d, yyyy')} (inherited)`
                    return 'In progress'
                  })()}
                </span>
                {tooltip.item.assignedTo && (
                  <>
                    <span>Assigned</span>
                    <span className="text-foreground truncate">
                      {tooltip.item.assignedTo.displayName}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        )}
      </CardContent>
    </Card>
  )
}

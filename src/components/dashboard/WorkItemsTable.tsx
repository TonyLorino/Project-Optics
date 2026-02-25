import { useState, useMemo, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  ExternalLink,
  FolderOpen,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { WorkItem, WorkItemState } from '@/types/workItem'
import { cn } from '@/lib/utils'
import { TABLE_PAGE_SIZE, ADO_ORGANIZATION } from '@/lib/constants'
import { getWorkItemBgClass } from '@/lib/colors'
import { StateFilter, ALL_STATES } from './StateFilter'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  type TreeNode,
  type TopLevel,
  buildTree,
  hierarchyRank,
  groupByAreaPath,
  flattenGroupedTree,
  collectAllExpandableIds,
  filterByTopLevel,
  TOP_LEVEL_OPTIONS,
} from '@/lib/workItemTree'

const PAGE_SIZE = TABLE_PAGE_SIZE

type SortKey = 'id' | 'title' | 'state' | 'workItemType' | 'assignedTo' | 'storyPoints' | 'changedDate'
type SortDir = 'asc' | 'desc'

function compareBySortKey(a: WorkItem, b: WorkItem, sortKey: SortKey, sortDir: SortDir): number {
  let cmp = 0
  switch (sortKey) {
    case 'id':
      cmp = a.id - b.id
      break
    case 'title':
      cmp = a.title.localeCompare(b.title)
      break
    case 'state':
      cmp = a.state.localeCompare(b.state)
      break
    case 'workItemType':
      cmp = a.workItemType.localeCompare(b.workItemType)
      break
    case 'assignedTo':
      cmp = (a.assignedTo?.displayName ?? '').localeCompare(b.assignedTo?.displayName ?? '')
      break
    case 'storyPoints':
      cmp = (a.storyPoints ?? 0) - (b.storyPoints ?? 0)
      break
    case 'changedDate':
      cmp = new Date(a.changedDate).getTime() - new Date(b.changedDate).getTime()
      break
  }
  return sortDir === 'asc' ? cmp : -cmp
}

function sortNodes(nodes: TreeNode[], sortKey: SortKey, sortDir: SortDir): void {
  nodes.sort((a, b) => {
    const hDiff = hierarchyRank(a.item.workItemType) - hierarchyRank(b.item.workItemType)
    if (hDiff !== 0) return hDiff
    return compareBySortKey(a.item, b.item, sortKey, sortDir)
  })
  for (const node of nodes) {
    if (node.children.length > 0) sortNodes(node.children, sortKey, sortDir)
  }
}

interface WorkItemsTableProps {
  workItems: WorkItem[]
  isLoading?: boolean
  error?: Error | null
}

export function WorkItemsTable({
  workItems,
  isLoading,
  error,
}: WorkItemsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('id')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(0)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())
  const [topLevel, setTopLevel] = useState<TopLevel>('Area Path')
  const [selectedStates, setSelectedStates] = useState<Set<WorkItemState>>(() => new Set(ALL_STATES))

  const stateFilteredItems = useMemo(() => {
    if (selectedStates.size === ALL_STATES.length) return workItems
    return workItems.filter((wi) => selectedStates.has(wi.state as WorkItemState))
  }, [workItems, selectedStates])

  const groups = useMemo(() => {
    const filtered = filterByTopLevel(stateFilteredItems, topLevel)
    const roots = buildTree(filtered)
    sortNodes(roots, sortKey, sortDir)
    if (topLevel === 'Area Path') {
      const grouped = groupByAreaPath(roots)
      for (const g of grouped) sortNodes(g.roots, sortKey, sortDir)
      return grouped
    }
    return [{ groupId: '', label: '', roots }]
  }, [stateFilteredItems, sortKey, sortDir, topLevel])

  const visibleRows = useMemo(
    () => flattenGroupedTree(groups, expandedIds),
    [groups, expandedIds],
  )

  const totalPages = Math.ceil(visibleRows.length / PAGE_SIZE)
  const pageRows = visibleRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

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

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
    setPage(0)
  }

  function SortableHead({
    label,
    field,
    className,
  }: {
    label: string
    field: SortKey
    className?: string
  }) {
    return (
      <TableHead
        className={className}
        aria-sort={sortKey === field ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      >
        <button
          className="flex items-center gap-1 hover:text-foreground transition-colors"
          onClick={() => toggleSort(field)}
        >
          {label}
          <ArrowUpDown className="h-3 w-3" />
        </button>
      </TableHead>
    )
  }

  const hasContent = !isLoading && stateFilteredItems.length > 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Work Items</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={topLevel} onValueChange={(v) => setTopLevel(v as TopLevel)}>
            <SelectTrigger className="h-7 w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TOP_LEVEL_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <StateFilter selected={selectedStates} onChange={setSelectedStates} />
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={toggleExpandAll}>
            {isExpanded ? (
              <><ChevronsDownUp className="h-3.5 w-3.5 mr-1" />Collapse</>
            ) : (
              <><ChevronsUpDown className="h-3.5 w-3.5 mr-1" />Expand</>
            )}
          </Button>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {stateFilteredItems.length} items
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="h-32 flex flex-col items-center justify-center gap-1 text-sm">
            <span className="text-destructive font-medium">Failed to load work items</span>
            <span className="text-muted-foreground">{error.message}</span>
          </div>
        ) : !hasContent ? (
          <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
            No work items found
          </div>
        ) : (
        <>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead label="ID" field="id" className="w-[80px]" />
                <SortableHead label="Title" field="title" />
                <SortableHead
                  label="Type"
                  field="workItemType"
                  className="hidden md:table-cell"
                />
                <SortableHead label="State" field="state" />
                <SortableHead
                  label="Assigned To"
                  field="assignedTo"
                  className="hidden lg:table-cell"
                />
                <SortableHead
                  label="Points"
                  field="storyPoints"
                  className="hidden sm:table-cell w-[80px]"
                />
                <SortableHead
                  label="Updated"
                  field="changedDate"
                  className="hidden md:table-cell"
                />
                <TableHead className="w-[40px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((row) => {
                if (row.kind === 'group') {
                  return (
                    <TableRow key={row.groupId} className="bg-muted/40 hover:bg-muted/60">
                      <TableCell colSpan={8}>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => toggleExpand(row.groupId)}
                            className="shrink-0 p-0.5 rounded hover:bg-muted transition-colors"
                            aria-label={expandedIds.has(row.groupId) ? 'Collapse' : 'Expand'}
                          >
                            <ChevronDown
                              className={cn(
                                'h-4 w-4 text-muted-foreground transition-transform duration-150',
                                !expandedIds.has(row.groupId) && '-rotate-90',
                              )}
                            />
                          </button>
                          <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-semibold text-sm">{row.label}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                }

                const { item, depth, hasChildren } = row
                const expandId = `wi:${item.id}`

                return (
                  <TableRow
                    key={item.id}
                    className={cn(
                      'group',
                      depth > 0 && 'bg-muted/30',
                    )}
                  >
                    <TableCell className="font-mono text-xs">
                      {item.id}
                    </TableCell>
                    <TableCell className="max-w-[400px] font-medium">
                      <div
                        className="flex items-center gap-1"
                        style={{ paddingLeft: `${depth * 24}px` }}
                      >
                        {hasChildren ? (
                          <button
                            onClick={() => toggleExpand(expandId)}
                            className="shrink-0 p-0.5 rounded hover:bg-muted transition-colors"
                            aria-label={expandedIds.has(expandId) ? 'Collapse' : 'Expand'}
                          >
                            <ChevronDown
                              className={cn(
                                'h-4 w-4 text-muted-foreground transition-transform duration-150',
                                !expandedIds.has(expandId) && '-rotate-90',
                              )}
                            />
                          </button>
                        ) : (
                          <span className="shrink-0 w-5" />
                        )}
                        <span className={cn('truncate', hasChildren && 'font-semibold')} title={item.title}>
                          {item.title}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="text-xs font-normal">
                        {item.workItemType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs border-transparent',
                          getWorkItemBgClass(item),
                        )}
                      >
                        {item.state}
                        {(item.hasLinkedIssue || item.workItemType === 'Issue') && ' (Issue)'}
                        {(item.hasLinkedRisk || item.workItemType === 'Risk') && ' (Risk)'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">
                      {item.assignedTo?.displayName ?? (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-center">
                      {item.storyPoints ?? '-'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {format(parseISO(item.changedDate), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <a
                        href={`https://dev.azure.com/${ADO_ORGANIZATION}/${encodeURIComponent(item.projectName)}/_workitems/edit/${item.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                      </a>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        </>
        )}
      </CardContent>
    </Card>
  )
}

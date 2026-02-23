import { Fragment, useState, useMemo, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Link2,
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
import { TABLE_PAGE_SIZE } from '@/lib/constants'
import { RAID_CATEGORY_COLORS, STATE_BG_CLASSES } from '@/lib/colors'
import { StateFilter, ALL_STATES } from '@/components/dashboard/StateFilter'
import { RaidTypeFilter } from './RaidTypeFilter'
import {
  isRaidItem,
  getRaidCategory,
  ALL_RAID_CATEGORIES,
  type RaidCategory,
} from '@/lib/raidHelpers'

const PAGE_SIZE = TABLE_PAGE_SIZE

type SortKey = 'id' | 'title' | 'state' | 'category' | 'priority' | 'assignedTo' | 'age' | 'createdDate'
type SortDir = 'asc' | 'desc'

function daysSince(dateStr: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000))
}

interface RaidRow {
  item: WorkItem
  category: RaidCategory
  age: number
}

interface RaidTableProps {
  workItems: WorkItem[]
  allWorkItems: WorkItem[]
  isLoading?: boolean
  error?: Error | null
  organization?: string
}

export function RaidTable({
  workItems,
  allWorkItems,
  isLoading,
  error,
  organization = import.meta.env.VITE_ADO_ORGANIZATION as string ?? 'CorporateDataOffice',
}: RaidTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('createdDate')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(0)
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set())
  const [selectedTypes, setSelectedTypes] = useState<Set<RaidCategory>>(() => new Set(ALL_RAID_CATEGORIES))
  const [selectedStates, setSelectedStates] = useState<Set<WorkItemState>>(() => new Set(ALL_STATES))
  const [showImpacted, setShowImpacted] = useState(false)

  const parentLookup = useMemo(() => {
    const map = new Map<number, WorkItem>()
    for (const wi of allWorkItems) map.set(wi.id, wi)
    return map
  }, [allWorkItems])

  const raidRows: RaidRow[] = useMemo(() => {
    if (showImpacted) {
      return workItems
        .filter((wi) => !isRaidItem(wi) && (wi.hasLinkedIssue || wi.hasLinkedRisk))
        .map((wi) => ({
          item: wi,
          category: (wi.hasLinkedIssue ? 'Issue' : 'Risk') as RaidCategory,
          age: daysSince(wi.createdDate),
        }))
    }

    return workItems
      .filter((wi) => {
        const cat = getRaidCategory(wi)
        if (!cat) return false
        if (!selectedTypes.has(cat)) return false
        if (!selectedStates.has(wi.state as WorkItemState)) return false
        return true
      })
      .map((wi) => ({
        item: wi,
        category: getRaidCategory(wi)!,
        age: daysSince(wi.createdDate),
      }))
  }, [workItems, selectedTypes, selectedStates, showImpacted])

  const sortedRows = useMemo(() => {
    const rows = [...raidRows]
    rows.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'id':
          cmp = a.item.id - b.item.id
          break
        case 'title':
          cmp = a.item.title.localeCompare(b.item.title)
          break
        case 'state':
          cmp = a.item.state.localeCompare(b.item.state)
          break
        case 'category':
          cmp = a.category.localeCompare(b.category)
          break
        case 'priority':
          cmp = (a.item.priority ?? 99) - (b.item.priority ?? 99)
          break
        case 'assignedTo':
          cmp = (a.item.assignedTo?.displayName ?? '').localeCompare(b.item.assignedTo?.displayName ?? '')
          break
        case 'age':
          cmp = a.age - b.age
          break
        case 'createdDate':
          cmp = new Date(a.item.createdDate).getTime() - new Date(b.item.createdDate).getTime()
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return rows
  }, [raidRows, sortKey, sortDir])

  const totalPages = Math.ceil(sortedRows.length / PAGE_SIZE)
  const pageRows = sortedRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const toggleExpand = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

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

  const hasContent = !isLoading && sortedRows.length > 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">
          {showImpacted ? 'Impacted Work Items' : 'RAID Log'}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant={showImpacted ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => { setShowImpacted((v) => !v); setPage(0) }}
          >
            <Link2 className="h-3.5 w-3.5 mr-1" />
            {showImpacted ? 'Show RAID Items' : 'Show Impacted'}
          </Button>
          {!showImpacted && (
            <>
              <RaidTypeFilter selected={selectedTypes} onChange={(v) => { setSelectedTypes(v); setPage(0) }} />
              <StateFilter selected={selectedStates} onChange={(v) => { setSelectedStates(v); setPage(0) }} />
            </>
          )}
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {sortedRows.length} items
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
            <span className="text-destructive font-medium">Failed to load RAID items</span>
            <span className="text-muted-foreground">{error.message}</span>
          </div>
        ) : !hasContent ? (
          <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
            {showImpacted ? 'No impacted work items found' : 'No RAID items found'}
          </div>
        ) : (
          <>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHead label="ID" field="id" className="w-[80px]" />
                    <SortableHead label="Type" field="category" className="w-[140px]" />
                    <SortableHead label="Title" field="title" />
                    <SortableHead label="State" field="state" className="w-[100px]" />
                    <SortableHead label="Priority" field="priority" className="hidden sm:table-cell w-[90px]" />
                    <SortableHead label="Owner" field="assignedTo" className="hidden lg:table-cell" />
                    <SortableHead label="Age" field="age" className="hidden md:table-cell w-[70px]" />
                    <SortableHead label="Created" field="createdDate" className="hidden md:table-cell" />
                    <TableHead className="w-[40px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((row) => {
                    const { item, category, age } = row
                    const parent = item.parentId ? parentLookup.get(item.parentId) : undefined
                    const isExpanded = expandedIds.has(item.id)

                    return (
                      <Fragment key={item.id}>
                        <TableRow className="group">
                          <TableCell className="font-mono text-xs">
                            {item.id}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="text-xs border-transparent font-normal"
                              style={{
                                backgroundColor: `${RAID_CATEGORY_COLORS[category]}33`,
                                color: 'inherit',
                              }}
                            >
                              <span
                                className="h-2 w-2 rounded-full shrink-0 mr-1.5"
                                style={{ backgroundColor: RAID_CATEGORY_COLORS[category] }}
                              />
                              {category}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[400px] font-medium">
                            <div className="flex items-center gap-1">
                              {parent && (
                                <button
                                  onClick={() => toggleExpand(item.id)}
                                  className="shrink-0 p-0.5 rounded hover:bg-muted transition-colors"
                                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                                >
                                  <ChevronDown
                                    className={cn(
                                      'h-4 w-4 text-muted-foreground transition-transform duration-150',
                                      !isExpanded && '-rotate-90',
                                    )}
                                  />
                                </button>
                              )}
                              {!parent && <span className="shrink-0 w-5" />}
                              <span className="truncate" title={item.title}>
                                {item.title}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs border-transparent',
                                STATE_BG_CLASSES[item.state] ?? STATE_BG_CLASSES.New,
                              )}
                            >
                              {item.state}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm">
                            {item.priority != null ? `P${item.priority}` : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm">
                            {item.assignedTo?.displayName ?? (
                              <span className="text-muted-foreground">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                            {age}d
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                            {format(parseISO(item.createdDate), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <a
                              href={`https://dev.azure.com/${organization}/${encodeURIComponent(item.projectName)}/_workitems/edit/${item.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                            </a>
                          </TableCell>
                        </TableRow>
                        {isExpanded && parent && (
                          <TableRow className="bg-muted/30">
                            <TableCell className="font-mono text-xs text-muted-foreground pl-8">
                              {parent.id}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs font-normal">
                                {parent.workItemType}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[400px]" colSpan={2}>
                              <div className="flex items-center gap-1.5 pl-6 text-sm text-muted-foreground">
                                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">Parent:</span>
                                <span className="truncate" title={parent.title}>{parent.title}</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                              {parent.priority != null ? `P${parent.priority}` : '-'}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                              {parent.assignedTo?.displayName ?? 'Unassigned'}
                            </TableCell>
                            <TableCell className="hidden md:table-cell" />
                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                              {format(parseISO(parent.createdDate), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>
                              <a
                                href={`https://dev.azure.com/${organization}/${encodeURIComponent(parent.projectName)}/_workitems/edit/${parent.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                              </a>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
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

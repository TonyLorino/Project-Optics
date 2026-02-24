import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartTooltip } from '@/components/dashboard/ChartTooltip'
import type { WorkItem } from '@/types/workItem'
import { isRaidItem } from '@/lib/raidHelpers'

interface RaidAssigneeChartProps {
  workItems: WorkItem[]
  isLoading?: boolean
}

const MAX_BARS = 8
const OPEN_STATES = new Set(['New', 'Active'])

export function RaidAssigneeChart({ workItems, isLoading }: RaidAssigneeChartProps) {
  const data = useMemo(() => {
    const open = workItems.filter((wi) => isRaidItem(wi) && OPEN_STATES.has(wi.state))
    const counts = new Map<string, number>()
    for (const wi of open) {
      const name = wi.assignedTo?.displayName ?? 'Unassigned'
      counts.set(name, (counts.get(name) ?? 0) + 1)
    }
    const sorted = Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    if (sorted.length <= MAX_BARS) return sorted

    const top = sorted.slice(0, MAX_BARS - 1)
    const otherCount = sorted.slice(MAX_BARS - 1).reduce((s, d) => s + d.count, 0)
    return [...top, { name: 'Other', count: otherCount }]
  }, [workItems])

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Watch List by Assignee</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-[250px] w-full" /></CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Watch List by Assignee</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
            No open items
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Watch List by Assignee</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={<ChartTooltip formatRows={(p) =>
                p?.map((e) => ({ label: String(e.name ?? ''), value: `${e.value} items` })) ?? []
              } />}
            />
            <Bar
              dataKey="count"
              fill="#93c5fd"
              radius={[0, 4, 4, 0]}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

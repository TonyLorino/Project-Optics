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
import { ChartTooltip, ChartBarCursor } from '@/components/dashboard/ChartTooltip'
import type { WorkItem } from '@/types/workItem'
import { isRaidItem } from '@/lib/raidHelpers'

interface RaidProjectChartProps {
  workItems: WorkItem[]
  isLoading?: boolean
}

export function RaidProjectChart({ workItems, isLoading }: RaidProjectChartProps) {
  const data = useMemo(() => {
    const raidItems = workItems.filter(isRaidItem)
    const counts = new Map<string, number>()
    for (const wi of raidItems) {
      counts.set(wi.projectName, (counts.get(wi.projectName) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([project, count]) => ({ project, count }))
      .sort((a, b) => b.count - a.count)
  }, [workItems])

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Watch List by Project</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-[250px] w-full" /></CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Watch List by Project</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
            No items found
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Watch List by Project</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 24, left: -16 }}>
            <XAxis
              dataKey="project"
              tick={{ fontSize: 11, dy: 8 }}
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-35}
              textAnchor="end"
              height={48}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <Tooltip
              content={<ChartTooltip formatRows={(p) =>
                p?.map((e) => ({ label: String(e.name ?? ''), value: `${e.value} items` })) ?? []
              } />}
              cursor={<ChartBarCursor />}
            />
            <Bar
              dataKey="count"
              fill="#c4b5fd"
              radius={[4, 4, 0, 0]}
              animationDuration={800}
              animationEasing="ease-out"
              activeBar={{ fillOpacity: 0.8 }}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

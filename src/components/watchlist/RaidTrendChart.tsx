import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { startOfWeek, subWeeks, format, parseISO } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartTooltip } from '@/components/dashboard/ChartTooltip'
import type { WorkItem } from '@/types/workItem'
import { isRaidItem } from '@/lib/raidHelpers'

interface RaidTrendChartProps {
  workItems: WorkItem[]
  isLoading?: boolean
}

const WEEKS = 12

export function RaidTrendChart({ workItems, isLoading }: RaidTrendChartProps) {
  const data = useMemo(() => {
    const raidItems = workItems.filter(isRaidItem)
    const now = new Date()
    const startBound = startOfWeek(subWeeks(now, WEEKS - 1), { weekStartsOn: 1 })

    const buckets = new Map<string, { created: number; resolved: number }>()
    for (let i = 0; i < WEEKS; i++) {
      const weekStart = startOfWeek(subWeeks(now, WEEKS - 1 - i), { weekStartsOn: 1 })
      buckets.set(format(weekStart, 'yyyy-MM-dd'), { created: 0, resolved: 0 })
    }

    for (const wi of raidItems) {
      const createdWeek = format(startOfWeek(parseISO(wi.createdDate), { weekStartsOn: 1 }), 'yyyy-MM-dd')
      if (createdWeek >= format(startBound, 'yyyy-MM-dd')) {
        const bucket = buckets.get(createdWeek)
        if (bucket) bucket.created++
      }

      const resolvedDate = wi.closedDate ?? wi.resolvedDate
      if (resolvedDate) {
        const resolvedWeek = format(startOfWeek(parseISO(resolvedDate), { weekStartsOn: 1 }), 'yyyy-MM-dd')
        if (resolvedWeek >= format(startBound, 'yyyy-MM-dd')) {
          const bucket = buckets.get(resolvedWeek)
          if (bucket) bucket.resolved++
        }
      }
    }

    return Array.from(buckets.entries()).map(([week, counts]) => ({
      week: format(parseISO(week), 'MMM d'),
      created: counts.created,
      resolved: counts.resolved,
    }))
  }, [workItems])

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Created vs Resolved</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-[250px] w-full" /></CardContent>
      </Card>
    )
  }

  const hasData = data.some((d) => d.created > 0 || d.resolved > 0)

  if (!hasData) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Created vs Resolved</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
            No trend data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Created vs Resolved</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <XAxis dataKey="week" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <Tooltip
              content={<ChartTooltip formatRows={(p) =>
                p?.map((e) => ({
                  label: String(e.name ?? ''),
                  value: `${e.value}`,
                  color: e.color,
                })) ?? []
              } />}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} iconType="circle" iconSize={8} />
            <Area
              type="monotone"
              dataKey="created"
              name="Created"
              stroke="#fca5a5"
              fill="#fca5a5"
              fillOpacity={0.2}
              strokeWidth={2}
              animationDuration={800}
            />
            <Area
              type="monotone"
              dataKey="resolved"
              name="Resolved"
              stroke="#86efac"
              fill="#86efac"
              fillOpacity={0.2}
              strokeWidth={2}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

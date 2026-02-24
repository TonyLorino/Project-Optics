import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartTooltip } from '@/components/dashboard/ChartTooltip'
import type { WorkItem } from '@/types/workItem'

interface RaidAgeChartProps {
  workItems: WorkItem[]
  isLoading?: boolean
}

const OPEN_STATES = new Set(['New', 'Active'])

const BUCKETS = [
  { label: '< 7d', max: 7 },
  { label: '7-30d', max: 30 },
  { label: '30-90d', max: 90 },
  { label: '90d+', max: Infinity },
] as const

const BUCKET_COLORS = ['#86efac', '#93c5fd', '#fde68a', '#fca5a5']

function daysSince(dateStr: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000))
}

export function RaidAgeChart({ workItems, isLoading }: RaidAgeChartProps) {
  const data = useMemo(() => {
    const openItems = workItems.filter((wi) => OPEN_STATES.has(wi.state))
    const counts = new Array<number>(BUCKETS.length).fill(0)

    for (const wi of openItems) {
      const age = daysSince(wi.createdDate)
      for (let i = 0; i < BUCKETS.length; i++) {
        if (age < BUCKETS[i]!.max || i === BUCKETS.length - 1) {
          counts[i]!++
          break
        }
      }
    }

    return BUCKETS.map((b, i) => ({ bucket: b.label, count: counts[i]! }))
  }, [workItems])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Watch List Age</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    )
  }

  const total = data.reduce((s, d) => s + d.count, 0)

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Watch List Age</CardTitle>
        </CardHeader>
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
      <CardHeader>
        <CardTitle className="text-base">Watch List Age</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <XAxis
              dataKey="bucket"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={<ChartTooltip formatRows={(p) =>
                p?.map((e) => ({
                  label: String(e.name ?? ''),
                  value: `${e.value} items`,
                })) ?? []
              } />}
            />
            <Bar
              dataKey="count"
              radius={[4, 4, 0, 0]}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {data.map((_entry, index) => (
                <Cell key={index} fill={BUCKET_COLORS[index] ?? '#d4d4d8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

import { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Label,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { STATE_COLORS } from '@/lib/colors'
import { ChartTooltip, renderActiveShape } from '@/components/dashboard/ChartTooltip'
import type { WorkItem } from '@/types/workItem'

interface RaidStateChartProps {
  workItems: WorkItem[]
  isLoading?: boolean
}

export function RaidStateChart({ workItems, isLoading }: RaidStateChartProps) {
  const data = useMemo(() => {
    const counts = new Map<string, number>()
    for (const wi of workItems) {
      counts.set(wi.state, (counts.get(wi.state) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count)
  }, [workItems])

  const total = useMemo(() => data.reduce((s, d) => s + d.count, 0), [data])

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Watch List by State</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-[250px] w-full" /></CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Watch List by State</CardTitle></CardHeader>
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
      <CardHeader><CardTitle className="text-base">Watch List by State</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="count"
              nameKey="state"
              strokeWidth={0}
              animationDuration={800}
              animationEasing="ease-out"
              animationBegin={100}
              activeShape={renderActiveShape}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={STATE_COLORS[entry.state] ?? '#d4d4d8'} />
              ))}
              <Label
                position="center"
                content={() => (
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="fill-foreground">
                    <tspan x="50%" dy="-0.5em" fontSize="20" fontWeight="700">{total}</tspan>
                    <tspan x="50%" dy="1.4em" fontSize="11" className="fill-muted-foreground">items</tspan>
                  </text>
                )}
              />
            </Pie>
            <Tooltip
              content={<ChartTooltip formatRows={(p) =>
                p?.map((e) => ({ label: String(e.name ?? ''), value: `${e.value} items` })) ?? []
              } />}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} iconType="circle" iconSize={8} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

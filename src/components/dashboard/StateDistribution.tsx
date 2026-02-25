import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { STATE_COLORS } from '@/lib/colors'
import { ChartTooltip, ChartBarCursor } from './ChartTooltip'
import type { StateDistributionEntry } from '@/types/metrics'

interface StateDistributionProps {
  data: StateDistributionEntry[]
  isLoading?: boolean
}

export function StateDistribution({
  data,
  isLoading,
}: StateDistributionProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">State Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">State Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
            No data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">State Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} layout="vertical" barCategoryGap="20%">
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-border"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="state"
              tick={{ fontSize: 12 }}
              width={80}
              className="text-muted-foreground"
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<ChartTooltip formatRows={(p) =>
                p?.map((e: { name?: string; value?: string | number; color?: string; payload?: Record<string, unknown> }) => {
                  const entry = e.payload as unknown as StateDistributionEntry
                  return {
                    label: entry.state,
                    value: `${e.value} (${entry.percentage}%)`,
                  }
                }) ?? []
              } />}
              cursor={<ChartBarCursor />}
            />
            <Bar
              dataKey="count"
              radius={[0, 6, 6, 0]}
              barSize={24}
              animationDuration={600}
              animationEasing="ease-out"
              activeBar={{ fillOpacity: 0.8 }}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.state}
                  fill={STATE_COLORS[entry.state] ?? 'var(--color-chart-1)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

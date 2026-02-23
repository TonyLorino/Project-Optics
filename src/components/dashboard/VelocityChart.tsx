import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { STATE_COLORS } from '@/lib/colors'
import { ChartTooltip } from './ChartTooltip'
import type { VelocityDataPoint } from '@/types/metrics'

interface VelocityChartProps {
  data: VelocityDataPoint[]
  averageVelocity: number
  isLoading?: boolean
}

export function VelocityChart({
  data,
  averageVelocity,
  isLoading,
}: VelocityChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Velocity Trend</CardTitle>
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
          <CardTitle className="text-base">Velocity Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
            No velocity data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Velocity Trend</CardTitle>
        <span className="text-sm text-muted-foreground">
          Avg: {averageVelocity} pts
        </span>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} barCategoryGap="20%">
            <defs>
              <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={STATE_COLORS.Closed} stopOpacity={0.9} />
                <stop offset="100%" stopColor={STATE_COLORS.Closed} stopOpacity={0.45} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-border"
              vertical={false}
            />
            <XAxis
              dataKey="sprintName"
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<ChartTooltip formatRows={(p) =>
                p?.map((e) => ({
                  label: String(e.name ?? ''),
                  value: `${e.value} pts`,
                })) ?? []
              } />}
              cursor={false}
            />
            <ReferenceLine
              y={averageVelocity}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="5 5"
              label={{
                value: 'Avg',
                position: 'right',
                fill: 'hsl(var(--muted-foreground))',
                fontSize: 11,
              }}
            />
            <Bar
              dataKey="completedPoints"
              fill="url(#velocityGrad)"
              radius={[6, 6, 0, 0]}
              name="Story Points"
              animationDuration={600}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

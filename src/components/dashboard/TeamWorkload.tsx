import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { STATE_COLORS } from '@/lib/colors'
import { ChartTooltip } from './ChartTooltip'
import type { TeamMemberData } from '@/hooks/useTeamWorkload'

interface TeamWorkloadProps {
  data: TeamMemberData[]
  isLoading?: boolean
}

export function TeamWorkload({ data, isLoading }: TeamWorkloadProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Workload</CardTitle>
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
          <CardTitle className="text-base">Team Workload</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
            No assigned user stories in this sprint
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartHeight = Math.max(250, data.length * 50)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Team Workload</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={data} layout="vertical" barCategoryGap="20%">
            <defs>
              <linearGradient id="twStories" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={STATE_COLORS.Active} stopOpacity={0.5} />
                <stop offset="100%" stopColor={STATE_COLORS.Active} stopOpacity={0.9} />
              </linearGradient>
              <linearGradient id="twPoints" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={STATE_COLORS.Closed} stopOpacity={0.5} />
                <stop offset="100%" stopColor={STATE_COLORS.Closed} stopOpacity={0.9} />
              </linearGradient>
              <linearGradient id="twVelocity" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={STATE_COLORS.New} stopOpacity={0.5} />
                <stop offset="100%" stopColor={STATE_COLORS.New} stopOpacity={0.9} />
              </linearGradient>
            </defs>
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
              dataKey="name"
              type="category"
              tick={{ fontSize: 12 }}
              width={120}
              className="text-muted-foreground"
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<ChartTooltip formatRows={(p) =>
                p?.map((e: { name?: string; value?: string | number; color?: string; payload?: Record<string, unknown>; dataKey?: string }) => {
                  const label =
                    e.dataKey === 'stories' ? 'Stories'
                    : e.dataKey === 'storyPoints' ? 'Story Points'
                    : 'Avg Velocity'
                  const suffix = e.dataKey === 'avgVelocity' ? ' pts/sprint' : ''
                  return { label, value: `${e.value}${suffix}` }
                }) ?? []
              } />}
              cursor={false}
            />
            <Legend
              formatter={(value) =>
                value === 'stories'
                  ? 'Stories'
                  : value === 'storyPoints'
                    ? 'Story Points'
                    : 'Avg Velocity'
              }
            />
            <Bar
              dataKey="stories"
              fill="url(#twStories)"
              radius={[0, 6, 6, 0]}
              name="stories"
              animationDuration={600}
              animationEasing="ease-out"
            />
            <Bar
              dataKey="storyPoints"
              fill="url(#twPoints)"
              radius={[0, 6, 6, 0]}
              name="storyPoints"
              animationDuration={600}
              animationEasing="ease-out"
            />
            <Bar
              dataKey="avgVelocity"
              fill="url(#twVelocity)"
              radius={[0, 6, 6, 0]}
              name="avgVelocity"
              animationDuration={600}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

import {
  AreaChart,
  Area,
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
import type { BurndownDataPoint } from '@/types/metrics'
import type { WorkItem } from '@/types/workItem'
import type { Sprint } from '@/types/sprint'
import { useMemo } from 'react'
import {
  differenceInDays,
  parseISO,
  addDays,
  format,
  isAfter,
  startOfDay,
} from 'date-fns'

interface SprintBurndownProps {
  workItems: WorkItem[]
  sprint: Sprint | undefined
  isLoading?: boolean
}

function getCompletionDate(w: WorkItem): string | undefined {
  if (w.state === 'Closed') return w.closedDate ?? w.stateChangeDate
  if (w.state === 'Resolved') return w.resolvedDate ?? w.stateChangeDate
  return undefined
}

export function SprintBurndown({
  workItems,
  sprint,
  isLoading,
}: SprintBurndownProps) {
  const burndownData = useMemo((): BurndownDataPoint[] => {
    if (!sprint?.startDate || !sprint?.finishDate) return []

    const start = startOfDay(parseISO(sprint.startDate))
    const finish = startOfDay(parseISO(sprint.finishDate))
    const totalDays = differenceInDays(finish, start)
    if (totalDays <= 0) return []

    const sprintItems = workItems.filter(
      (w) => w.iterationPath === sprint.path,
    )
    const totalPoints = sprintItems.reduce(
      (sum, w) => sum + (w.storyPoints ?? 0),
      0,
    )

    const today = startOfDay(new Date())
    const data: BurndownDataPoint[] = []

    for (let day = 0; day <= totalDays; day++) {
      const date = addDays(start, day)
      const ideal = totalPoints - (totalPoints / totalDays) * day

      let actual: number
      if (isAfter(date, today)) {
        actual = NaN
      } else {
        const doneByDate = sprintItems.filter((w) => {
          const doneDate = getCompletionDate(w)
          if (!doneDate) return false
          return !isAfter(startOfDay(parseISO(doneDate)), date)
        })
        const donePoints = doneByDate.reduce(
          (sum, w) => sum + (w.storyPoints ?? 0),
          0,
        )
        actual = totalPoints - donePoints
      }

      data.push({
        day,
        date: format(date, 'MMM d'),
        ideal: Math.round(ideal * 10) / 10,
        actual: isNaN(actual) ? actual : Math.round(actual * 10) / 10,
      })
    }

    return data
  }, [workItems, sprint])

  const sprintLabel = sprint?.name
    ? `Sprint Burndown — ${sprint.name}`
    : 'Sprint Burndown'

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{sprintLabel}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (burndownData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{sprintLabel}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
            No sprint data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{sprintLabel}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={burndownData}>
            <defs>
              <linearGradient id="burnActual" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={STATE_COLORS.Active}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={STATE_COLORS.Active}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-border"
              vertical={false}
            />
            <XAxis
              dataKey="date"
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
                p?.map((e: { name?: string; value?: string | number }) => ({
                  label: String(e.name ?? ''),
                  value: `${e.value} pts`,
                })) ?? []
              } />}
              cursor={{ stroke: 'var(--color-muted-foreground)', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <ReferenceLine y={0} className="stroke-border" />
            <Area
              type="monotone"
              dataKey="ideal"
              stroke="var(--color-muted-foreground)"
              strokeDasharray="5 5"
              fill="none"
              strokeWidth={2}
              name="Ideal"
              dot={false}
              animationDuration={600}
              animationEasing="ease-out"
            />
            <Area
              type="monotone"
              dataKey="actual"
              stroke={STATE_COLORS.Active}
              fill="url(#burnActual)"
              strokeWidth={2}
              name="Actual"
              connectNulls={false}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--color-background)' }}
              animationDuration={600}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

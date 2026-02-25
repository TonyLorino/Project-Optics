import { useMemo, useState } from 'react'
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
import { RAID_CATEGORY_COLORS } from '@/lib/colors'
import { ChartTooltip, renderActiveShape } from '@/components/dashboard/ChartTooltip'
import type { RaidTypeEntry } from '@/hooks/useRaidMetrics'

interface RaidTypeChartProps {
  data: RaidTypeEntry[]
  isLoading?: boolean
}

export function RaidTypeChart({ data, isLoading }: RaidTypeChartProps) {
  const total = useMemo(() => data.reduce((s, d) => s + d.count, 0), [data])
  const [activeIndex, setActiveIndex] = useState(-1)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Watch List Distribution</CardTitle>
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
          <CardTitle className="text-base">Watch List Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
            No RAID items found
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Watch List Distribution</CardTitle>
      </CardHeader>
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
              nameKey="category"
              strokeWidth={0}
              animationDuration={800}
              animationEasing="ease-out"
              animationBegin={100}
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(-1)}
            >
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={RAID_CATEGORY_COLORS[entry.category] ?? '#d4d4d8'}
                />
              ))}
              <Label
                position="center"
                content={() => (
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="fill-foreground"
                  >
                    <tspan x="50%" dy="-0.5em" fontSize="20" fontWeight="700">
                      {total}
                    </tspan>
                    <tspan x="50%" dy="1.4em" fontSize="11" className="fill-muted-foreground">
                      items
                    </tspan>
                  </text>
                )}
              />
            </Pie>
            <Tooltip
              content={<ChartTooltip formatRows={(p) =>
                p?.map((e: { name?: string; value?: string | number; color?: string; payload?: Record<string, unknown> }) => ({
                  label: String(e.name ?? ''),
                  value: `${e.value} items`,
                })) ?? []
              } />}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="circle"
              iconSize={8}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

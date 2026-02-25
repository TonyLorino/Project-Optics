import { Sector } from 'recharts'

/* ── Bar chart cursor ────────────────────────────────────────────── */

export function ChartBarCursor(props: Record<string, unknown>) {
  const { x, y, width, height } = props as {
    x: number; y: number; width: number; height: number
  }
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={4}
      ry={4}
      style={{ fill: 'var(--color-foreground)', opacity: 0.04 }}
    />
  )
}

/* ── Pie chart active shape ──────────────────────────────────────── */

interface ActiveShapeProps {
  cx: number
  cy: number
  innerRadius: number
  outerRadius: number
  startAngle: number
  endAngle: number
  fill: string
}

export function renderActiveShape(props: unknown): React.ReactElement {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props as ActiveShapeProps
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.18}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  )
}

interface ChartTooltipRow {
  label: string
  value: string
  color?: string
}

interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{ name?: string; value?: string | number; color?: string; payload?: Record<string, unknown> }>
  label?: string | number
  formatRows?: (payload: ChartTooltipProps['payload'], label: string) => ChartTooltipRow[]
}

export function ChartTooltip({ active, payload, label, formatRows }: ChartTooltipProps) {
  if (!active || !payload?.length) return null

  const rows: ChartTooltipRow[] = formatRows
    ? formatRows(payload, String(label ?? ''))
    : payload.map((entry) => ({
        label: String(entry.name ?? ''),
        value: String(entry.value ?? ''),
        color: entry.color,
      }))

  return (
    <div className="bg-popover/95 backdrop-blur-sm border rounded-xl shadow-lg p-3 text-xs max-w-[260px]">
      {label != null && label !== '' && (
        <p className="font-semibold truncate mb-1.5">{String(label)}</p>
      )}
      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-muted-foreground">
        {rows.map((row, i) => (
          <span key={i} className="contents">
            <span>{row.label}</span>
            <span className="text-foreground">{row.value}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

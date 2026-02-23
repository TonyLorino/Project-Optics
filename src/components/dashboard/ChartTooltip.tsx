import type { TooltipProps } from 'recharts'

interface ChartTooltipRow {
  label: string
  value: string
  color?: string
}

interface ChartTooltipProps extends TooltipProps<number | string, string> {
  formatRows?: (payload: TooltipProps<number | string, string>['payload'], label: string) => ChartTooltipRow[]
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

import { RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { differenceInMinutes, differenceInHours } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

function friendlyTimeSince(date: Date): string {
  const mins = differenceInMinutes(new Date(), date)
  if (mins < 1) return 'Synced just now'
  if (mins < 5) return 'Synced a few minutes ago'
  if (mins < 30) return 'Synced recently'
  if (mins < 60) return 'Synced less than an hour ago'
  const hrs = differenceInHours(new Date(), date)
  if (hrs === 1) return 'Synced about an hour ago'
  return `Synced ${hrs} hours ago`
}

interface SyncIndicatorProps {
  lastUpdated: Date | undefined
  isFetching: boolean
  onRefresh: () => void
}

export function SyncIndicator({
  lastUpdated,
  isFetching,
  onRefresh,
}: SyncIndicatorProps) {
  const [, setTick] = useState(0)

  // Re-render every minute to keep the label current
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  const label = lastUpdated
    ? friendlyTimeSince(lastUpdated)
    : 'Not synced yet'

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            'inline-block h-2 w-2 rounded-full',
            isFetching
              ? 'bg-amber-400 animate-pulse'
              : lastUpdated
                ? 'bg-emerald-500'
                : 'bg-zinc-400',
          )}
        />
        <span className="hidden sm:inline">{label}</span>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onRefresh}
            disabled={isFetching}
          >
            <RefreshCw
              className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')}
            />
            <span className="sr-only">Refresh data</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Refresh data</p>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

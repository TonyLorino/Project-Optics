import { format, parseISO } from 'date-fns'
import { CalendarIcon, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import type { DateRange } from 'react-day-picker'

interface DateRangeSelectorProps {
  value: { from: string; to: string } | null
  onChange: (range: { from: string; to: string } | null) => void
}

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  const selected: DateRange | undefined = value
    ? {
        from: parseISO(value.from),
        to: parseISO(value.to),
      }
    : undefined

  function handleSelect(range: DateRange | undefined) {
    if (!range?.from) {
      onChange(null)
      return
    }
    onChange({
      from: format(range.from, 'yyyy-MM-dd'),
      to: format(range.to ?? range.from, 'yyyy-MM-dd'),
    })
  }

  const label = value
    ? `${format(parseISO(value.from), 'MMM d, yyyy')} – ${format(parseISO(value.to), 'MMM d, yyyy')}`
    : 'All Dates'

  return (
    <div className="flex items-center gap-1">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'h-9 justify-start text-left font-normal min-w-[200px]',
              !value && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {label}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={selected}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => onChange(null)}
          aria-label="Clear date filter"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

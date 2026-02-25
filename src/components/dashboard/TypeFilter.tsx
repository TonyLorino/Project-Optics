import { useState } from 'react'
import { Check, ChevronDownIcon, FolderOpen } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { WORK_TYPE_COLORS } from '@/lib/colors'

const AREA_PATH_KEY = 'Area Path'

const ALL_TYPE_OPTIONS = [
  AREA_PATH_KEY,
  'Epic',
  'Feature',
  'User Story',
  'Bug',
  'Task',
  'Issue',
  'Risk',
] as const

export type TypeOption = (typeof ALL_TYPE_OPTIONS)[number]

export const DEFAULT_SELECTED_TYPES = new Set<string>([
  AREA_PATH_KEY,
  'Epic',
  'Feature',
  'User Story',
])

interface TypeFilterProps {
  selected: Set<string>
  onChange: (types: Set<string>) => void
}

export function TypeFilter({ selected, onChange }: TypeFilterProps) {
  const [open, setOpen] = useState(false)

  const allSelected = selected.size === ALL_TYPE_OPTIONS.length
  const noneSelected = selected.size === 0

  const typeCount = selected.has(AREA_PATH_KEY) ? selected.size - 1 : selected.size
  const label = allSelected
    ? 'All Types'
    : noneSelected
      ? 'No Types'
      : typeCount === 1 && !selected.has(AREA_PATH_KEY)
        ? [...selected][0]
        : typeCount === 0
          ? AREA_PATH_KEY
          : `${typeCount} Types`

  function toggle(option: string) {
    const next = new Set(selected)
    if (next.has(option)) next.delete(option)
    else next.add(option)
    onChange(next)
  }

  function selectAll() {
    onChange(new Set(ALL_TYPE_OPTIONS))
  }

  function clearAll() {
    onChange(new Set())
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          role="combobox"
          aria-expanded={open}
          aria-label="Filter by work item type"
          data-slot="select-trigger"
          data-size="default"
          className={cn(
            "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            'h-7 w-[120px] text-xs',
          )}
        >
          <span data-slot="select-value">{label}</span>
          <span data-slot="select-icon">
            <ChevronDownIcon className="size-4 opacity-50" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[190px] p-0" align="start">
        <Command>
          <CommandGroup heading="Actions">
            <CommandItem
              onSelect={selectAll}
              disabled={allSelected}
              className={cn(allSelected && 'opacity-40')}
            >
              <Check className={cn('mr-2 h-4 w-4', allSelected ? 'opacity-100' : 'opacity-0')} />
              Select All
            </CommandItem>
            <CommandItem
              onSelect={clearAll}
              disabled={noneSelected}
              className={cn(noneSelected && 'opacity-40')}
            >
              <span className="mr-2 h-4 w-4" />
              Clear All
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Grouping">
            <CommandItem onSelect={() => toggle(AREA_PATH_KEY)}>
              <Check className={cn('mr-2 h-4 w-4', selected.has(AREA_PATH_KEY) ? 'opacity-100' : 'opacity-0')} />
              <FolderOpen className="h-3.5 w-3.5 shrink-0 mr-1.5 text-muted-foreground" />
              {AREA_PATH_KEY}
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Types">
            {ALL_TYPE_OPTIONS.filter((t) => t !== AREA_PATH_KEY).map((type) => {
              const isChecked = selected.has(type)
              return (
                <CommandItem key={type} onSelect={() => toggle(type)}>
                  <Check className={cn('mr-2 h-4 w-4', isChecked ? 'opacity-100' : 'opacity-0')} />
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0 mr-1.5"
                    style={{ backgroundColor: WORK_TYPE_COLORS[type] ?? '#a1a1aa' }}
                  />
                  {type}
                </CommandItem>
              )
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export { AREA_PATH_KEY, ALL_TYPE_OPTIONS }

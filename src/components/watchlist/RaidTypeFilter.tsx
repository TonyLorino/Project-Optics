import { useState } from 'react'
import { Check, ChevronDownIcon } from 'lucide-react'
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
import { RAID_CATEGORY_COLORS } from '@/lib/colors'
import { ALL_RAID_CATEGORIES, type RaidCategory } from '@/lib/raidHelpers'

interface RaidTypeFilterProps {
  selected: Set<RaidCategory>
  onChange: (types: Set<RaidCategory>) => void
}

export function RaidTypeFilter({ selected, onChange }: RaidTypeFilterProps) {
  const [open, setOpen] = useState(false)

  const allSelected = selected.size === ALL_RAID_CATEGORIES.length
  const noneSelected = selected.size === 0

  const label = allSelected
    ? 'All Types'
    : selected.size === 0
      ? 'No Types'
      : selected.size === 1
        ? [...selected][0]
        : `${selected.size} Types`

  function toggleType(type: RaidCategory) {
    const next = new Set(selected)
    if (next.has(type)) next.delete(type)
    else next.add(type)
    onChange(next)
  }

  function selectAll() {
    onChange(new Set(ALL_RAID_CATEGORIES))
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
          data-slot="select-trigger"
          data-size="default"
          className={cn(
            "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            'h-7 w-[130px] text-xs',
          )}
        >
          <span data-slot="select-value">{label}</span>
          <span data-slot="select-icon">
            <ChevronDownIcon className="size-4 opacity-50" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
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
          <CommandGroup heading="RAID Types">
            {ALL_RAID_CATEGORIES.map((type) => {
              const isChecked = selected.has(type)
              return (
                <CommandItem key={type} onSelect={() => toggleType(type)}>
                  <Check className={cn('mr-2 h-4 w-4', isChecked ? 'opacity-100' : 'opacity-0')} />
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0 mr-1.5"
                    style={{ backgroundColor: RAID_CATEGORY_COLORS[type] }}
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

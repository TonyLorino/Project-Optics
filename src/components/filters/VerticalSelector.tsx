import { useState, useMemo } from 'react'
import { Check, ChevronsUpDown, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'

interface VerticalSelectorProps {
  verticals: string[]
  selected: string[]
  onSelectedChange: (verticals: string[]) => void
}

export function VerticalSelector({
  verticals,
  selected,
  onSelectedChange,
}: VerticalSelectorProps) {
  const [open, setOpen] = useState(false)

  const selectedSet = useMemo(() => new Set(selected), [selected])
  const allSelected = verticals.length > 0 && verticals.every((v) => selectedSet.has(v))
  const noneSelected = selected.length === 0

  function toggleVertical(vertical: string) {
    if (selectedSet.has(vertical)) {
      onSelectedChange(selected.filter((v) => v !== vertical))
    } else {
      onSelectedChange([...selected, vertical])
    }
  }

  function selectAll() {
    onSelectedChange([...verticals])
  }

  function clearAll() {
    onSelectedChange([])
  }

  const label = useMemo(() => {
    if (noneSelected) return 'All Tags'
    if (allSelected) return 'All Tags'
    if (selected.length === 1) return selected[0]
    return `${selected.length} Tags`
  }, [noneSelected, allSelected, selected])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between gap-2 min-w-[220px]"
        >
          <Hash className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate flex-1 text-left">{label}</span>
          {selected.length > 1 && !allSelected && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {selected.length}
            </Badge>
          )}
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto min-w-[250px] max-w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search tags..." />
          <CommandList className="max-h-[60vh]">
            <CommandEmpty>No tags found.</CommandEmpty>

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

            <CommandGroup heading="Tags">
              {verticals.map((vertical) => {
                const isChecked = selectedSet.has(vertical)
                return (
                  <CommandItem key={vertical} value={vertical} onSelect={() => toggleVertical(vertical)}>
                    <Check className={cn('mr-2 h-4 w-4', isChecked ? 'opacity-100' : 'opacity-0')} />
                    {vertical}
                  </CommandItem>
                )
              })}
              {verticals.length === 0 && (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  No <code className="text-xs">vertical:*</code> tags found
                </div>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

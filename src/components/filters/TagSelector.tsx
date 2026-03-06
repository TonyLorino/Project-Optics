import { useState, useMemo, useEffect } from 'react'
import { Check, ChevronRight, ChevronDown, ChevronsUpDown, ChevronsDownUp, Hash } from 'lucide-react'
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
import type { ParsedTag } from '@/lib/tagHelpers'
import { getTagDisplayValue } from '@/lib/tagHelpers'

interface TagSelectorProps {
  tags: ParsedTag[]
  selected: string[]
  onSelectedChange: (tags: string[]) => void
}

interface CategoryGroup {
  category: string
  heading: string
  tags: ParsedTag[]
}

export function TagSelector({
  tags,
  selected,
  onSelectedChange,
}: TagSelectorProps) {
  const [open, setOpen] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const allRawTags = useMemo(() => tags.map((t) => t.raw), [tags])
  const selectedSet = useMemo(() => new Set(selected), [selected])
  const allSelected = allRawTags.length > 0 && allRawTags.every((r) => selectedSet.has(r))
  const noneSelected = selected.length === 0

  const groups = useMemo(() => {
    const map = new Map<string, ParsedTag[]>()
    for (const tag of tags) {
      const key = tag.category ?? '__other__'
      const existing = map.get(key)
      if (existing) existing.push(tag)
      else map.set(key, [tag])
    }

    const result: CategoryGroup[] = []
    const sortedKeys = [...map.keys()].sort((a, b) => {
      if (a === '__other__') return 1
      if (b === '__other__') return -1
      return a.localeCompare(b)
    })
    for (const key of sortedKeys) {
      const categoryTags = map.get(key)!
      result.push({
        category: key,
        heading: key === '__other__' ? 'Other' : key.charAt(0).toUpperCase() + key.slice(1),
        tags: categoryTags,
      })
    }
    return result
  }, [tags])

  const categoriesWithTags = useMemo(
    () => new Set(groups.map((g) => g.category)),
    [groups],
  )

  const [hasAutoExpanded, setHasAutoExpanded] = useState(false)
  useEffect(() => {
    if (!hasAutoExpanded && categoriesWithTags.size > 0) {
      setHasAutoExpanded(true)
      setExpandedCategories(new Set(categoriesWithTags))
    }
  }, [hasAutoExpanded, categoriesWithTags])

  function toggleTag(raw: string) {
    if (selectedSet.has(raw)) {
      onSelectedChange(selected.filter((s) => s !== raw))
    } else {
      onSelectedChange([...selected, raw])
    }
  }

  function selectAll() {
    onSelectedChange([...allRawTags])
  }

  function clearAll() {
    onSelectedChange([])
  }

  function toggleExpand(category: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }

  const allExpanded = expandedCategories.size >= categoriesWithTags.size

  function toggleAllExpand() {
    if (allExpanded) {
      setExpandedCategories(new Set())
    } else {
      setExpandedCategories(new Set(categoriesWithTags))
    }
  }

  const label = useMemo(() => {
    if (noneSelected) return 'All Tags'
    if (allSelected) return 'All Tags'
    if (selected.length === 1 && selected[0]) return getTagDisplayValue(selected[0])
    return `${selected.length} Tags`
  }, [noneSelected, allSelected, selected])

  const selectionCount = selected.length

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
          {selectionCount > 1 && !allSelected && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {selectionCount}
            </Badge>
          )}
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto min-w-[280px] max-w-[500px] p-0" align="start">
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
              {groups.length > 1 && (
                <CommandItem onSelect={toggleAllExpand}>
                  {allExpanded ? (
                    <ChevronsDownUp className="mr-2 h-4 w-4" />
                  ) : (
                    <ChevronsUpDown className="mr-2 h-4 w-4" />
                  )}
                  {allExpanded ? 'Collapse All' : 'Expand All'}
                </CommandItem>
              )}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Tags">
              {groups.map((group) => {
                const isExpanded = expandedCategories.has(group.category)
                const groupTagCount = group.tags.length
                const groupSelectedCount = group.tags.filter((t) => selectedSet.has(t.raw)).length

                return (
                  <div key={group.category}>
                    <CommandItem
                      value={`__category__${group.heading}`}
                      onSelect={() => toggleExpand(group.category)}
                      className="flex items-center font-medium"
                    >
                      {isExpanded ? (
                        <ChevronDown className="mr-1 h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="mr-1 h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}
                      <span className="flex-1">{group.heading}</span>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1 py-0 shrink-0 ml-2 text-muted-foreground"
                      >
                        {groupSelectedCount > 0 ? `${groupSelectedCount}/` : ''}{groupTagCount}
                      </Badge>
                    </CommandItem>

                    {isExpanded && group.tags.map((tag) => {
                      const isChecked = selectedSet.has(tag.raw)
                      return (
                        <CommandItem
                          key={tag.raw}
                          value={`${group.heading} ${tag.value}`}
                          onSelect={() => toggleTag(tag.raw)}
                          className="pl-10"
                        >
                          <Check
                            className={cn(
                              'mr-2 h-3.5 w-3.5 shrink-0',
                              isChecked ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          <span className="text-sm">{tag.value}</span>
                        </CommandItem>
                      )
                    })}
                  </div>
                )
              })}
              {tags.length === 0 && (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  No tags found in current work items
                </div>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

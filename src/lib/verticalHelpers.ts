import type { WorkItem } from '@/types/workItem'

const VERTICAL_PREFIX = 'vertical:'

export function parseVerticalTags(tags?: string): string[] {
  if (!tags) return []
  return tags
    .split(';')
    .map((t) => t.trim())
    .filter((t) => t.toLowerCase().startsWith(VERTICAL_PREFIX))
    .map((t) => t.slice(VERTICAL_PREFIX.length).trim())
}

export function collectVerticals(items: WorkItem[]): string[] {
  const set = new Set<string>()
  for (const item of items) {
    for (const v of parseVerticalTags(item.tags)) {
      set.add(v)
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b))
}

export function filterByVerticalTags(
  items: WorkItem[],
  selectedVerticals: string[],
): WorkItem[] {
  if (selectedVerticals.length === 0) return items
  const selected = new Set(selectedVerticals.map((v) => v.toLowerCase()))
  return items.filter((item) => {
    const verticals = parseVerticalTags(item.tags)
    return verticals.some((v) => selected.has(v.toLowerCase()))
  })
}

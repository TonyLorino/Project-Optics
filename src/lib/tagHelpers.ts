import type { WorkItem } from '@/types/workItem'

export interface ParsedTag {
  raw: string
  category: string | null
  value: string
}

/**
 * Parse a single tag string into category + value.
 * Tags containing `:` are split on the first `:` into category/value.
 * Tags without `:` have category = null.
 */
function parseOneTag(tag: string): ParsedTag {
  const colonIdx = tag.indexOf(':')
  if (colonIdx === -1) {
    return { raw: tag, category: null, value: tag }
  }
  const category = tag.slice(0, colonIdx).trim()
  const value = tag.slice(colonIdx + 1).trim()
  if (!category || !value) {
    return { raw: tag, category: null, value: tag }
  }
  return { raw: tag, category, value }
}

/**
 * Parse all tags from an ADO semicolon-delimited tag string.
 */
export function parseTags(tags?: string): ParsedTag[] {
  if (!tags) return []
  return tags
    .split(';')
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .map(parseOneTag)
}

/**
 * Collect all unique tags across work items, deduplicated by raw (case-insensitive).
 * Sorted by category (alphabetically, nulls last) then by value.
 */
export function collectTags(items: WorkItem[]): ParsedTag[] {
  const seen = new Map<string, ParsedTag>()
  for (const item of items) {
    for (const tag of parseTags(item.tags)) {
      const key = tag.raw.toLowerCase()
      if (!seen.has(key)) {
        seen.set(key, tag)
      }
    }
  }
  return [...seen.values()].sort((a, b) => {
    if (a.category === null && b.category !== null) return 1
    if (a.category !== null && b.category === null) return -1
    if (a.category !== null && b.category !== null) {
      const catCmp = a.category.localeCompare(b.category)
      if (catCmp !== 0) return catCmp
    }
    return a.value.localeCompare(b.value)
  })
}

/**
 * Filter work items to those having at least one tag matching the selection.
 * Matches by full raw tag string (case-insensitive).
 * Empty selection = pass-through (no filtering).
 */
export function filterByTags(
  items: WorkItem[],
  selectedTags: string[],
): WorkItem[] {
  if (selectedTags.length === 0) return items
  const selected = new Set(selectedTags.map((t) => t.toLowerCase()))
  return items.filter((item) => {
    const tags = parseTags(item.tags)
    return tags.some((t) => selected.has(t.raw.toLowerCase()))
  })
}

/**
 * Get the display-friendly value portion of a raw tag string.
 * Strips the `category:` prefix if present.
 */
export function getTagDisplayValue(raw: string): string {
  const colonIdx = raw.indexOf(':')
  if (colonIdx === -1) return raw
  const value = raw.slice(colonIdx + 1).trim()
  return value || raw
}

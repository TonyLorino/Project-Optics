import type { WorkItem } from '@/types/workItem'

export const RAID_WORK_ITEM_TYPES = ['Issue', 'Risk'] as const

export const RAID_TAG_CATEGORIES = ['Dependency', 'Decision', 'Critical Dependency'] as const

export type RaidCategory = 'Issue' | 'Risk' | 'Dependency' | 'Decision' | 'Critical Dependency'

export const ALL_RAID_CATEGORIES: RaidCategory[] = [
  'Issue',
  'Risk',
  'Dependency',
  'Decision',
  'Critical Dependency',
]

export function parseTags(tags?: string): string[] {
  if (!tags) return []
  return tags.split(';').map((t) => t.trim()).filter(Boolean)
}

export function getRaidCategory(wi: WorkItem): RaidCategory | null {
  if (wi.workItemType === 'Issue') return 'Issue'
  if (wi.workItemType === 'Risk') return 'Risk'

  const tags = parseTags(wi.tags)
  for (const tag of tags) {
    const lower = tag.toLowerCase()
    if (lower === 'critical dependency') return 'Critical Dependency'
    if (lower === 'dependency') return 'Dependency'
    if (lower === 'decision') return 'Decision'
  }

  return null
}

export function isRaidItem(wi: WorkItem): boolean {
  return getRaidCategory(wi) !== null
}

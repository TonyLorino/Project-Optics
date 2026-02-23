import { useMemo } from 'react'
import type { WorkItem } from '@/types/workItem'
import { isRaidItem, getRaidCategory, type RaidCategory } from '@/lib/raidHelpers'

export interface RaidMetrics {
  openIssues: number
  openRisks: number
  highPriority: number
  avgAgeDays: number
  totalRaidItems: number
}

export interface RaidTypeEntry {
  category: RaidCategory
  count: number
}

export interface RaidPriorityEntry {
  priority: string
  count: number
}

const OPEN_STATES = new Set(['New', 'Active'])

function daysSince(dateStr: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000))
}

export function useRaidMetrics(workItems: WorkItem[]): RaidMetrics {
  return useMemo(() => {
    const raidItems = workItems.filter(isRaidItem)
    const open = raidItems.filter((wi) => OPEN_STATES.has(wi.state))

    const openIssues = open.filter((wi) => getRaidCategory(wi) === 'Issue').length
    const openRisks = open.filter((wi) => getRaidCategory(wi) === 'Risk').length
    const highPriority = open.filter((wi) => wi.priority != null && wi.priority <= 2).length

    const totalAge = open.reduce((sum, wi) => sum + daysSince(wi.createdDate), 0)
    const avgAgeDays = open.length > 0 ? Math.round(totalAge / open.length) : 0

    return { openIssues, openRisks, highPriority, avgAgeDays, totalRaidItems: raidItems.length }
  }, [workItems])
}

export function useRaidTypeDistribution(workItems: WorkItem[]): RaidTypeEntry[] {
  return useMemo(() => {
    const counts = new Map<RaidCategory, number>()
    for (const wi of workItems) {
      const cat = getRaidCategory(wi)
      if (cat) counts.set(cat, (counts.get(cat) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
  }, [workItems])
}

export function useRaidPriorityDistribution(workItems: WorkItem[]): RaidPriorityEntry[] {
  return useMemo(() => {
    const raidItems = workItems.filter(isRaidItem)
    const counts = new Map<string, number>()
    for (const wi of raidItems) {
      const label = wi.priority != null ? `P${wi.priority}` : 'Unset'
      counts.set(label, (counts.get(label) ?? 0) + 1)
    }
    const order = ['P1', 'P2', 'P3', 'P4', 'Unset']
    return order
      .filter((p) => counts.has(p))
      .map((priority) => ({ priority, count: counts.get(priority)! }))
  }, [workItems])
}

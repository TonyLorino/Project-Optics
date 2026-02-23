import type { WorkItem } from '@/types/workItem'

// ── Hex colors for Recharts ─────────────────────────────────

export const STATE_COLORS: Record<string, string> = {
  New: '#d4d4d8',
  Active: '#86efac',
  Resolved: '#93c5fd',
  Closed: '#93c5fd',
  Removed: '#a1a1aa',
}

export const LINKED_ISSUE_COLOR = '#fca5a5'
export const LINKED_RISK_COLOR = '#fde68a'

export const WORK_TYPE_COLORS: Record<string, string> = {
  'User Story': '#86efac',
  Bug: '#fca5a5',
  Task: '#93c5fd',
  Epic: '#d4d4d8',
  Feature: '#a1a1aa',
  Issue: '#fca5a5',
  Risk: '#fde68a',
}

export const RAID_CATEGORY_COLORS: Record<string, string> = {
  Issue: '#fca5a5',
  Risk: '#fde68a',
  Dependency: '#93c5fd',
  Decision: '#c4b5fd',
  'Critical Dependency': '#f9a8d4',
}

export const PRIORITY_COLORS: Record<string, string> = {
  P1: '#f87171',
  P2: '#fb923c',
  P3: '#facc15',
  P4: '#4ade80',
  Unset: '#a1a1aa',
}

/**
 * Resolve the chart fill color for a work item.
 * Linked-type colors take priority over state colors.
 */
export function getWorkItemColor(item: WorkItem): string {
  if (item.workItemType === 'Issue' || item.hasLinkedIssue) return LINKED_ISSUE_COLOR
  if (item.workItemType === 'Risk' || item.hasLinkedRisk) return LINKED_RISK_COLOR
  return STATE_COLORS[item.state] ?? '#d4d4d8'
}

// ── Tailwind classes for badges / table rows ────────────────

export const STATE_BG_CLASSES: Record<string, string> = {
  New: 'bg-zinc-300 text-zinc-800 dark:bg-zinc-600 dark:text-zinc-100',
  Active: 'bg-green-300 text-green-900 dark:bg-green-800 dark:text-green-100',
  Resolved: 'bg-blue-300 text-blue-900 dark:bg-blue-800 dark:text-blue-100',
  Closed: 'bg-blue-300 text-blue-900 dark:bg-blue-800 dark:text-blue-100',
  Removed: 'bg-zinc-400 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200',
}

const LINKED_ISSUE_CLASSES = 'bg-red-300 text-red-900 dark:bg-red-800 dark:text-red-100'
const LINKED_RISK_CLASSES = 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100'

/**
 * Resolve the Tailwind background class for a work-item badge.
 * Linked-type classes take priority over state classes.
 */
export function getWorkItemBgClass(item: WorkItem): string {
  if (item.workItemType === 'Issue' || item.hasLinkedIssue) return LINKED_ISSUE_CLASSES
  if (item.workItemType === 'Risk' || item.hasLinkedRisk) return LINKED_RISK_CLASSES
  return STATE_BG_CLASSES[item.state] ?? STATE_BG_CLASSES.New
}

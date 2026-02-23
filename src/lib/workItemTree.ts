import type { WorkItem, WorkItemType } from '@/types/workItem'

// ── Hierarchy ordering ──────────────────────────────────────

export const HIERARCHY_ORDER: Record<string, number> = {
  Epic: 0,
  Feature: 1,
  'User Story': 2,
  Bug: 3,
  Task: 4,
  Issue: 5,
  Risk: 6,
}

export function hierarchyRank(type: WorkItemType): number {
  return HIERARCHY_ORDER[type] ?? 99
}

// ── Tree types ──────────────────────────────────────────────

export interface TreeNode {
  item: WorkItem
  children: TreeNode[]
}

export interface AreaGroup {
  groupId: string
  label: string
  roots: TreeNode[]
}

export type FlatRow =
  | { kind: 'item'; item: WorkItem; depth: number; hasChildren: boolean }
  | { kind: 'group'; groupId: string; label: string; depth: number; hasChildren: true }

// ── Top-level filtering ─────────────────────────────────────

export const TOP_LEVEL_OPTIONS = ['Area Path', 'Epic', 'Feature', 'User Story', 'Bug', 'Task'] as const
export type TopLevel = (typeof TOP_LEVEL_OPTIONS)[number]

export function filterByTopLevel(items: WorkItem[], topLevel: TopLevel): WorkItem[] {
  if (topLevel === 'Area Path') return items
  const minRank = HIERARCHY_ORDER[topLevel] ?? 0
  return items.filter((w) => hierarchyRank(w.workItemType) >= minRank)
}

// ── Build parent-child tree from flat items ─────────────────

export function buildTree(items: WorkItem[]): TreeNode[] {
  const idMap = new Map<number, TreeNode>()
  for (const item of items) {
    idMap.set(item.id, { item, children: [] })
  }

  const roots: TreeNode[] = []
  for (const item of items) {
    const node = idMap.get(item.id)!
    if (item.parentId && idMap.has(item.parentId)) {
      idMap.get(item.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

// ── Area-path grouping ──────────────────────────────────────

function getDisplayArea(item: WorkItem): string {
  const prefix = item.projectName + '\\'
  if (item.areaPath.startsWith(prefix)) {
    const sub = item.areaPath.slice(prefix.length)
    return sub || ''
  }
  if (item.areaPath === item.projectName) return ''
  return ''
}

export function groupByAreaPath(roots: TreeNode[]): AreaGroup[] {
  const groups = new Map<string, TreeNode[]>()
  for (const root of roots) {
    const area = getDisplayArea(root.item)
    if (!groups.has(area)) groups.set(area, [])
    groups.get(area)!.push(root)
  }

  const sorted = [...groups.entries()].sort(([a], [b]) => {
    if (a === '' && b === '') return 0
    if (a === '') return 1
    if (b === '') return -1
    return a.localeCompare(b)
  })

  return sorted.map(([label, nodes]) => ({
    groupId: label ? `area:${label}` : '',
    label,
    roots: nodes,
  }))
}

// ── Flatten grouped tree into rows ──────────────────────────

function flattenNodes(
  nodes: TreeNode[],
  expandedIds: Set<string>,
  depth: number,
): FlatRow[] {
  const result: FlatRow[] = []
  for (const node of nodes) {
    const hasChildren = node.children.length > 0
    result.push({ kind: 'item', item: node.item, depth, hasChildren })
    if (hasChildren && expandedIds.has(`wi:${node.item.id}`)) {
      result.push(...flattenNodes(node.children, expandedIds, depth + 1))
    }
  }
  return result
}

export function flattenGroupedTree(
  groups: AreaGroup[],
  expandedIds: Set<string>,
): FlatRow[] {
  const result: FlatRow[] = []
  for (const group of groups) {
    if (group.label) {
      result.push({
        kind: 'group',
        groupId: group.groupId,
        label: group.label,
        depth: 0,
        hasChildren: true,
      })
      if (expandedIds.has(group.groupId)) {
        result.push(...flattenNodes(group.roots, expandedIds, 1))
      }
    } else {
      result.push(...flattenNodes(group.roots, expandedIds, 0))
    }
  }
  return result
}

// ── Collect all expandable IDs (for Expand All) ─────────────

function collectNodeParentIds(nodes: TreeNode[], ids: string[]): void {
  for (const node of nodes) {
    if (node.children.length > 0) {
      ids.push(`wi:${node.item.id}`)
      collectNodeParentIds(node.children, ids)
    }
  }
}

export function collectAllExpandableIds(groups: AreaGroup[]): string[] {
  const ids: string[] = []
  for (const group of groups) {
    if (group.label) ids.push(group.groupId)
    collectNodeParentIds(group.roots, ids)
  }
  return ids
}

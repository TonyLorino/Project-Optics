export interface DashboardMetrics {
  activeItemCount: number
  totalStoryPoints: number
  completedStoryPoints: number
  velocityAverage: number
  averageCycleTimeDays: number
  totalItems: number
  newCount: number
  resolvedCount: number
  closedCount: number
  removedCount: number
}

export interface VelocityDataPoint {
  sprintName: string
  sprintPath: string
  completedPoints: number
  completedItems: number
  projectBreakdown: Record<string, number>
}

export interface StateDistributionEntry {
  state: string
  count: number
  percentage: number
}

export interface WorkTypeDistributionEntry {
  type: string
  count: number
  percentage: number
}

export interface BurndownDataPoint {
  day: number
  date: string
  ideal: number
  actual: number
}

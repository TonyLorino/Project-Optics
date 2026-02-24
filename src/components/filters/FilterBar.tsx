import { useMemo } from 'react'
import { RotateCcw } from 'lucide-react'
import { ProjectSelector } from './ProjectSelector'
import { SprintSelector } from './SprintSelector'
import { ResourceSelector } from './ResourceSelector'
import { DateRangeSelector } from './DateRangeSelector'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import type { Project } from '@/types/project'
import type { Sprint } from '@/types/sprint'

interface FilterBarProps {
  projects: Project[]
  sprints: Sprint[]
  resources: { displayName: string; uniqueName: string }[]
  selectedProjects: string[]
  selectedSprint: string | null
  selectedResource: string | null
  showArchived: boolean
  areaPaths: Record<string, string[]>
  dateRange?: { from: string; to: string } | null
  onProjectsChange: (projects: string[]) => void
  onSprintChange: (sprint: string | null) => void
  onResourceChange: (resource: string | null) => void
  onToggleArchived: () => void
  onDateRangeChange?: (range: { from: string; to: string } | null) => void
}

export function FilterBar({
  projects,
  sprints,
  resources,
  selectedProjects,
  selectedSprint,
  selectedResource,
  showArchived,
  areaPaths,
  dateRange,
  onProjectsChange,
  onSprintChange,
  onResourceChange,
  onToggleArchived,
  onDateRangeChange,
}: FilterBarProps) {
  const hasActiveFilters = useMemo(() => {
    return (
      selectedSprint !== null ||
      selectedResource !== null ||
      (dateRange != null)
    )
  }, [selectedSprint, selectedResource, dateRange])

  function handleClearAll() {
    onSprintChange(null)
    onResourceChange(null)
    onDateRangeChange?.(null)
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 flex-wrap">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider pl-2">
          Project
        </span>
        <ProjectSelector
          projects={projects}
          selected={selectedProjects}
          showArchived={showArchived}
          areaPaths={areaPaths}
          onSelectedChange={onProjectsChange}
          onToggleArchived={onToggleArchived}
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider pl-2">
          Sprint
        </span>
        <SprintSelector
          sprints={sprints}
          selected={selectedSprint}
          onSelectedChange={onSprintChange}
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider pl-2">
          Resource
        </span>
        <ResourceSelector
          resources={resources}
          selected={selectedResource}
          onSelectedChange={onResourceChange}
        />
      </div>
      {onDateRangeChange && (
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider pl-2">
            Date Range
          </span>
          <DateRangeSelector
            value={dateRange ?? null}
            onChange={onDateRangeChange}
          />
        </div>
      )}
      {hasActiveFilters && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={handleClearAll}
              aria-label="Clear all filters"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Clear all filters</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

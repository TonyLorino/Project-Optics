import { ProjectSelector } from './ProjectSelector'
import { SprintSelector } from './SprintSelector'
import { ResourceSelector } from './ResourceSelector'
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
  onProjectsChange: (projects: string[]) => void
  onSprintChange: (sprint: string | null) => void
  onResourceChange: (resource: string | null) => void
  onToggleArchived: () => void
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
  onProjectsChange,
  onSprintChange,
  onResourceChange,
  onToggleArchived,
}: FilterBarProps) {
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
    </div>
  )
}

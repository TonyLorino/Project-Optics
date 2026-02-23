import { useState, useMemo, useCallback } from 'react'
import { Check, ChevronRight, ChevronDown, ChevronsUpDown, ChevronsDownUp, FolderOpen, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import type { Project } from '@/types/project'
import { cn } from '@/lib/utils'

interface ProjectSelectorProps {
  projects: Project[]
  selected: string[]
  showArchived: boolean
  areaPaths: Record<string, string[]>
  onSelectedChange: (names: string[]) => void
  onToggleArchived: () => void
}

export function ProjectSelector({
  projects,
  selected,
  showArchived,
  areaPaths,
  onSelectedChange,
  onToggleArchived,
}: ProjectSelectorProps) {
  const [open, setOpen] = useState(false)
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())

  const visibleProjects = useMemo(
    () =>
      (showArchived ? projects : projects.filter((p) => !p.isArchived)).sort(
        (a, b) => a.name.localeCompare(b.name),
      ),
    [projects, showArchived],
  )

  const projectsWithAreas = useMemo(
    () => new Set(visibleProjects.filter((p) => (areaPaths[p.name]?.length ?? 0) > 0).map((p) => p.name)),
    [visibleProjects, areaPaths],
  )

  // Auto-expand projects that have area paths on first render
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false)
  if (!hasAutoExpanded && projectsWithAreas.size > 0) {
    setHasAutoExpanded(true)
    setExpandedProjects(new Set(projectsWithAreas))
  }

  function isProjectFullySelected(projectName: string): boolean {
    if (selected.includes(projectName)) return true
    const areas = areaPaths[projectName]
    if (!areas || areas.length === 0) return false
    return areas.every((a) => selected.includes(`${projectName}\\${a}`))
  }

  function isAreaSelected(projectName: string, areaName: string): boolean {
    return selected.includes(`${projectName}\\${areaName}`)
  }

  function hasAnySelection(projectName: string): boolean {
    if (selected.includes(projectName)) return true
    const areas = areaPaths[projectName]
    if (!areas) return false
    return areas.some((a) => selected.includes(`${projectName}\\${a}`))
  }

  const allSelected = useMemo(
    () => visibleProjects.length > 0 && visibleProjects.every((p) => isProjectFullySelected(p.name)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleProjects, selected, areaPaths],
  )

  const noneSelected = selected.length === 0

  function selectAll() {
    onSelectedChange(visibleProjects.map((p) => p.name))
  }

  function clearAll() {
    onSelectedChange([])
  }

  const toggleProject = useCallback(
    (projectName: string) => {
      if (isProjectFullySelected(projectName)) {
        // Deselect: remove project-level entry and any area entries
        onSelectedChange(
          selected.filter(
            (s) => s !== projectName && !s.startsWith(projectName + '\\'),
          ),
        )
      } else {
        // Select whole project: remove any area-specific entries, add project name
        const cleaned = selected.filter(
          (s) => !s.startsWith(projectName + '\\') && s !== projectName,
        )
        onSelectedChange([...cleaned, projectName])
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected, areaPaths, onSelectedChange],
  )

  const toggleArea = useCallback(
    (projectName: string, areaName: string) => {
      const areaKey = `${projectName}\\${areaName}`
      const areas = areaPaths[projectName] ?? []

      if (selected.includes(areaKey)) {
        // Deselecting this area
        onSelectedChange(selected.filter((s) => s !== areaKey))
      } else if (selected.includes(projectName)) {
        // Project was fully selected — narrow to all areas except this toggle is adding, not removing
        // Actually: project is selected, user clicks an area → replace project with just this area
        const cleaned = selected.filter((s) => s !== projectName)
        onSelectedChange([...cleaned, areaKey])
      } else {
        // Adding this area — check if it completes all areas
        const newSelected = [...selected, areaKey]
        const allAreasSelected = areas.every(
          (a) =>
            a === areaName || newSelected.includes(`${projectName}\\${a}`),
        )
        if (allAreasSelected) {
          // Auto-consolidate to project level
          const cleaned = newSelected.filter(
            (s) => !s.startsWith(projectName + '\\'),
          )
          onSelectedChange([...cleaned, projectName])
        } else {
          onSelectedChange(newSelected)
        }
      }
    },
    [selected, areaPaths, onSelectedChange],
  )

  function toggleExpand(projectName: string) {
    setExpandedProjects((prev) => {
      const next = new Set(prev)
      if (next.has(projectName)) next.delete(projectName)
      else next.add(projectName)
      return next
    })
  }

  const allAreasExpanded = expandedProjects.size >= projectsWithAreas.size

  function toggleAllAreas() {
    if (allAreasExpanded) {
      setExpandedProjects(new Set())
    } else {
      setExpandedProjects(new Set(projectsWithAreas))
    }
  }

  // Build the display label
  const label = useMemo(() => {
    if (noneSelected) return 'No Projects'
    if (allSelected) return 'All Projects'

    // Count unique projects touched
    const projectSet = new Set<string>()
    for (const s of selected) {
      const sep = s.indexOf('\\')
      projectSet.add(sep === -1 ? s : s.slice(0, sep))
    }

    if (projectSet.size === 1) {
      const onlyProject = [...projectSet][0]
      if (selected.includes(onlyProject)) return onlyProject
      // Area-specific: show "Project > Area" for single area
      const areaEntries = selected.filter((s) => s.startsWith(onlyProject + '\\'))
      if (areaEntries.length === 1) {
        const areaName = areaEntries[0].slice(onlyProject.length + 1)
        return `${onlyProject} > ${areaName}`
      }
      return `${onlyProject} (${areaEntries.length} areas)`
    }

    return `${projectSet.size} Projects`
  }, [noneSelected, allSelected, selected])

  const selectionCount = useMemo(() => {
    const projectSet = new Set<string>()
    for (const s of selected) {
      const sep = s.indexOf('\\')
      projectSet.add(sep === -1 ? s : s.slice(0, sep))
    }
    return projectSet.size
  }, [selected])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between gap-2 min-w-[220px]"
        >
          <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
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
          <CommandInput placeholder="Search projects..." />
          <CommandList className="max-h-[60vh]">
            <CommandEmpty>No projects found.</CommandEmpty>

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
              {projectsWithAreas.size > 0 && (
                <CommandItem onSelect={toggleAllAreas}>
                  {allAreasExpanded ? (
                    <ChevronsDownUp className="mr-2 h-4 w-4" />
                  ) : (
                    <ChevronsUpDown className="mr-2 h-4 w-4" />
                  )}
                  {allAreasExpanded ? 'Collapse All Areas' : 'Expand All Areas'}
                </CommandItem>
              )}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Projects">
              {visibleProjects.map((project) => {
                const areas = areaPaths[project.name] ?? []
                const hasAreas = areas.length > 0
                const isExpanded = expandedProjects.has(project.name)
                const isFullySelected = isProjectFullySelected(project.name)
                const hasPartialSelection =
                  !isFullySelected && hasAnySelection(project.name)

                return (
                  <div key={project.id}>
                    <CommandItem
                      value={project.name}
                      onSelect={() => toggleProject(project.name)}
                      className="flex items-center"
                    >
                      {hasAreas ? (
                        <button
                          type="button"
                          className="mr-1 p-0.5 rounded hover:bg-accent/50 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            toggleExpand(project.name)
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </button>
                      ) : (
                        <span className="mr-1 w-[22px] shrink-0" />
                      )}
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4 shrink-0',
                          isFullySelected
                            ? 'opacity-100'
                            : hasPartialSelection
                              ? 'opacity-40'
                              : 'opacity-0',
                        )}
                      />
                      <span
                        className={cn(
                          'flex-1',
                          project.isArchived && 'text-muted-foreground',
                        )}
                      >
                        {project.name}
                      </span>
                      {hasAreas && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1 py-0 shrink-0 ml-2 text-muted-foreground"
                        >
                          {areas.length}
                        </Badge>
                      )}
                      {project.isArchived && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1 py-0 shrink-0 ml-1"
                        >
                          Archived
                        </Badge>
                      )}
                    </CommandItem>

                    {hasAreas && isExpanded &&
                      areas.map((areaName) => {
                        const areaSelected = isAreaSelected(project.name, areaName)
                        const parentFullySelected = selected.includes(project.name)
                        return (
                          <CommandItem
                            key={`${project.name}\\${areaName}`}
                            value={`${project.name} ${areaName}`}
                            onSelect={() => toggleArea(project.name, areaName)}
                            className="pl-12"
                          >
                            <GitBranch className="mr-2 h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                            <Check
                              className={cn(
                                'mr-2 h-3.5 w-3.5 shrink-0',
                                areaSelected || parentFullySelected
                                  ? 'opacity-100'
                                  : 'opacity-0',
                              )}
                            />
                            <span className="text-sm">{areaName}</span>
                          </CommandItem>
                        )
                      })}
                  </div>
                )
              })}
            </CommandGroup>
          </CommandList>

          <CommandSeparator />
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs text-muted-foreground">Show Archived</span>
            <Switch
              checked={showArchived}
              onCheckedChange={onToggleArchived}
              className="scale-75"
            />
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

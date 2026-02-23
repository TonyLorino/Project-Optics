import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Sprint } from '@/types/sprint'

interface SprintSelectorProps {
  sprints: Sprint[]
  selected: string | null
  onSelectedChange: (value: string | null) => void
}

export function SprintSelector({
  sprints,
  selected,
  onSelectedChange,
}: SprintSelectorProps) {
  // Deduplicate by sprint name (multiple projects may share same sprint names)
  const uniqueSprints = Array.from(
    new Map(
      sprints
        .sort((a, b) => {
          const da = a.startDate ? new Date(a.startDate).getTime() : 0
          const db = b.startDate ? new Date(b.startDate).getTime() : 0
          return db - da
        })
        .map((s) => [s.name, s]),
    ).values(),
  )

  const currentSprint = sprints.find((s) => s.timeFrame === 'current')

  return (
    <Select
      value={selected ?? '__all__'}
      onValueChange={(v) => onSelectedChange(v === '__all__' ? null : v)}
    >
      <SelectTrigger className="w-auto min-w-[200px] max-w-[400px]">
        <SelectValue placeholder="All Sprints" />
      </SelectTrigger>
      <SelectContent className="max-h-[60vh] w-auto min-w-[200px] max-w-[500px]">
        <SelectItem value="__all__">All Sprints</SelectItem>
        {currentSprint && (
          <SelectItem value={`__current__`}>
            Current Sprint ({currentSprint.name})
          </SelectItem>
        )}
        {uniqueSprints.map((sprint) => (
          <SelectItem key={sprint.id} value={sprint.path}>
            {sprint.name}
            {sprint.timeFrame === 'current' ? ' (current)' : ''}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

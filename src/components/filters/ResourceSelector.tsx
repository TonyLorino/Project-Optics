import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Resource {
  displayName: string
  uniqueName: string
}

interface ResourceSelectorProps {
  resources: Resource[]
  selected: string | null
  onSelectedChange: (value: string | null) => void
}

export function ResourceSelector({
  resources,
  selected,
  onSelectedChange,
}: ResourceSelectorProps) {
  return (
    <Select
      value={selected ?? '__all__'}
      onValueChange={(v) => onSelectedChange(v === '__all__' ? null : v)}
    >
      <SelectTrigger className="w-auto min-w-[200px] max-w-[400px]">
        <SelectValue placeholder="All Resources" />
      </SelectTrigger>
      <SelectContent className="max-h-[60vh] w-auto min-w-[200px] max-w-[500px]">
        <SelectItem value="__all__">All Resources</SelectItem>
        {resources.map((resource) => (
          <SelectItem key={resource.uniqueName} value={resource.uniqueName}>
            {resource.displayName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

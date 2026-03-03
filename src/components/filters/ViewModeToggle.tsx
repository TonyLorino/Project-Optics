import { FolderOpen, Hash } from 'lucide-react'
import type { ViewMode } from '@/store/uiStore'
import { cn } from '@/lib/utils'

interface ViewModeToggleProps {
  value: ViewMode
  onChange: (mode: ViewMode) => void
}

const modes: { id: ViewMode; label: string; icon: typeof FolderOpen }[] = [
  { id: 'area', label: 'Projects', icon: FolderOpen },
  { id: 'vertical', label: 'Tags', icon: Hash },
]

export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  return (
    <div className="inline-flex h-9 items-center rounded-md border bg-muted/40 p-1 text-sm">
      {modes.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 font-medium transition-colors',
            value === id
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  )
}

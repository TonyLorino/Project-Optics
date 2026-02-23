import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  icon: ReactNode
  label: string
  value: string | number
  subtitle?: string
  trend?: { value: number; label: string }
  className?: string
  isLoading?: boolean
}

export function MetricCard({
  icon,
  label,
  value,
  subtitle,
  trend,
  className,
  isLoading,
}: MetricCardProps) {
  if (isLoading) {
    return (
      <Card className={cn('relative overflow-hidden', className)}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-8 w-20 mt-4" />
          <Skeleton className="h-4 w-24 mt-1" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-200 hover:shadow-[0_4px_12px_0_rgb(0_0_0/0.06),0_2px_4px_-2px_rgb(0_0_0/0.04)] hover:scale-[1.01]',
        className,
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          {trend && (
            <span
              className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-full',
                trend.value >= 0
                  ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950'
                  : 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-950',
              )}
            >
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%{' '}
              {trend.label}
            </span>
          )}
        </div>
        <div className="mt-4">
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground/70 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

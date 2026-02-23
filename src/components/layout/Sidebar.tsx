import {
  LayoutDashboard,
  ShieldAlert,
  BarChart3,
  PanelLeftClose,
  PanelRightClose,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useUIStore, type ActivePage } from '@/store/uiStore'
import { cn } from '@/lib/utils'

const LOGO_TEXT = 'Project Optics'
const LOGO_BLUR: number[] = [1.0, 0.8, 0.65, 0.5, 0.35, 0.25, 0.15, 0.05, 0, 0, 0, 0, 0, 0, 0]

interface NavItem {
  icon: React.ReactNode
  label: string
  page?: ActivePage
  disabled?: boolean
  badge?: string
}

const navItems: NavItem[] = [
  {
    icon: <LayoutDashboard className="h-5 w-5" />,
    label: 'Dashboard',
    page: 'dashboard',
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    label: 'Project Reports',
    page: 'reports',
  },
  {
    icon: <ShieldAlert className="h-5 w-5" />,
    label: 'Watch List',
    page: 'watchlist',
  },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { activePage, setActivePage } = useUIStore()

  return (
    <motion.aside
      className="hidden md:flex flex-col border-r border-border bg-sidebar text-sidebar-foreground overflow-hidden"
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Logo + collapse toggle */}
      <div className="flex items-center justify-between h-16 px-3 border-b border-sidebar-border">
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="font-extrabold text-xl tracking-tight whitespace-nowrap overflow-hidden select-none flex"
            >
              {LOGO_TEXT.split('').map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ filter: 'blur(6px)', opacity: 0 }}
                  animate={{ filter: `blur(${LOGO_BLUR[i]}px)`, opacity: 1 }}
                  exit={{ filter: 'blur(4px)', opacity: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.02, ease: 'easeOut' }}
                  className="text-primary"
                  style={{ display: char === ' ' ? 'inline-block' : undefined, width: char === ' ' ? '0.25em' : undefined }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </motion.span>
              ))}
            </motion.span>
          )}
        </AnimatePresence>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="shrink-0 h-8 w-8"
            >
              {collapsed ? (
                <PanelRightClose className="h-5 w-5" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{collapsed ? 'Expand sidebar' : 'Collapse sidebar'}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map((item) => {
          const isActive = item.page != null && item.page === activePage

          const button = (
            <button
              key={item.label}
              disabled={item.disabled}
              onClick={() => { if (item.page) setActivePage(item.page) }}
              className={cn(
                'flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                item.disabled && 'opacity-50 cursor-not-allowed',
                collapsed && 'justify-center px-0',
              )}
            >
              {item.icon}
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex-1 text-left whitespace-nowrap overflow-hidden flex items-center gap-2"
                  >
                    {item.label}
                    {item.badge && (
                      <span className="text-[10px] font-medium bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          )

          if (collapsed) {
            return (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent side="right">
                  <p>
                    {item.label}
                    {item.badge ? ` (${item.badge})` : ''}
                  </p>
                </TooltipContent>
              </Tooltip>
            )
          }

          return button
        })}
      </nav>
    </motion.aside>
  )
}

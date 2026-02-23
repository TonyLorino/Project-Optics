import { Menu, Sun, Moon } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { useUIStore, type ActivePage } from '@/store/uiStore'
import { cn } from '@/lib/utils'

const LOGO_TEXT = 'Project Optics'
const LOGO_BLUR: number[] = [1.0, 0.8, 0.65, 0.5, 0.35, 0.25, 0.15, 0.05, 0, 0, 0, 0, 0, 0, 0]

interface MobileNavItem {
  label: string
  page?: ActivePage
  disabled?: boolean
  badge?: string
}

const mobileNavItems: MobileNavItem[] = [
  { label: 'Dashboard', page: 'dashboard' },
  { label: 'Project Reports', page: 'reports' },
  { label: 'Watch List', disabled: true, badge: 'Soon' },
]

export function Header() {
  const { darkMode, toggleDarkMode, activePage, setActivePage } = useUIStore()

  return (
    <header className="md:hidden flex items-center h-14 px-4 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
      {/* Mobile hamburger */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="mr-3">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex items-center h-14 px-4 gap-3 border-b border-border">
            <span className="font-extrabold text-xl tracking-tight select-none flex">
              {LOGO_TEXT.split('').map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ filter: 'blur(6px)', opacity: 0 }}
                  animate={{ filter: `blur(${LOGO_BLUR[i]}px)`, opacity: 1 }}
                  transition={{ duration: 0.35, delay: i * 0.02, ease: 'easeOut' }}
                  className="text-primary"
                  style={{ display: char === ' ' ? 'inline-block' : undefined, width: char === ' ' ? '0.25em' : undefined }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </motion.span>
              ))}
            </span>
          </div>
          <nav className="p-4 space-y-2">
            {mobileNavItems.map((item) => {
              const isActive = item.page != null && item.page === activePage
              return (
                <button
                  key={item.label}
                  disabled={item.disabled}
                  onClick={() => { if (item.page) setActivePage(item.page) }}
                  className={cn(
                    'flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                    item.disabled && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  {item.label}
                  {item.badge && (
                    <span className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
          <Separator />
        </SheetContent>
      </Sheet>

      {/* Title */}
      <div className="flex items-center gap-2 flex-1">
        <span className="font-extrabold text-lg tracking-tight select-none flex">
          {LOGO_TEXT.split('').map((char, i) => (
            <motion.span
              key={i}
              initial={{ filter: 'blur(6px)', opacity: 0 }}
              animate={{ filter: `blur(${LOGO_BLUR[i]}px)`, opacity: 1 }}
              transition={{ duration: 0.35, delay: i * 0.02, ease: 'easeOut' }}
              className="bg-gradient-to-r from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent"
              style={{ display: char === ' ' ? 'inline-block' : undefined, width: char === ' ' ? '0.25em' : undefined }}
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </span>
      </div>

      {/* Dark mode toggle (mobile) */}
      <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
        {darkMode ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
        <span className="sr-only">Toggle theme</span>
      </Button>
    </header>
  )
}

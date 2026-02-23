import { useState, useEffect, type ReactNode } from 'react'
import { Sun, Moon } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { SyncIndicator } from '@/components/dashboard/SyncIndicator'
import { useUIStore } from '@/store/uiStore'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { darkMode, toggleDarkMode, syncLastUpdated, syncIsFetching, syncRefetch } = useUIStore()

  useEffect(() => {
    const root = document.documentElement
    root.classList.add('transitioning')
    root.classList.toggle('dark', darkMode)
    const timeout = setTimeout(() => root.classList.remove('transitioning'), 300)
    return () => clearTimeout(timeout)
  }, [darkMode])

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="relative flex-1 overflow-y-auto">
          {/* Top-right controls: sync + dark mode */}
          <div className="hidden md:flex items-center gap-2 absolute top-4 right-4 z-30">
            <SyncIndicator
              lastUpdated={syncLastUpdated}
              isFetching={syncIsFetching}
              onRefresh={() => syncRefetch?.()}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="h-8 w-8"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={darkMode ? 'sun' : 'moon'}
                  initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  {darkMode ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </motion.span>
              </AnimatePresence>
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
          {children}
        </main>
      </div>
    </div>
  )
}

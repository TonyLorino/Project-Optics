import { lazy, Suspense } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AppLayout } from '@/components/layout/AppLayout'
import { Skeleton } from '@/components/ui/skeleton'
import { useUIStore } from '@/store/uiStore'
import { useHashSync } from '@/hooks/useHashSync'

const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const Reports = lazy(() => import('@/pages/Reports').then((m) => ({ default: m.Reports })))
const WatchList = lazy(() => import('@/pages/WatchList').then((m) => ({ default: m.WatchList })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
      retry: 2,
    },
  },
})

function PageSkeleton() {
  return (
    <div className="p-4 md:px-6 lg:px-8 space-y-6 max-w-[1600px] mx-auto">
      <Skeleton className="h-9 w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  )
}

function PageRouter() {
  const activePage = useUIStore((s) => s.activePage)

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activePage}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <Suspense fallback={<PageSkeleton />}>
          {activePage === 'watchlist' ? <WatchList /> : activePage === 'reports' ? <Reports /> : <Dashboard />}
        </Suspense>
      </motion.div>
    </AnimatePresence>
  )
}

function App() {
  useHashSync()

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppLayout>
          <ErrorBoundary>
            <PageRouter />
          </ErrorBoundary>
        </AppLayout>
        <Toaster richColors position="bottom-right" />
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App

import { Outlet, useLocation } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import { MotionProvider } from '../motion/motion-provider'
import { ThemeProvider } from './components/theme-provider'
import { Footer } from './components/footer'
import { Nav } from './components/nav'
import { ScrollToTop } from './components/scroll-to-top'
import { Toaster } from './components/toaster'
import { transitions } from '../motion/transitionPresets'
import './Root.css'
// Supports weights 100-900
import '@fontsource-variable/inter'
import { useSubscriptionStatus } from '../hooks/useSubscriptionStatus'
import { SubscriptionInterstitial } from './components/SubscriptionInterstitial'
import { Skeleton } from '../client/components/ui/skeleton'
import { useEffect } from 'react'
import { syncTransactions } from 'wasp/client/operations'
import dayjs from 'dayjs'
import { useToast } from '../hooks/use-toast'
import { cn } from '../lib/utils'

// Define routes that don't require subscription check
const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/request-password-reset',
  '/password-reset',
  '/email-verification',
  '/',
  '/checkout',
]

export default function Root() {
  const { user, isLoading, isSubscribedOrTrialing, trialEndsAt } =
    useSubscriptionStatus()
  const location = useLocation()
  const { toast } = useToast()

  // Determine if the current route requires a subscription check
  const isProtectedRoute = user && !PUBLIC_ROUTES.includes(location.pathname)
  const isSubscriptionPage = location.pathname === '/subscription'
  const showInterstitial =
    isProtectedRoute && !isSubscribedOrTrialing && !isSubscriptionPage

  // Added: Effect to trigger daily sync
  useEffect(() => {
    if (user && user.subscriptionStatus === 'active') {
      const lastSync = user.lastSyncedAt ? dayjs(user.lastSyncedAt) : null
      const needsSync = !lastSync || dayjs().diff(lastSync, 'hour') >= 24

      if (needsSync) {
        console.log('User is active and needs sync. Triggering sync...')
        syncTransactions({})
          .then(() => {
            console.log('Background sync completed successfully.')
            // Optionally refetch user data if needed, or rely on server update
          })
          .catch((error) => {
            console.error('Background sync failed:', error)
            // Use custom useToast for non-blocking user feedback
            toast({
              variant: 'destructive',
              title: 'Sync Error',
              description: 'Failed to sync transactions in the background.',
            })
          })
      } else {
        console.log('User is active but sync is up-to-date.')
      }
    }
  }, [user, toast]) // Dependency array includes user and the toast function

  // Determine if it's the landing page
  const isLandingPage = location.pathname === '/'

  return (
    <MotionConfig reducedMotion='user' transition={transitions.snappy}>
      <ThemeProvider storageKey='vite-ui-theme'>
        <MotionProvider>
          <div className='flex min-h-screen w-full flex-col'>
            <header>
              <Nav />
            </header>
            <main
              className={cn(
                'flex flex-1 flex-col',
                isLandingPage
                  ? 'items-center justify-center'
                  : 'mx-auto w-full max-w-5xl gap-8 p-6 py-24',
              )}
            >
              {isLoading && isProtectedRoute ? (
                <div className='flex flex-col gap-8'>
                  <Skeleton className='h-48 w-full' />
                  <Skeleton className='h-96 w-full' />
                </div>
              ) : showInterstitial ? (
                <SubscriptionInterstitial trialEndsAt={trialEndsAt?.toDate()} />
              ) : (
                <Outlet />
              )}
            </main>
            <Toaster />
            <ScrollToTop />
            <footer className='relative z-50 border-t border-input bg-background'>
              <div className='relative z-50 mx-auto max-w-7xl'>
                <Footer />
              </div>
            </footer>
          </div>
        </MotionProvider>
      </ThemeProvider>
    </MotionConfig>
  )
}

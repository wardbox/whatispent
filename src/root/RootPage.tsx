import { Outlet, useLocation } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import { MotionProvider } from '../motion/motion-provider'
import { ThemeProvider } from './components/theme-provider'
import { Footer } from './components/footer'
import { Nav } from './components/nav'
import { ScrollToTop } from './components/scroll-to-top'
import { Toaster } from './components/toaster'
import { TransitionPlayground } from './components/transition-playground'
import { transitions } from '../motion/transitionPresets'
import './Root.css'
// Supports weights 100-900
import '@fontsource-variable/inter'
import { useSubscriptionStatus } from '../hooks/useSubscriptionStatus'
import { SubscriptionInterstitial } from './components/SubscriptionInterstitial'
import { Skeleton } from '../client/components/ui/skeleton'

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

  // Determine if the current route requires a subscription check
  const isProtectedRoute = user && !PUBLIC_ROUTES.includes(location.pathname)
  const isSubscriptionPage = location.pathname === '/subscription'
  const showInterstitial =
    isProtectedRoute && !isSubscribedOrTrialing && !isSubscriptionPage

  return (
    <MotionConfig reducedMotion='user' transition={transitions.snappy}>
      <ThemeProvider storageKey='vite-ui-theme'>
        <MotionProvider>
          <div className='flex min-h-screen w-full flex-col'>
            <header>
              <Nav />
            </header>
            <main className='mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 p-6 py-24'>
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
            <TransitionPlayground />
          </div>
        </MotionProvider>
      </ThemeProvider>
    </MotionConfig>
  )
}

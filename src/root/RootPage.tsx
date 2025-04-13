import { Outlet } from 'react-router-dom'
import { useAuth } from 'wasp/client/auth'
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

export default function Root() {
  const { data: user, isLoading } = useAuth()

  return (
    <MotionConfig reducedMotion='user' transition={transitions.snappy}>
      <ThemeProvider storageKey='vite-ui-theme'>
        <MotionProvider>
          <div className='flex min-h-screen w-full flex-col'>
            <header>
              <Nav user={user} userLoading={isLoading} />
            </header>
            <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 p-6 py-24">
              <Outlet />
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

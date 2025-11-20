import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { fadeIn } from '../../motion/transitionPresets'
import { GithubLogo, TwitterLogo, MoneyWavy } from '@phosphor-icons/react'
import { usePrefetch } from '../../lib/utils'

const ScrollToTopLink = ({
  to,
  children,
  className,
}: {
  to: string
  children: React.ReactNode
  className?: string
}) => {
  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const prefetch = usePrefetch()

  return (
    <Link
      to={to}
      className={className}
      onClick={handleClick}
      onMouseEnter={() => prefetch(to, undefined, { assets: true })}
    >
      {children}
    </Link>
  )
}

const navigation = {
  main: [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Transactions', href: '/transactions' },
    { name: 'Subscription', href: '/subscription' },
  ],
  legal: [
    { name: 'Privacy', href: '/privacy' },
    { name: 'Terms', href: '/terms' },
  ],
  social: [
    {
      name: 'GitHub',
      href: 'https://github.com/wardbox',
      icon: 'GithubLogo',
    },
    {
      name: 'Twitter',
      href: 'https://twitter.com/ward_box',
      icon: 'TwitterLogo',
    },
  ],
}

export function Footer() {
  return (
    <motion.div
      variants={fadeIn}
      initial='initial'
      animate='animate'
      className='relative z-50 mx-auto max-w-7xl'
    >
      <div className='px-6 py-4'>
        {/* Mobile Layout */}
        <div className='flex flex-col space-y-4 lg:hidden'>
          {/* Logo & Social */}
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <MoneyWavy size={20} weight='fill' />
              <span className='text-sm text-muted-foreground'>
                &copy; {new Date().getFullYear()} what i spent
              </span>
            </div>
            <div className='flex gap-4'>
              {navigation.social.map(item => (
                <a
                  key={item.name}
                  href={item.href}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-muted-foreground transition-colors hover:text-foreground'
                  aria-label={item.name}
                >
                  {item.icon === 'GithubLogo' ? (
                    <GithubLogo size={20} weight='fill' />
                  ) : (
                    <TwitterLogo size={20} weight='fill' />
                  )}
                </a>
              ))}
            </div>
          </div>

          {/* Navigation - Horizontal Scrolling */}
          <div className='overflow-x-auto'>
            <nav className='flex min-w-max gap-4 py-1' aria-label='Footer'>
              {navigation.main.map(item => (
                <ScrollToTopLink
                  key={item.name}
                  to={item.href}
                  className='whitespace-nowrap text-sm text-muted-foreground transition-colors hover:text-foreground'
                >
                  {item.name}
                </ScrollToTopLink>
              ))}
            </nav>
          </div>

          {/* Legal Links - Mobile */}
          <div className='flex flex-wrap gap-3 border-t pt-3 text-xs'>
            {navigation.legal.map(item => (
              <ScrollToTopLink
                key={item.name}
                to={item.href}
                className='text-muted-foreground transition-colors hover:text-foreground'
              >
                {item.name}
              </ScrollToTopLink>
            ))}
            <span className='text-muted-foreground'>•</span>
            <a
              href='mailto:support@whatispent.com'
              className='text-muted-foreground transition-colors hover:text-foreground'
            >
              Support
            </a>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className='hidden lg:block'>
          {/* Main Row */}
          <div className='flex items-center justify-between border-b border-border pb-4'>
            {/* Logo & Title */}
            <div className='flex items-center space-x-3'>
              <h2 className='flex items-center gap-2 text-lg font-light tracking-tighter'>
                what i spent
              </h2>
              <span className='text-muted-foreground'>|</span>
              <p className='text-sm text-muted-foreground'>
                this day. this week. this month.
              </p>
            </div>

            {/* Navigation */}
            <nav className='flex gap-x-8' aria-label='Footer'>
              {navigation.main.map(item => (
                <ScrollToTopLink
                  key={item.name}
                  to={item.href}
                  className='text-sm text-muted-foreground transition-colors hover:text-foreground'
                >
                  {item.name}
                </ScrollToTopLink>
              ))}
            </nav>
          </div>

          {/* Bottom Row */}
          <div className='flex items-center justify-between pt-4'>
            {/* Legal & Support */}
            <nav className='flex items-center gap-3 text-xs' aria-label='Legal'>
              {navigation.legal.map((item, index) => (
                <ScrollToTopLink
                  key={item.name}
                  to={item.href}
                  className='text-muted-foreground transition-colors hover:text-foreground'
                >
                  {item.name}
                </ScrollToTopLink>
              ))}
              <a
                href='mailto:support@whatispent.com'
                className='text-muted-foreground transition-colors hover:text-foreground'
              >
                Support
              </a>
            </nav>

            {/* Social & Copyright */}
            <div className='flex items-center gap-4'>
              {/* Social Icons */}
              {navigation.social.map(item => (
                <a
                  key={item.name}
                  href={item.href}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-muted-foreground transition-colors hover:text-foreground'
                  aria-label={item.name}
                >
                  {item.icon === 'GithubLogo' ? (
                    <GithubLogo size={18} weight='fill' />
                  ) : (
                    <TwitterLogo size={18} weight='fill' />
                  )}
                </a>
              ))}

              {/* Copyright */}
              <p className='text-xs text-muted-foreground'>
                © {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default Footer

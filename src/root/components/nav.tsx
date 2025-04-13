import * as React from 'react'
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { cn, usePrefetch } from '../../lib/utils'
import { Link } from 'wasp/client/router'
import {
  HouseSimple,
  List,
  User as UserIcon,
} from '@phosphor-icons/react'
import { ModeToggle } from '../../client/components/mode-toggle'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../../client/components/ui/sheet'
import { Button } from '../../client/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../client/components/ui/dropdown-menu'
import { logout } from 'wasp/client/auth'
import { type User } from 'wasp/entities'
import { Skeleton } from '../../client/components/ui/skeleton'
import { motion } from 'motion/react'
import { fadeIn } from '../../motion/transitionPresets'

interface NavProps extends React.HTMLAttributes<HTMLElement> {
  user?: User | null
  userLoading?: boolean
}

const Nav = React.forwardRef<HTMLElement, NavProps>(
  ({ user, userLoading, ...props }, ref) => {
    const [open, setOpen] = useState(false)
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const location = useLocation()
    const prefetch = usePrefetch()

    const handleNavigation = () => {
      setOpen(false)
    }

    return (
      <nav
        ref={ref}
        className={cn(
          'sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/90 px-6 backdrop-blur-md',
          props.className,
        )}
        {...props}
      >
        <div className='flex items-center space-x-4 lg:space-x-8'>
          <Link
            to='/'
            className='flex items-center space-x-2'
            onMouseEnter={() => prefetch('/', undefined, { assets: true })}
          >
            <span className='font-light tracking-tighter'>
              what i spent
            </span>
          </Link>
          <div className='hidden items-center space-x-4 text-muted-foreground md:flex lg:space-x-6'>
            <Link
              to='/'
              className={cn(
                'text-md flex items-center space-x-2 font-medium transition-colors hover:text-primary',
                location.pathname === '/' && 'text-primary',
              )}
              onMouseEnter={() => prefetch('/', undefined, { assets: true })}
            >
              <span>Home</span>
            </Link>
            <Link
              to='/dashboard'
              className={cn(
                'text-md flex items-center space-x-2 font-medium transition-colors hover:text-primary',
                location.pathname === '/dashboard' && 'text-primary',
              )}
              onMouseEnter={() => prefetch('/dashboard')}
            >
              <span>Dashboard</span>
            </Link>
            <Link
              to='/transactions'
              className={cn(
                'text-md flex items-center space-x-2 font-medium transition-colors hover:text-primary',
                location.pathname === '/transactions' && 'text-primary',
              )}
              onMouseEnter={() => prefetch('/transactions')}
            >
              <span>Transactions</span>
            </Link>
          </div>
        </div>

        <div className='flex items-center gap-4'>
          <ModeToggle iconSize='md' />
          {/* Desktop Menu */}
          <div className='hidden items-center space-x-4 md:flex'>
            {userLoading ? (
              <div className='flex items-center'>
                <Skeleton className='h-10 w-10' />
              </div>
            ) : (
              <div className='flex items-center animate-in fade-in'>
                {user ? (
                  <DropdownMenu
                    open={dropdownOpen}
                    onOpenChange={setDropdownOpen}
                    modal={false}
                  >
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant='outline'
                        size='icon'
                        aria-label='User menu'
                      >
                        <UserIcon size={24} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <Link
                        to='/profile'
                        onMouseEnter={() => prefetch('/profile')}
                        onClick={() => setDropdownOpen(false)}
                        className='cursor-pointer'
                      >
                        <DropdownMenuItem>Profile</DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className='cursor-pointer text-red-600'
                        onClick={() => {
                          setDropdownOpen(false)
                          logout()
                        }}
                      >
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <DropdownMenu
                    open={dropdownOpen}
                    onOpenChange={setDropdownOpen}
                    modal={false}
                  >
                    <DropdownMenuTrigger asChild>
                      <Button variant='outline' size='icon'>
                        <UserIcon size={24} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <Link
                        to='/login'
                        onMouseEnter={() =>
                          prefetch('/login', undefined, {
                            assets: true,
                          })
                        }
                      >
                        <DropdownMenuItem
                          onClick={() => setDropdownOpen(false)}
                          className='cursor-pointer'
                        >
                          Log in
                        </DropdownMenuItem>
                      </Link>
                      <Link
                        to='/signup'
                        onMouseEnter={() =>
                          prefetch('/signup', undefined, {
                            assets: true,
                          })
                        }
                      >
                        <DropdownMenuItem
                          onClick={() => setDropdownOpen(false)}
                          className='cursor-pointer'
                        >
                          Sign up
                        </DropdownMenuItem>
                      </Link>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className='md:hidden'>
              <List size={24} />
            </SheetTrigger>
            <SheetContent side='right'>
              <SheetHeader>
                <SheetTitle hidden>Navigation</SheetTitle>
                <SheetDescription hidden>
                  Navigate to the pages you want.
                </SheetDescription>
              </SheetHeader>
              <div className='flex flex-col gap-3 space-y-4'>
                <Link
                  to='/'
                  className={cn(
                    'text-md flex items-center space-x-4 font-medium transition-colors hover:text-primary',
                    location.pathname === '/' && 'text-primary',
                  )}
                  onClick={handleNavigation}
                  aria-label='Home'
                >
                  <Button size='icon' className='rounded-full' iconSize='lg'>
                    <HouseSimple size={24} weight='fill' />
                  </Button>
                  <span className='text-3xl'>Home</span>
                </Link>
                {/* Mobile Auth Menu Items */}
                {userLoading ? (
                  <>
                    <DropdownMenuSeparator />
                    <Skeleton className='h-10 w-10' />
                  </>
                ) : (
                  <motion.div
                    variants={fadeIn}
                    initial='initial'
                    animate='animate'
                    className='col-span-2 mx-auto flex w-full gap-2'
                  >
                    {user ? (
                      <div className='col-span-2 mx-auto flex w-full flex-col justify-center gap-8'>
                        <DropdownMenuSeparator />
                        <Link
                          to='/profile'
                          className={cn(
                            'text-md flex items-center space-x-4 font-medium transition-colors hover:text-primary',
                            location.pathname.startsWith('/profile') &&
                              'text-primary',
                          )}
                          onClick={handleNavigation}
                          onMouseEnter={() => prefetch('/profile')}
                        >
                          <Button
                            size='icon'
                            className='rounded-full'
                            iconSize='lg'
                          >
                            <UserIcon size={24} weight='fill' />
                          </Button>
                          <span className='text-3xl'>Profile</span>
                        </Link>
                        <Button
                          onClick={() => {
                            logout()
                            handleNavigation()
                          }}
                          variant='destructive'
                        >
                          <span className='text-lg'>Log out</span>
                        </Button>
                      </div>
                    ) : (
                      <div className='col-span-2 mx-auto flex w-full justify-center gap-4 pt-8'>
                        <DropdownMenuSeparator />
                        <Link
                          to='/login'
                          className='text-md flex cursor-pointer items-center space-x-4 font-medium transition-all'
                          onClick={handleNavigation}
                          onMouseEnter={() => prefetch('/login')}
                        >
                          <Button>
                            <span className='text-lg'>Log in</span>
                          </Button>
                        </Link>
                        <Link
                          to='/signup'
                          className='text-md flex items-center space-x-4 font-medium'
                          onClick={handleNavigation}
                          onMouseEnter={() => prefetch('/signup')}
                        >
                          <Button>
                            <span className='text-lg'>Sign up</span>
                          </Button>
                        </Link>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    )
  },
)

Nav.displayName = 'Nav'

export { Nav }

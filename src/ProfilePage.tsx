import { type AuthUser } from 'wasp/auth'
import { motion } from 'motion/react'
import { fadeIn } from './motion/transitionPresets'
import { Link } from 'wasp/client/router'
import { routes } from 'wasp/client/router'
import { Button } from './client/components/ui/button'
import { useState, useEffect } from 'react'
import { deleteUserAccount, exportUserData } from 'wasp/client/operations'
import { useToast } from './hooks/use-toast'
import { useNavigate } from 'react-router-dom'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './client/components/ui/alert-dialog'
import { Download, Trash } from '@phosphor-icons/react'
import { logout } from 'wasp/client/auth'

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

const Profile = ({ user }: { user: AuthUser }) => {
  const subscriptionStatus = user?.subscriptionStatus || 'No Subscription'
  const isSubscribed = subscriptionStatus === 'active'
  const [greeting, setGreeting] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    setGreeting(getGreeting())
  }, [])

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const data = await exportUserData()

      // Create a downloadable JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `whatispent-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: 'Data exported successfully',
        description: 'Your data has been downloaded as a JSON file.',
      })
    } catch (error: any) {
      toast({
        title: 'Export failed',
        description: error.message || 'Failed to export your data',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      await deleteUserAccount()

      toast({
        title: 'Account deleted',
        description: 'Your account and all data have been permanently deleted.',
      })

      // Log out and redirect to landing page
      await logout()
      navigate('/')
    } catch (error: any) {
      toast({
        title: 'Deletion failed',
        description: error.message || 'Failed to delete your account',
        variant: 'destructive',
      })
      setIsDeleting(false)
    }
  }

  return (
    <motion.div
      initial='initial'
      animate='animate'
      exit='exit'
      variants={fadeIn}
      className='mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:px-8'
    >
      <h1 className='text-4xl font-thin tracking-tight'>Profile</h1>
      <p className='text-lg text-muted-foreground'>
        {greeting}, {user?.username || 'there'}!
      </p>
      <div className='space-y-6 rounded-lg border bg-card p-6 text-card-foreground shadow-sm'>
        <div className='space-y-2'>
          <p className='text-sm font-medium text-muted-foreground'>Email</p>
          <p className='text-lg'>{user?.email || 'N/A'}</p>
        </div>
        <div className='space-y-3'>
          <p className='text-sm font-medium text-muted-foreground'>
            Subscription Status
          </p>
          <p className='text-lg capitalize'>
            {subscriptionStatus.replace('_', ' ')}
          </p>
          <Button asChild variant='outline' size='sm' className='font-light'>
            <Link to={routes.SubscriptionRoute.to}>
              {isSubscribed ? 'Manage Subscription' : 'Subscribe Now'}
            </Link>
          </Button>
        </div>
      </div>

      <div className='space-y-6 rounded-lg border bg-card p-6 text-card-foreground shadow-sm'>
        <h2 className='text-2xl font-thin tracking-tight'>Data & Privacy</h2>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <p className='text-sm font-medium'>Export Your Data</p>
            <p className='text-sm text-muted-foreground'>
              Download all your data including transactions, accounts, and
              institutions as a JSON file.
            </p>
            <Button
              onClick={handleExportData}
              disabled={isExporting}
              variant='outline'
              size='sm'
              className='font-light'
            >
              <Download className='mr-2 h-4 w-4' />
              {isExporting ? 'Exporting...' : 'Export Data'}
            </Button>
          </div>

          <div className='space-y-2 border-t pt-4'>
            <p className='text-sm font-medium text-destructive'>
              Delete Account
            </p>
            <p className='text-sm text-muted-foreground'>
              Permanently delete your account and all associated data. This
              action cannot be undone.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant='destructive'
                  size='sm'
                  className='font-light'
                  disabled={isDeleting}
                >
                  <Trash className='mr-2 h-4 w-4' />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    your account and remove all your data from our servers,
                    including:
                    <ul className='mt-2 list-inside list-disc space-y-1'>
                      <li>All connected bank accounts and institutions</li>
                      <li>All transaction history</li>
                      <li>Your subscription (if active)</li>
                      <li>All account settings and preferences</li>
                    </ul>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Account'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default Profile

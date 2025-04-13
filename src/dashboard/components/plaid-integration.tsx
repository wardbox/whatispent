import { motion } from 'framer-motion'
import {
  Check,
  X,
  CircleNotch,
  CreditCard,
  Terminal,
} from '@phosphor-icons/react'
import {
  useQuery,
  useAction,
  getInstitutions,
  createLinkToken,
  exchangePublicToken,
  deleteInstitution,
} from 'wasp/client/operations'
import { PlaidLinkButton } from './plaid-link-button'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '../../client/components/ui/alert'
import { Button } from '../../client/components/ui/button'
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
} from '../../client/components/ui/alert-dialog'
import { useState } from 'react'
import { toast } from 'sonner'

export function PlaidIntegration() {
  // Fetch institutions and their accounts
  const {
    data: institutions,
    isLoading: isLoadingInstitutions,
    error: institutionsError,
    refetch: refetchInstitutions,
  } = useQuery(getInstitutions) // Remove explicit type, let Wasp infer
  const deleteInstitutionAction = useAction(deleteInstitution)
  const [institutionToDelete, setInstitutionToDelete] = useState<string | null>(
    null,
  )
  const [isDeleting, setIsDeleting] = useState(false)

  // Determine connection status based on whether we have institutions
  const isConnected = institutions && institutions.length > 0

  const handleConnectionSuccess = () => {
    refetchInstitutions()
  }

  const handleDelete = async () => {
    if (!institutionToDelete) return
    setIsDeleting(true)
    try {
      await deleteInstitutionAction({ institutionId: institutionToDelete })
      toast.success('Institution deleted successfully.')
      refetchInstitutions()
      setInstitutionToDelete(null)
    } catch (error: any) {
      console.error('Error deleting institution:', error)
      toast.error(error.message || 'Failed to delete institution.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoadingInstitutions) {
    return (
      <div className='flex h-40 items-center justify-center rounded-2xl border border-border p-6 text-xs text-muted-foreground'>
        Loading connected accounts...
      </div>
    )
  }

  if (institutionsError) {
    return (
      <Alert variant='destructive'>
        <Terminal className='h-4 w-4' />
        <AlertTitle>Error Loading Accounts</AlertTitle>
        <AlertDescription>
          There was a problem fetching your connected bank accounts. Please try
          again later.
          {institutionsError.message && (
            <p className='mt-2 text-xs'>({institutionsError.message})</p>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <AlertDialog
      open={!!institutionToDelete}
      onOpenChange={(open: boolean) => {
        if (!open) {
          setInstitutionToDelete(null)
        }
      }}
    >
      <div className='mt-1'>
        {!isConnected ? (
          <motion.div
            className='flex flex-col items-center space-y-4 rounded-2xl border border-border p-6 text-center'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <p className='text-xs text-zinc-500'>
              Connect your bank account to automatically track your spending
            </p>
            {/* Use PlaidLinkButton */}
            <PlaidLinkButton
              createLinkTokenAction={createLinkToken}
              exchangePublicTokenAction={exchangePublicToken}
              onSuccess={handleConnectionSuccess}
            />
          </motion.div>
        ) : (
          <motion.div
            className='flex flex-col space-y-4 rounded-2xl border border-border p-6'
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <div className='flex h-6 w-6 items-center justify-center rounded-full border-border bg-background text-foreground'>
                  <Check size={16} />
                </div>
                <span className='text-sm font-light'>Connected</span>
              </div>
              {/* Simplified Add button - PlaidLinkButton can act as Add */}
              <PlaidLinkButton
                createLinkTokenAction={createLinkToken}
                exchangePublicTokenAction={exchangePublicToken}
                onSuccess={handleConnectionSuccess}
              />
            </div>

            <div className='space-y-3 pt-3'>
              {/* Map over institutions instead of accounts */}
              {institutions?.map((institution, index) => (
                <motion.div
                  key={institution.id}
                  className='flex items-center justify-between border-b border-border pb-3 last:border-0'
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.5 }}
                >
                  <div className='flex flex-1 items-center gap-3 overflow-hidden pr-2'>
                    <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted'>
                      {/* Use a generic bank icon or fetch institution logo if available */}
                      <CreditCard className='h-4 w-4 text-foreground' />
                    </div>
                    <div className='flex-1 overflow-hidden'>
                      <p className='truncate text-sm font-light'>
                        {institution.institutionName}
                      </p>
                      <p className='text-xs text-zinc-400'>
                        {institution.accounts.length} account(s) linked
                      </p>
                    </div>
                  </div>
                  {/* Delete Button Trigger */}
                  <AlertDialogTrigger asChild>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='flex-shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive'
                      onClick={() => setInstitutionToDelete(institution.id)}
                    >
                      <X />
                    </Button>
                  </AlertDialogTrigger>
                </motion.div>
              ))}
            </div>

            {/* Remove Manage accounts button for now, can be added later */}
            {/* <Button variant="ghost" size="sm" className="mt-2 h-7 w-full text-xs">
            Manage accounts
          </Button> */}
          </motion.div>
        )}
      </div>
      {/* Confirmation Dialog Content */}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the
            institution and all associated accounts and transactions from our
            records.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
            {isDeleting && (
              <CircleNotch className='mr-2 h-4 w-4 animate-spin' />
            )}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

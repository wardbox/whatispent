import { motion } from 'framer-motion'
import {
  Check,
  X,
  CircleNotch,
  CreditCard,
  Terminal,
  Gear,
} from '@phosphor-icons/react'
import {
  useAction,
  createLinkToken,
  exchangePublicToken,
  deleteInstitution,
  toggleAccountTracking,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../client/components/ui/dialog'
import { Switch } from '../../client/components/ui/switch'
import { useState } from 'react'
import { useToast } from '../../hooks/use-toast'
import { InstitutionsSummaryProps } from '../DashboardPage'

type ExchangeResult = {
  institutionId: string
}

export function PlaidIntegration({
  institutions,
  isLoading,
  error,
  refetch,
  syncingInstitutionId,
  setSyncingInstitutionId,
  isConnectingPlaid,
  setIsConnectingPlaid,
}: InstitutionsSummaryProps) {
  const { toast } = useToast()
  const deleteInstitutionAction = useAction(deleteInstitution)
  const toggleAccountTrackingAction = useAction(toggleAccountTracking)
  const [institutionToDelete, setInstitutionToDelete] = useState<string | null>(
    null,
  )
  const [isDeleting, setIsDeleting] = useState(false)
  const [manageAccountsInstitutionId, setManageAccountsInstitutionId] =
    useState<string | null>(null)

  // Determine connection status based on whether we have institutions
  const isConnected = institutions && institutions.length > 0

  // Modified success handler to await refetch and clear state
  const handleConnectionSuccess = async (
    result: ExchangeResult | undefined,
  ) => {
    let currentSyncingId: string | null = null // Temporary variable
    // Check if result and institutionId exist
    if (result?.institutionId) {
      currentSyncingId = result.institutionId
      setSyncingInstitutionId(currentSyncingId)
      toast({
        title: 'Syncing transactions for new institution...',
        description: 'This might take a moment.',
      })
    }

    try {
      refetch()
      // Optional: Add a small delay if UI updates seem too fast
      // await new Promise(resolve => setTimeout(resolve, 100));
    } catch {
      toast({
        title: 'Error',
        description: 'Error refetching institutions after connection success.',
      })
      // Handle refetch error if necessary, e.g., show a toast
    } finally {
      // Ensure the spinner for the *specific* institution that was syncing is cleared
      // This check prevents clearing the spinner if another connection happened quickly
      if (currentSyncingId) {
        setSyncingInstitutionId(null)
        // Consider showing a success toast now
        toast({
          title: 'Initial transaction sync complete!',
          description: 'You can now view your transactions.',
        })
      }
    }
  }

  // Error handler for Plaid Link connection
  const handleConnectionError = (error: any) => {
    toast({
      title: 'Error',
      description: 'Received connection error:',
    })
    // Check for the status code in a potentially nested structure common in Wasp errors
    const statusCode = error?.data?.httpError?.statusCode || error?.statusCode

    if (statusCode === 409) {
      toast({
        title: 'This institution is already linked.',
      })
    } else {
      toast({
        title: 'Connection Failed',
      })
    }
    // Clear any potential syncing state if an error occurred before success
    setSyncingInstitutionId(null)
  }

  const handleDelete = async () => {
    if (!institutionToDelete) return
    setIsDeleting(true)
    try {
      await deleteInstitutionAction({ institutionId: institutionToDelete })
      toast({
        title: 'Institution deleted successfully.',
      })
      refetch()
      setInstitutionToDelete(null)
    } catch {
      toast({
        title: 'Failed to delete institution.',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleAccount = async (
    accountId: string,
    currentlyTracked: boolean,
  ) => {
    try {
      await toggleAccountTrackingAction({
        accountId,
        isTracked: !currentlyTracked,
      })
      refetch() // Refresh to show updated state
      toast({
        title: currentlyTracked
          ? 'Account excluded from spending'
          : 'Account included in spending',
      })
    } catch {
      toast({
        title: 'Failed to update account',
        variant: 'destructive',
      })
    }
  }

  // Simplified loading check: Show loading if the initial fetch is happening,
  // regardless of syncing state or if institutions array already exists (it might be stale).
  if (isLoading) {
    return (
      <div className='flex h-40 items-center justify-center rounded-2xl border border-border p-6 text-xs text-muted-foreground'>
        Loading connected accounts...
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant='destructive'>
        <Terminal className='h-4 w-4' />
        <AlertTitle>Error Loading Accounts</AlertTitle>
        <AlertDescription>
          There was a problem fetching your connected bank accounts. Please try
          again later.
          {error.message && <p className='mt-2 text-xs'>({error.message})</p>}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <>
      <AlertDialog
        open={!!institutionToDelete}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setInstitutionToDelete(null)
          }
        }}
      >
        <div className='mt-1'>
          {/* Render content only after initial loading is complete */}
          {!isLoading && !isConnected && (
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
                onError={handleConnectionError}
                isLoading={isConnectingPlaid}
                setIsLoading={setIsConnectingPlaid}
              />
            </motion.div>
          )}
          {!isLoading && isConnected && (
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
                  onError={handleConnectionError}
                  isLoading={isConnectingPlaid}
                  setIsLoading={setIsConnectingPlaid}
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
                      <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted p-1'>
                        {/* Use logo if available, otherwise default icon */}
                        {institution.logo ? (
                          <img
                            src={`data:image/png;base64,${institution.logo}`}
                            alt={`${institution.institutionName} logo`}
                            className='h-full w-full object-contain'
                          />
                        ) : (
                          <CreditCard className='h-4 w-4 text-foreground' />
                        )}
                      </div>
                      <div className='flex-1 overflow-hidden'>
                        <p className='truncate text-sm font-light'>
                          {institution.institutionName}
                          {/* Show spinner if this institution is the one being synced */}
                          {syncingInstitutionId === institution.id && (
                            <CircleNotch
                              className='ml-2 inline h-4 w-4 animate-spin text-muted-foreground'
                              aria-label='Syncing...'
                            />
                          )}
                        </p>
                        <p className='text-xs text-zinc-400'>
                          {institution.accounts.length} account(s) linked
                        </p>
                      </div>
                    </div>
                    {/* Action Buttons - Hide if syncing */}
                    {syncingInstitutionId !== institution.id && (
                      <div className='flex gap-1'>
                        {/* Manage Accounts Button */}
                        <Button
                          variant='ghost'
                          size='icon'
                          className='flex-shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground'
                          onClick={() =>
                            setManageAccountsInstitutionId(institution.id)
                          }
                          disabled={!!syncingInstitutionId}
                        >
                          <Gear />
                        </Button>
                        {/* Delete Button Trigger */}
                        <AlertDialogTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='flex-shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive'
                            onClick={() =>
                              setInstitutionToDelete(institution.id)
                            }
                            disabled={!!syncingInstitutionId} // Also disable if any sync is happening
                          >
                            <X />
                          </Button>
                        </AlertDialogTrigger>
                      </div>
                    )}
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

      {/* Account Management Dialog */}
      <Dialog
        open={!!manageAccountsInstitutionId}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setManageAccountsInstitutionId(null)
          }
        }}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Manage Accounts</DialogTitle>
            <DialogDescription>
              Choose which accounts to include in your spending calculations
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            {(institutions
              ?.find(inst => inst.id === manageAccountsInstitutionId)
              ?.accounts ?? []
            ).map(account => (
                <div
                  key={account.id}
                  className='flex items-center justify-between rounded-lg border border-border p-4'
                >
                  <div className='flex-1'>
                    <div className='flex items-center gap-2'>
                      <p className='text-sm font-medium'>{account.name}</p>
                      {account.mask && (
                        <span className='text-xs text-muted-foreground'>
                          ••{account.mask}
                        </span>
                      )}
                    </div>
                    <p className='text-xs text-muted-foreground'>
                      {account.type} • {account.subtype}
                    </p>
                  </div>
                  <Switch
                    checked={account.isTracked}
                    onCheckedChange={() =>
                      handleToggleAccount(account.id, account.isTracked)
                    }
                  />
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

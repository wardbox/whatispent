import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../client/components/ui/dialog'
import { Button } from '../../client/components/ui/button'

interface PlaidConsentDialogProps {
  isOpen: boolean
  onAccept: () => void
  onDecline: () => void
  isUpdateMode?: boolean
}

export function PlaidConsentDialog({
  isOpen,
  onAccept,
  onDecline,
  isUpdateMode = false,
}: PlaidConsentDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onDecline()}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>
            {isUpdateMode ? 'Reconnect Your Bank' : 'Connect Your Bank'}
          </DialogTitle>
          <DialogDescription>
            {isUpdateMode
              ? 'Your bank connection needs to be refreshed to continue syncing your transactions.'
              : 'Before connecting your bank account, please review what data will be collected.'}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <div className='space-y-3'>
            <h4 className='text-sm font-semibold'>Data We Collect:</h4>
            <ul className='space-y-2 text-sm text-muted-foreground'>
              <li className='flex items-start gap-2'>
                <span className='mt-0.5'>•</span>
                <span>
                  <strong>Account Information:</strong> Account names, types,
                  balances, and account numbers (masked)
                </span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='mt-0.5'>•</span>
                <span>
                  <strong>Transaction History:</strong> Transaction amounts,
                  dates, merchant names, and categories (up to 180 days)
                </span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='mt-0.5'>•</span>
                <span>
                  <strong>Institution Details:</strong> Your bank or financial
                  institution name and logo
                </span>
              </li>
            </ul>
          </div>

          <div className='space-y-3'>
            <h4 className='text-sm font-semibold'>How We Use Your Data:</h4>
            <ul className='space-y-2 text-sm text-muted-foreground'>
              <li className='flex items-start gap-2'>
                <span className='mt-0.5'>•</span>
                <span>Track and categorize your spending over time</span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='mt-0.5'>•</span>
                <span>
                  Display your account balances and transaction history
                </span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='mt-0.5'>•</span>
                <span>Generate spending insights and summaries</span>
              </li>
            </ul>
          </div>

          <div className='rounded-md border bg-muted/50 p-3'>
            <p className='text-xs text-muted-foreground'>
              <strong>Powered by Plaid:</strong> We use Plaid to securely
              connect to your bank. Your bank credentials are never stored on
              our servers. You can disconnect your bank at any time from the
              dashboard.
            </p>
          </div>

          <div className='rounded-md border bg-muted/50 p-3'>
            <p className='text-xs text-muted-foreground'>
              By connecting your bank, you consent to What I Spent collecting
              and processing this data as described in our{' '}
              <a
                href='/privacy'
                target='_blank'
                rel='noopener noreferrer'
                className='underline hover:text-foreground'
              >
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>

        <DialogFooter className='flex-col gap-2 sm:flex-row'>
          <Button
            type='button'
            variant='outline'
            onClick={onDecline}
            className='w-full sm:w-auto'
          >
            Cancel
          </Button>
          <Button type='button' onClick={onAccept} className='w-full sm:w-auto'>
            {isUpdateMode ? 'Continue to Reconnect' : 'Continue to Connect'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

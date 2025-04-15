import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../client/components/ui/dialog'
import { Button } from '../../client/components/ui/button'
import type { TransactionWithDetails } from '../../plaid/operations'
import { getPrettyCategoryName, getCategoryIcon } from '../../utils/categories'
import dayjs from 'dayjs'

interface TransactionDetailDialogProps {
  transaction: TransactionWithDetails | null
  isOpen: boolean
  onClose: () => void
}

export function TransactionDetailDialog({ transaction, isOpen, onClose }: TransactionDetailDialogProps) {
  if (!transaction) return null

  const prettyCategory = getPrettyCategoryName(transaction.category?.[0] ?? 'Uncategorized')
  const TransactionIcon = getCategoryIcon(transaction.category?.[0])
  const formattedDate = dayjs(transaction.date).format('MMMM D, YYYY')
  const formattedTime = dayjs(transaction.date).format('h:mm A')
  const amountColor = transaction.amount < 0 ? 'text-green-500' : 'text-foreground' // Plaid expenses are positive
  const amountSign = transaction.amount < 0 ? '+' : '-'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <TransactionIcon className='h-5 w-5' />
            {transaction.merchantName ?? transaction.name}
          </DialogTitle>
          <DialogDescription>
            Transaction details for {transaction.merchantName ?? transaction.name}.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-muted-foreground'>Amount</span>
            <span className={`text-sm font-medium ${amountColor}`}>{`${amountSign}$ ${Math.abs(transaction.amount).toFixed(2)}`}</span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-muted-foreground'>Date</span>
            <span className='text-sm'>{formattedDate}</span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-muted-foreground'>Time</span>
            <span className='text-sm'>{formattedTime}</span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-muted-foreground'>Category</span>
            <span className='flex items-center gap-1 text-sm'>
              <TransactionIcon className='h-4 w-4' />
              {prettyCategory}
            </span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-muted-foreground'>Account</span>
            <span className='text-sm'>{transaction.account.name}</span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-muted-foreground'>Institution</span>
            <span className='text-sm'>{transaction.account.institution.institutionName}</span>
          </div>
          {transaction.name !== (transaction.merchantName ?? transaction.name) && (
            <div className='flex flex-col items-start pt-2'>
              <span className='text-sm text-muted-foreground'>Original Description</span>
              <span className='mt-1 text-xs'>{transaction.name}</span>
            </div>
           )}
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 

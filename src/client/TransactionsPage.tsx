import { useQuery } from 'wasp/client/operations'
import { getAllTransactions } from 'wasp/client/operations'
import { type TransactionWithDetails } from '../plaid/operations' // Corrected path
import { useAuth } from 'wasp/client/auth'
import dayjs from 'dayjs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './components/ui/table'
import { Badge } from './components/ui/badge'

export function TransactionsPage() {
  const { data: user } = useAuth()
  const {
    data: transactions,
    isLoading,
    error,
  } = useQuery(
    getAllTransactions,
    undefined, // No arguments for now, add pagination later if needed
    { enabled: !!user }, // Only run query if user is logged in
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD', // Adjust currency as needed
    }).format(amount)
  }

  if (!user) {
    return <p>Please log in to view transactions.</p>
  }

  if (isLoading) {
    return <p>Loading transactions...</p>
  }

  if (error) {
    return (
      <p className='text-red-500'>
        Error loading transactions: {error.message}
      </p>
    )
  }

  if (!transactions || transactions.length === 0) {
    return <p>No transactions found.</p>
  }

  return (
    <div className='container mx-auto py-8'>
      <h1 className='mb-6 text-3xl font-bold'>All Transactions</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-[100px]'>Date</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Institution</TableHead>
            <TableHead className='text-right'>Amount</TableHead>
            <TableHead className='w-[80px] text-center'>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx: TransactionWithDetails) => (
            <TableRow key={tx.id}>
              <TableCell>{dayjs(tx.date).format('YYYY-MM-DD')}</TableCell>
              <TableCell>{tx.name}</TableCell>
              <TableCell>
                {tx.categoryIconUrl && (
                  <img
                    src={tx.categoryIconUrl}
                    alt=''
                    className='mr-1 inline-block h-4 w-4'
                  />
                )}
                {tx.category[0] || 'Uncategorized'}
              </TableCell>
              <TableCell>{tx.account.name}</TableCell>
              <TableCell>{tx.account.institution.institutionName}</TableCell>
              <TableCell className='text-right font-medium'>
                {formatCurrency(tx.amount)}
              </TableCell>
              <TableCell className='text-center'>
                {tx.pending ? (
                  <Badge variant='outline'>Pending</Badge>
                ) : (
                  <Badge variant='secondary'>Posted</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Add pagination controls here later */}
    </div>
  )
}

import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react'
import {
  getSpendingSummary,
  useQuery,
  getAllTransactions,
} from 'wasp/client/operations'
import { useAuth } from 'wasp/client/auth'
import CountUp from 'react-countup'
import dayjs from 'dayjs'
import { useMemo } from 'react'

// Helper function (can be moved to utils if used elsewhere)
const calculatePercentageChange = (
  current: number,
  previous: number,
): number => {
  if (previous === 0) {
    return current > 0 ? 100 : 0
  }
  const change = ((current - previous) / previous) * 100
  return Math.round(change * 10) / 10
}

export function SpendingMetrics() {
  const { data: user } = useAuth()
  const {
    data: spendingSummary,
    isLoading: isLoadingSummary,
    error: summaryError,
  } = useQuery(getSpendingSummary, undefined, { enabled: !!user })

  // Fetch all transactions for local calculation
  const {
    data: allTransactions,
    isLoading: isLoadingTransactions,
    error: transactionsError,
  } = useQuery(getAllTransactions, undefined, { enabled: !!user }) // Assuming getAllTransactions takes no args for all

  const { localTodayTotal, localYesterdayTotal } = useMemo(() => {
    if (!allTransactions) {
      return { localTodayTotal: 0, localYesterdayTotal: 0 }
    }

    const localTodayDateString = dayjs().format('YYYY-MM-DD') // User's current local date, e.g., "2025-04-15"
    const localYesterdayDateString = dayjs()
      .subtract(1, 'day')
      .format('YYYY-MM-DD') // User's local yesterday, e.g., "2025-04-14"

    let todayTotal = 0
    let yesterdayTotal = 0

    allTransactions
      .filter(tx => tx.amount > 0 && !tx.pending) // Only non-pending expenses
      .forEach(tx => {
        // Get the date part of the transaction timestamp in UTC
        const txUtcDateString = dayjs.utc(tx.date).format('YYYY-MM-DD') // e.g., "2025-04-15"
        const amount = tx.amount

        // Compare the transaction's UTC date string with the user's local date string
        if (txUtcDateString === localTodayDateString) {
          todayTotal += amount
        } else if (txUtcDateString === localYesterdayDateString) {
          // Check against user's local yesterday for the comparison calculation
          yesterdayTotal += amount
        }
      })

    return { localTodayTotal: todayTotal, localYesterdayTotal: yesterdayTotal }
  }, [allTransactions])

  if (isLoadingSummary || isLoadingTransactions) {
    return (
      <AnimatePresence>
        <motion.div className='grid gap-8 md:grid-cols-3'>
          {[...Array(3)].map((_, index) => (
            <motion.div
              key={index}
              className='h-20 animate-pulse rounded-lg bg-muted'
            ></motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    )
  }

  if (summaryError || transactionsError) {
    return (
      <div className='text-red-500'>
        Error loading spending data:{' '}
        {summaryError?.message || transactionsError?.message}
      </div>
    )
  }

  if (!spendingSummary) {
    return (
      <div className='text-center text-gray-500'>
        No spending data available yet.
      </div>
    )
  }

  const metrics = [
    {
      title: 'Today',
      amount: localTodayTotal,
      change: calculatePercentageChange(localTodayTotal, localYesterdayTotal),
    },
    {
      title: 'This Week',
      amount: spendingSummary.thisWeek.amount,
      change: spendingSummary.thisWeek.change,
    },
    {
      title: 'This Month',
      amount: spendingSummary.thisMonth.amount,
      change: spendingSummary.thisMonth.change,
    },
  ]

  return (
    <div className='grid gap-8 py-4 md:grid-cols-3'>
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.title}
          className='space-y-2'
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 * index, duration: 0.5 }}
        >
          <div className='text-xs font-light text-muted-foreground'>
            {metric.title}
          </div>
          <div className='flex items-baseline gap-2'>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 * index, duration: 0.7 }}
            >
              <span className='text-5xl font-extralight tracking-tighter text-foreground'>
                $
                <CountUp
                  end={metric.amount}
                  duration={1}
                  decimals={0}
                  decimal='.'
                  separator=','
                  preserveValue={true}
                />
              </span>
            </motion.div>
            <div
              className={`flex items-center text-xs ${metric.change < 0 ? 'text-green-500' : metric.change > 0 ? 'text-red-500' : 'text-muted-foreground'}`}
            >
              {metric.change !== 0 && (
                <>
                  {metric.change < 0 ? (
                    <ArrowDownIcon className='mr-0.5 h-2.5 w-2.5' />
                  ) : (
                    <ArrowUpIcon className='mr-0.5 h-2.5 w-2.5' />
                  )}
                  <CountUp
                    end={Math.abs(metric.change)}
                    duration={1}
                    decimals={metric.change % 1 !== 0 ? 1 : 0}
                    decimal='.'
                    separator=','
                  />
                  %
                </>
              )}
              {metric.change === 0 && <span>No change</span>}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

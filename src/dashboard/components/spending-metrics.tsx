import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react'
import { getSpendingSummary, useQuery } from 'wasp/client/operations'
import { useAuth } from 'wasp/client/auth'
import CountUp from 'react-countup'

export function SpendingMetrics() {
  const { data: user } = useAuth()
  const {
    data: spendingSummary,
    isLoading: isLoadingSummary,
    error: summaryError,
  } = useQuery(getSpendingSummary, undefined, { enabled: !!user })

  if (isLoadingSummary) {
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

  if (summaryError) {
    return (
      <div className='text-red-500'>
        Error loading spending summary: {summaryError.message}
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
      amount: spendingSummary.today.amount,
      change: spendingSummary.today.change,
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
    <div className='grid gap-8 md:grid-cols-3'>
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
              className={`flex items-center text-xs ${metric.change < 0 ? 'text-green-500' : 'text-red-500'}`}
            >
              {metric.change < 0 ? (
                <ArrowDownIcon className='mr-0.5 h-2.5 w-2.5' />
              ) : (
                <ArrowUpIcon className='mr-0.5 h-2.5 w-2.5' />
              )}
              <CountUp
                end={Math.abs(metric.change)}
                duration={1}
                decimals={0}
                decimal='.'
                separator=','
              />
              %
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

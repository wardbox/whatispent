import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import relativeTime from 'dayjs/plugin/relativeTime'
import updateLocale from 'dayjs/plugin/updateLocale'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import {
  getPrettyCategoryName,
  getCategoryIcon,
  getCategoryCssVariable,
} from '../../utils/categories'
import type { TransactionWithDetails } from '../../plaid/operations'

dayjs.extend(isBetween)
dayjs.extend(relativeTime)
dayjs.extend(updateLocale)
dayjs.extend(weekOfYear)

dayjs.updateLocale('en', {
  relativeTime: {
    future: 'in %s',
    past: '%s ago',
    s: 'a few seconds',
    m: 'a minute',
    mm: '%d minutes',
    h: 'an hour',
    hh: '%d hours',
    d: 'a day',
    dd: '%d days',
    w: 'a week',
    ww: '%d weeks',
    M: 'a month',
    MM: '%d months',
    y: 'a year',
    yy: '%d years',
  },
})

interface TransactionGroup {
  id: string
  title: string
  date: string
  transactions: TransactionWithDetails[]
}

type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'

interface TransactionsListProps {
  transactions: TransactionWithDetails[] | undefined | null
  isLoading: boolean
  error: Error | null
  searchQuery: string
  selectedCategories: Set<string>
  sortCriteria: SortOption
  _transactionTypeDummy?: TransactionWithDetails
}

export function TransactionsList({
  transactions,
  isLoading: isLoadingTransactions,
  error: transactionsError,
  searchQuery,
  selectedCategories,
  sortCriteria,
}: TransactionsListProps) {
  const [expandedGroup, setExpandedGroup] = useState(new Set<string>())

  const transactionGroups: TransactionGroup[] | undefined = useMemo(() => {
    if (!transactions) return []

    const queryLower = searchQuery.toLowerCase()
    const searchedTransactions = transactions.filter(
      (tx: TransactionWithDetails) => {
        const prettyCategory = getPrettyCategoryName(
          tx.category?.[0] ?? 'Uncategorized',
        ).toLowerCase()
        return (
          (tx.merchantName?.toLowerCase() || tx.name.toLowerCase()).includes(
            queryLower,
          ) ||
          prettyCategory.includes(queryLower) ||
          tx.name.toLowerCase().includes(queryLower)
        )
      },
    )

    const filteredTransactions =
      selectedCategories.size === 0
        ? searchedTransactions
        : searchedTransactions.filter((tx: TransactionWithDetails) => {
            const prettyCategory = getPrettyCategoryName(
              tx.category?.[0] ?? 'Uncategorized',
            )
            return selectedCategories.has(prettyCategory)
          })

    const groups: { [key: string]: TransactionWithDetails[] } = {}
    const now = dayjs()
    const today = now.startOf('day')
    const yesterday = today.subtract(1, 'day')
    const startOfWeek = now.startOf('week')
    const startOfLastWeek = startOfWeek.subtract(1, 'week')

    filteredTransactions.forEach((tx: TransactionWithDetails) => {
      const txDate = dayjs(tx.date)
      let groupKey: string
      if (txDate.isSame(today, 'day')) {
        groupKey = 'today'
      } else if (txDate.isSame(yesterday, 'day')) {
        groupKey = 'yesterday'
      } else if (txDate.isBetween(startOfWeek, today, 'day', '[)')) {
        groupKey = 'thisWeek'
      } else if (txDate.isBetween(startOfLastWeek, startOfWeek, 'day', '[)')) {
        groupKey = 'lastWeek'
      } else {
        groupKey = txDate.format('MMMM YYYY')
      }

      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(tx)
    })

    const sortedGroups: TransactionGroup[] = Object.entries(groups)
      .map(([key, txs]: [string, TransactionWithDetails[]]) => {
        const firstTxDate = dayjs(txs[0].date)
        let title = key
        let dateRange = ''
        if (key === 'today') {
          title = 'Today'
          dateRange = firstTxDate.format('MMM D, YYYY')
        } else if (key === 'yesterday') {
          title = 'Yesterday'
          dateRange = firstTxDate.format('MMM D, YYYY')
        } else if (key === 'thisWeek') {
          title = 'This Week'
          const endOfWeek = startOfWeek.add(6, 'day')
          dateRange = `${startOfWeek.format('MMM D')} - ${endOfWeek.format('MMM D, YYYY')}`
        } else if (key === 'lastWeek') {
          title = 'Last Week'
          const endOfLastWeek = startOfLastWeek.add(6, 'day')
          dateRange = `${startOfLastWeek.format('MMM D')} - ${endOfLastWeek.format('MMM D, YYYY')}`
        } else {
          title = key
          dateRange = firstTxDate.format('MMMM YYYY')
        }

        const sortedTransactions = [...txs].sort(
          (a: TransactionWithDetails, b: TransactionWithDetails) => {
            switch (sortCriteria) {
              case 'date-asc':
                return dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
              case 'amount-desc':
                return Math.abs(b.amount) - Math.abs(a.amount)
              case 'amount-asc':
                return Math.abs(a.amount) - Math.abs(b.amount)
              case 'date-desc':
              default:
                return dayjs(b.date).valueOf() - dayjs(a.date).valueOf()
            }
          },
        )

        return {
          id: key,
          title: title,
          date: dateRange,
          transactions: sortedTransactions,
        }
      })
      .sort((a, b) => {
        const order = ['today', 'yesterday', 'thisWeek', 'lastWeek']
        const aIndex = order.indexOf(a.id)
        const bIndex = order.indexOf(b.id)
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
        if (aIndex !== -1) return -1
        if (bIndex !== -1) return 1
        return (
          dayjs(b.transactions[0].date).valueOf() -
          dayjs(a.transactions[0].date).valueOf()
        )
      })

    return sortedGroups
  }, [transactions, searchQuery, selectedCategories, sortCriteria])

  useEffect(() => {
    if (searchQuery || selectedCategories.size > 0) {
      if (transactionGroups && transactionGroups.length > 0) {
        setExpandedGroup(new Set(transactionGroups.map(g => g.id)))
      } else {
        setExpandedGroup(new Set())
      }
    }
  }, [transactionGroups, searchQuery, selectedCategories])

  const toggleGroup = (groupId: string) => {
    setExpandedGroup(prevExpanded => {
      const newExpanded = new Set(prevExpanded)
      if (newExpanded.has(groupId)) {
        newExpanded.delete(groupId)
      } else {
        newExpanded.add(groupId)
      }
      return newExpanded
    })
  }

  if (isLoadingTransactions) {
    return (
      <div className='pt-4 text-center text-muted-foreground'>
        Loading transactions...
      </div>
    )
  }

  if (transactionsError) {
    return (
      <div className='pt-4 text-center text-destructive'>
        Error loading transactions: {transactionsError.message}
      </div>
    )
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className='pt-4 text-center text-muted-foreground'>
        No transactions found. Connect a bank account to get started!
      </div>
    )
  }

  if (!transactionGroups || transactionGroups.length === 0) {
    return (
      <div className='pt-4 text-center text-muted-foreground'>
        No transactions match your criteria.
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {transactionGroups.map(group => (
        <div key={group.id} className='space-y-2'>
          <div
            className='flex cursor-pointer items-center justify-between'
            onClick={() => toggleGroup(group.id)}
          >
            <div>
              <h3 className='text-sm font-medium'>{group.title}</h3>
              <p className='text-xs text-muted-foreground'>{group.date}</p>
            </div>
            <div className='text-sm font-light'>
              {expandedGroup.has(group.id) ? 'Hide' : 'Show'} (
              {group.transactions.length})
            </div>
          </div>

          {expandedGroup.has(group.id) && (
            <motion.div
              className='space-y-2 overflow-hidden rounded-xl border border-border bg-background p-1'
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              {group.transactions.map((transaction, index) => {
                const TransactionIcon = getCategoryIcon(
                  transaction.category?.[0],
                )
                const prettyCategory = getPrettyCategoryName(
                  transaction.category?.[0] ?? 'Uncategorized',
                )
                const categoryColorVar = getCategoryCssVariable(prettyCategory)
                const transactionTime = dayjs(transaction.date).format('h:mm A')
                const transactionDay = dayjs(transaction.date).format('MMM D')
                const displayTime =
                  group.id === 'today' || group.id === 'yesterday'
                    ? transactionTime
                    : transactionDay

                return (
                  <motion.div
                    key={transaction.id}
                    className='flex items-center justify-between rounded-md p-2 hover:bg-muted'
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index, duration: 0.3 }}
                  >
                    <div className='flex items-center gap-3'>
                      <div
                        className='flex h-10 w-10 items-center justify-center rounded-full'
                        style={{ backgroundColor: `var(${categoryColorVar})` }}
                      >
                        <TransactionIcon className='h-5 w-5 text-background' />
                      </div>
                      <div>
                        <p className='text-sm font-light'>
                          {transaction.merchantName ?? transaction.name}
                        </p>
                        <div className='flex items-center gap-2'>
                          <p className='text-xs text-muted-foreground'>
                            {prettyCategory}
                          </p>
                          <div className='h-1 w-1 rounded-full bg-muted-foreground'></div>
                          <p className='text-xs text-muted-foreground'>
                            {displayTime}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className='text-right'>
                      <p
                        className={`text-sm font-light ${transaction.amount > 0 ? '' : 'text-green-500'}`}
                      >
                        {transaction.amount > 0 ? '-' : '+'}${' '}
                        {/* Plaid expenses are positive */}
                        {Math.abs(transaction.amount).toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {transaction.account.name}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </div>
      ))}
    </div>
  )
}

import { useState, useMemo, useEffect } from 'react'
import dayjs from 'dayjs'
import { motion, AnimatePresence } from 'motion/react'
import {
  getPrettyCategoryName,
  getCategoryIcon,
  getCategoryCssVariable,
} from '../../utils/categories'
import type { TransactionWithDetails } from '../../plaid/operations'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from '../../client/components/ui/pagination'
import { cn } from '../../lib/utils'
import {
  formatTransactionDisplayDate,
  getTransactionGroupKeyUTC,
  getTransactionGroupDisplayInfo,
  parseDateUTC,
} from '../../utils/dateUtils'

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
  onTransactionClick: (transaction: TransactionWithDetails) => void
  _transactionTypeDummy?: TransactionWithDetails
}

const ITEMS_PER_PAGE = 20

export function TransactionsList({
  transactions,
  isLoading: isLoadingTransactions,
  error: transactionsError,
  searchQuery,
  selectedCategories,
  sortCriteria,
  onTransactionClick,
}: TransactionsListProps) {
  const [expandedGroup, setExpandedGroup] = useState(new Set<string>())
  const [currentPage, setCurrentPage] = useState(1)

  const processedTransactions = useMemo(() => {
    if (!transactions) return { filteredTransactions: [], totalCount: 0 }

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

    const sortedTransactions = [...filteredTransactions].sort(
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
      filteredTransactions: sortedTransactions,
      totalCount: sortedTransactions.length,
    }
  }, [transactions, searchQuery, selectedCategories, sortCriteria])

  const { filteredTransactions, totalCount } = processedTransactions
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  const transactionGroups: TransactionGroup[] | undefined = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    const paginatedTransactions = filteredTransactions.slice(
      startIndex,
      endIndex,
    )

    if (paginatedTransactions.length === 0) return []

    const groups: { [key: string]: TransactionWithDetails[] } = {}

    paginatedTransactions.forEach((tx: TransactionWithDetails) => {
      const groupKey = getTransactionGroupKeyUTC(tx.date)

      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(tx)
    })

    const sortedGroups: TransactionGroup[] = Object.entries(groups)
      .map(([key, txs]: [string, TransactionWithDetails[]]) => {
        const { title, date: dateRange } = getTransactionGroupDisplayInfo(key)

        return {
          id: key,
          title: title,
          date: dateRange,
          transactions: txs,
        }
      })
      .sort((a, b) => {
        const dateA = parseDateUTC(a.transactions[0].date).valueOf()
        const dateB = parseDateUTC(b.transactions[0].date).valueOf()
        return dateB - dateA
      })

    return sortedGroups
  }, [filteredTransactions, currentPage])

  // Reset pagination when filters or sorting change
  useEffect(() => {
    setCurrentPage(1)
    // Expansion state is handled by the effect below
  }, [searchQuery, selectedCategories, sortCriteria])

  // Set expanded groups based on filters and available groups
  useEffect(() => {
    if (transactionGroups && transactionGroups.length > 0) {
      if (searchQuery || selectedCategories.size > 0) {
        // Filters active: Expand all groups
        setExpandedGroup(new Set(transactionGroups.map(g => g.id)))
      } else {
        // No filters: Expand only the first (most recent) group
        setExpandedGroup(new Set([transactionGroups[0].id]))
      }
    } else {
      // No groups: Ensure expanded set is empty
      setExpandedGroup(new Set())
    }
  }, [transactionGroups, searchQuery, selectedCategories]) // Depends on calculated groups and filters

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

  if (totalCount === 0) {
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

          <AnimatePresence initial={false}>
            {expandedGroup.has(group.id) && (
              <motion.div
                className='overflow-hidden rounded-xl border border-border bg-background'
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{
                  duration: 0.15,
                  ease: [0.32, 0.72, 0, 1],
                }}
                style={{
                  willChange: 'height, opacity',
                  transform: 'translateZ(0)'
                }}
              >
                <div className='space-y-2 p-1'>
              {group.transactions.map((transaction, index) => {
                const TransactionIcon = getCategoryIcon(
                  transaction.category?.[0],
                )
                const prettyCategory = getPrettyCategoryName(
                  transaction.category?.[0] ?? 'Uncategorized',
                )
                const categoryColorVar = getCategoryCssVariable(prettyCategory)

                const displayTime = formatTransactionDisplayDate(
                  transaction.date,
                )

                return (
                  <div
                    key={transaction.id}
                    className='flex cursor-pointer items-center justify-between gap-2 rounded-md p-2 hover:bg-muted'
                    onClick={() => onTransactionClick(transaction)}
                  >
                    <div className='flex flex-1 items-center gap-3 overflow-hidden'>
                      <div
                        className='flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full'
                        style={{ backgroundColor: `var(${categoryColorVar})` }}
                      >
                        <TransactionIcon className='h-5 w-5 text-background' />
                      </div>
                      <div className='flex-1 overflow-hidden'>
                        <p className='truncate text-sm font-light'>
                          {transaction.merchantName ?? transaction.name}
                        </p>
                        <div className='flex items-center gap-1.5'>
                          <p className='truncate text-xs text-muted-foreground'>
                            {prettyCategory}
                          </p>
                          <div className='h-1 w-1 flex-shrink-0 rounded-full bg-muted-foreground'></div>
                          <p className='flex-shrink-0 text-xs text-muted-foreground'>
                            {displayTime}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className='flex flex-col items-end'>
                      {(() => {
                        // Plaid convention: positive = expense (OUT), negative = income (IN)
                        const isExpense = transaction.amount > 0
                        const sign = isExpense ? '-' : '+'
                        const amountClass = isExpense
                          ? 'text-red-500'
                          : 'text-green-500'

                        return (
                          <p
                            className={cn(
                              'whitespace-nowrap text-sm font-light',
                              amountClass,
                            )}
                          >
                            {sign}$
                            {Math.abs(transaction.amount).toLocaleString(
                              undefined,
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )}
                          </p>
                        )
                      })()}

                      <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                        <span className='hidden sm:inline'>
                          {transaction.account.institution.institutionName}
                        </span>
                        <span className='hidden sm:inline'>•</span>
                        <span>{transaction.account.name}</span>
                        {transaction.account.institution.logo && (
                          <img
                            src={`data:image/png;base64,${transaction.account.institution.logo}`}
                            alt=''
                            className='ml-1 h-3 w-3 rounded-full object-contain'
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
      {totalPages > 1 && (
        <Pagination className='mt-4 pt-4'>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href='#' // href is required but we use onClick
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.preventDefault()
                  setCurrentPage(prev => Math.max(prev - 1, 1))
                }}
                className={cn({
                  'cursor-not-allowed text-muted-foreground opacity-50':
                    currentPage === 1,
                })}
              />
            </PaginationItem>
            <PaginationItem>
              <span className='px-4 text-sm text-muted-foreground'>
                Page {currentPage} of {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href='#' // href is required but we use onClick
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.preventDefault()
                  setCurrentPage(prev => Math.min(prev + 1, totalPages))
                }}
                className={cn({
                  'cursor-not-allowed text-muted-foreground opacity-50':
                    currentPage === totalPages,
                })}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}

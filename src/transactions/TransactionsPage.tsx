import React, { useState, useMemo } from 'react'
import { Link } from 'wasp/client/router'
import {
  ArrowLeft,
  MagnifyingGlass,
  SlidersHorizontal,
  SortAscending,
} from '@phosphor-icons/react'
import { Button } from '../client/components/ui/button'
import { Input } from '../client/components/ui/input'
import { TransactionsList } from './components/transactions-list'
import { useQuery, getAllTransactions } from 'wasp/client/operations'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '../client/components/ui/dropdown-menu'
import { getPrettyCategoryName } from '../utils/categories' // Import category utility

export type AllTransactions = {
  transactions: Awaited<ReturnType<typeof getAllTransactions>>
}

// Type for sort criteria and labels
type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'
const sortLabels: Record<SortOption, string> = {
  'date-desc': 'Date: Newest',
  'date-asc': 'Date: Oldest',
  'amount-desc': 'Amount: High-Low',
  'amount-asc': 'Amount: Low-High',
}

export default function TransactionsPage() {
  const {
    data: transactions,
    isLoading: isLoadingTransactions,
    error: transactionsError,
  } = useQuery(getAllTransactions)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState(
    new Set<string>(),
  )
  const [sortCriteria, setSortCriteria] = useState<SortOption>('date-desc') // Use SortOption type

  const handleCategoryToggle = (category: string) => {
    const newSelected = new Set(selectedCategories)
    if (newSelected.has(category)) {
      newSelected.delete(category)
    } else {
      newSelected.add(category)
    }
    setSelectedCategories(newSelected)
  }

  // Calculate available categories for filtering
  const availableCategories = useMemo(() => {
    if (!transactions) return []
    const categories = new Set<string>()
    transactions.forEach(tx => {
      const prettyCategory = getPrettyCategoryName(
        tx.category?.[0] ?? 'Uncategorized',
      )
      categories.add(prettyCategory)
    })
    return Array.from(categories).sort()
  }, [transactions])

  return (
    <div className='flex min-h-screen w-full flex-col bg-background'>
      <header className='sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/90 px-6 backdrop-blur-md'>
        <div className='flex items-center gap-2'>
          <Link to='/dashboard'>
            <Button variant='ghost' size='icon' className='rounded-full'>
              <ArrowLeft className='h-5 w-5' />
              <span className='sr-only'>Back</span>
            </Button>
          </Link>
          <span className='text-lg font-light tracking-tight text-foreground'>
            Transactions
          </span>
        </div>
      </header>

      <main className='mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6'>
        <div className='flex flex-col gap-6'>
          <div className='flex items-center justify-between'>
            <div className='text-2xl font-extralight'>All Transactions</div>
            <div className='flex items-center gap-2'>
              {/* Filter Dropdown */}
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-9 gap-1 rounded-full text-xs'
                  >
                    <SlidersHorizontal className='h-3.5 w-3.5' />
                    Filter{' '}
                    {selectedCategories.size > 0 &&
                      `(${selectedCategories.size})`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='w-56' align='end'>
                  <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {availableCategories.map(category => (
                    <DropdownMenuCheckboxItem
                      key={category}
                      checked={selectedCategories.has(category)}
                      onCheckedChange={() => handleCategoryToggle(category)}
                    >
                      {category}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {availableCategories.length === 0 && (
                    <DropdownMenuLabel className='text-xs font-normal text-muted-foreground'>
                      No categories found
                    </DropdownMenuLabel>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Sort Dropdown Menu */}
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-9 w-[150px] gap-1 rounded-full text-xs'
                  >
                    <SortAscending className='h-3.5 w-3.5' />
                    {sortLabels[sortCriteria]}{' '}
                    {/* Display current sort label */}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuRadioGroup
                    value={sortCriteria}
                    onValueChange={value =>
                      setSortCriteria(value as SortOption)
                    }
                  >
                    {Object.entries(sortLabels).map(([value, label]) => (
                      <DropdownMenuRadioItem key={value} value={value}>
                        {label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className='relative'>
            <MagnifyingGlass className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40' />
            <Input
              placeholder='Search transactions, merchants, or categories'
              className='h-10 rounded-full border-border bg-background/90 pl-10 text-sm'
              value={searchQuery} // Connect value
              onChange={e => setSearchQuery(e.target.value)} // Connect onChange
            />
          </div>
          <TransactionsList
            transactions={transactions}
            isLoading={isLoadingTransactions}
            error={transactionsError}
            searchQuery={searchQuery}
            selectedCategories={selectedCategories}
            sortCriteria={sortCriteria}
          />
        </div>
      </main>
    </div>
  )
}

import { SpendingMetrics } from './components/spending-metrics'
import { Card, CardContent } from '../client/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '../client/components/ui/tabs'
import { ArrowRight } from 'lucide-react'
import { Button } from '../client/components/ui/button'
import { MonthlyComparisonChart } from './components/monthly-comparison-chart'
import { CategorySummary } from './components/category-summary'
import { useState } from 'react'
import { PlaidIntegration } from './components/plaid-integration'
import { Link } from 'wasp/client/router'
import {
  useQuery,
  getCategorySpending,
  getInstitutions,
} from 'wasp/client/operations'
// Define the possible time range values explicitly
type TimeRange = '1m' | '3m' | '6m' | '1y'

export type CategorySummaryProps = {
  categories: Awaited<ReturnType<typeof getCategorySpending>>
  isLoading: boolean
  error: any
}

export type InstitutionsSummaryProps = {
  institutions: Awaited<ReturnType<typeof getInstitutions>>
  isLoading: boolean
  error: any
  refetch: () => void
  refetchOnInstitutionAdd: () => void
  syncingInstitutionId: string | null
  setSyncingInstitutionId: React.Dispatch<React.SetStateAction<string | null>>
  isConnectingPlaid: boolean
  setIsConnectingPlaid: React.Dispatch<React.SetStateAction<boolean>>
}

export default function Dashboard() {
  const {
    data: categories,
    isLoading,
    error,
    refetch: refetchCategorySummary,
  } = useQuery(getCategorySpending)
  const {
    data: institutions,
    isLoading: isLoadingInstitutions,
    error: institutionsError,
    refetch: refetchInstitutions,
  } = useQuery(getInstitutions)
  const [timeRange, setTimeRange] = useState<TimeRange>('6m')
  const [syncingInstitutionId, setSyncingInstitutionId] = useState<
    string | null
  >(null)
  const [isConnectingPlaid, setIsConnectingPlaid] = useState<boolean>(false)

  return (
    <div className='flex flex-col gap-12 p-4'>
      <SpendingMetrics />
      <Card className='overflow-hidden border-none bg-muted/70'>
        <CardContent className='p-0'>
          <div className='flex items-center justify-between p-6 pb-0'>
            <span className='text-sm font-light'>Monthly Comparison</span>
            <Tabs
              defaultValue='6m'
              value={timeRange}
              onValueChange={value => setTimeRange(value as TimeRange)}
            >
              <TabsList className='h-7 bg-transparent'>
                <TabsTrigger value='1m' className='text-xs'>
                  1M
                </TabsTrigger>
                <TabsTrigger value='3m' className='text-xs'>
                  3M
                </TabsTrigger>
                <TabsTrigger value='6m' className='text-xs'>
                  6M
                </TabsTrigger>
                <TabsTrigger value='1y' className='text-xs'>
                  1Y
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <MonthlyComparisonChart timeRange={timeRange} />
        </CardContent>
      </Card>

      <div className='grid gap-6 md:grid-cols-3'>
        <div className='md:col-span-2'>
          <div className='mb-2 flex items-center justify-between'>
            <span className='font-semibold'>Categories</span>
            <Link to='/transactions'>
              <Button variant='ghost' size='sm' className='h-7 gap-1 text-xs'>
                All transactions
                <ArrowRight className='h-3 w-3' />
              </Button>
            </Link>
          </div>
          <CategorySummary
            categories={categories || []}
            isLoading={isLoading || !!syncingInstitutionId || isConnectingPlaid}
            error={error}
          />
        </div>

        <div>
          <div className='mb-2'>
            <span className='font-semibold'>Connect Bank</span>
          </div>
          <PlaidIntegration
            institutions={institutions || []}
            isLoading={isLoadingInstitutions}
            error={institutionsError}
            refetch={refetchInstitutions}
            refetchOnInstitutionAdd={refetchCategorySummary}
            syncingInstitutionId={syncingInstitutionId}
            setSyncingInstitutionId={setSyncingInstitutionId}
            isConnectingPlaid={isConnectingPlaid}
            setIsConnectingPlaid={setIsConnectingPlaid}
          />
        </div>
      </div>
    </div>
  )
}

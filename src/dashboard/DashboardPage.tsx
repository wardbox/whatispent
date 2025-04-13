import { SpendingMetrics } from './components/spending-metrics'
import { Card, CardContent } from '../client/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '../client/components/ui/tabs'
import { ArrowRight } from 'lucide-react'
import { Button } from '../client/components/ui/button'
import { MonthlyComparisonChart } from './components/monthly-comparison-chart'
import { CategorySummary } from './components/category-summary'
import { useState } from 'react'

// Define the possible time range values explicitly
type TimeRange = '1m' | '3m' | '6m' | '1y'

export default function Dashboard() {
  // Use the explicit type for the state
  const [timeRange, setTimeRange] = useState<TimeRange>('6m')

  return (
    <>
      <SpendingMetrics />
      <div className='space-y-8'>
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
              <span className='text-sm font-light'>Categories</span>
              <Button variant='ghost' size='sm' className='h-7 gap-1 text-xs'>
                All transactions
                <ArrowRight className='h-3 w-3' />
              </Button>
            </div>
            <CategorySummary />
          </div>

          <div>
            <div className='mb-2'>
              <span className='text-sm font-light'>Connect Bank</span>
            </div>
            {/* <PlaidIntegration /> */}
          </div>
        </div>
      </div>
    </>
  )
}

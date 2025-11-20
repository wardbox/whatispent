import { Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartConfig,
  ChartTooltipContent,
} from '../../client/components/ui/chart'
import { useQuery, getMonthlySpending } from 'wasp/client/operations'
import dayjs from 'dayjs'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '../../client/components/ui/alert'
import { Loader2 } from 'lucide-react'

// Define props interface
interface MonthlyComparisonChartProps {
  timeRange: string // e.g., '1m', '3m', '6m', '1y'
}

export function MonthlyComparisonChart({
  timeRange,
}: MonthlyComparisonChartProps) {
  // Map timeRange string to number of months
  const timeRangeMap: { [key: string]: number } = {
    '1m': 1,
    '3m': 3,
    '6m': 6,
    '1y': 12,
  }
  const monthsToFetch = timeRangeMap[timeRange] || 6 // Default to 6 if invalid
  const isDaily = timeRange === '1m'

  // Fetch data using the query with the dynamic number of months and granularity
  const {
    data: spendingData,
    isLoading,
    error,
  } = useQuery(getMonthlySpending, {
    months: monthsToFetch,
    granularity: isDaily ? 'daily' : 'monthly', // Pass granularity
  })

  // Format data for the chart, adjusting label based on granularity
  const chartData =
    spendingData?.map(item => {
      const dateFormat = isDaily ? 'MMM D' : 'MMM'
      const inputFormat = isDaily ? 'YYYY-MM-DD' : 'YYYY-MM'
      return {
        periodLabel: dayjs(item.period, inputFormat).format(dateFormat),
        amount: item.total,
        // Keep original period for potential use, though periodLabel is used for display
        originalPeriod: item.period,
      }
    }) ?? []

  const chartConfig = {
    amount: {
      label: 'spent',
      color: 'hsl(var(--chart-2))',
    },
  } satisfies ChartConfig

  if (isLoading) {
    return (
      <div className='flex h-[240px] w-full items-center justify-center text-muted-foreground'>
        <Loader2 className='mr-2 h-6 w-6 animate-spin' /> Loading chart...
      </div>
    )
  }

  if (error) {
    return (
      <div className='h-1/4 w-full p-6'>
        <Alert variant='destructive'>
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Could not load spending data: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className='h-[240px] w-full p-6'>
      <ChartContainer config={chartConfig} className='h-full w-full'>
        <LineChart
          data={chartData}
          margin={{
            top: 10,
            right: 10,
            left: 10,
            bottom: 0,
          }}
          accessibilityLayer
        >
          <XAxis
            dataKey='periodLabel'
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={value => `$${value}`}
            dx={-10}
          />
          <Tooltip
            cursor={false}
            content={
              <ChartTooltipContent
                indicator='dot'
                formatter={value =>
                  `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                }
                labelFormatter={label => label}
              />
            }
          />
          <Line
            type='monotone'
            dataKey='amount'
            stroke='var(--color-amount)'
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3 }}
            animationDuration={1000}
            animationEasing='ease-out'
          />
        </LineChart>
      </ChartContainer>
    </div>
  )
}

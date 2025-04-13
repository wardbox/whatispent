import { Line, LineChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartConfig, ChartTooltipContent } from "../../client/components/ui/chart"
import { useQuery, getMonthlySpending } from 'wasp/client/operations'
import dayjs from 'dayjs'
import { Alert, AlertDescription, AlertTitle } from "../../client/components/ui/alert"
import { Loader2 } from "lucide-react"


export function MonthlyComparisonChart() {
  const { data: monthlySpending, isLoading, error } = useQuery(getMonthlySpending, { months: 6 })

  const chartData = monthlySpending?.map(item => ({
    month: dayjs(item.month, 'YYYY-MM').format('MMM'),
    amount: item.total,
  })) ?? []

  const chartConfig = {
    amount: {
      label: "spent",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig

  if (isLoading) {
    return (
      <div className="h-[240px] w-full flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading chart...
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-1/4 w-full p-6">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Could not load spending data: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="h-[240px] w-full p-6">
      <ChartContainer config={chartConfig} className="w-full h-full">
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
          <CartesianGrid vertical={false} horizontal={true} strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={(value) => `$${value}`}
            dx={-10}
          />
          <Tooltip
             cursor={false}
             content={<ChartTooltipContent
                indicator="dot"
                formatter={(value) => `$${Number(value).toLocaleString()}`}
                labelFormatter={(label) => label}
            />}
          />
          <Line
              type="monotoneX"
              dataKey="amount"
              stroke="var(--color-amount)"
              strokeWidth={1.5}
              dot={true}
              activeDot={{ r: 6 }}
              animationDuration={1500}
              animationEasing="ease-out"
            />
        </LineChart>
      </ChartContainer>
    </div>
  )
}

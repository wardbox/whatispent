import { motion } from "motion/react"
import { useQuery, getCategorySpending } from 'wasp/client/operations'
import { getPrettyCategoryName, getCategoryCssVariable } from '../../utils/categories' // Import both helper functions

// Remove props type
// type CategorySummaryProps = {
//   timeRange: '1m' | '3m' | '6m' | '1y'
// }

// Mapping and helper function moved to src/utils/categories.ts

export function CategorySummary(/* Remove { timeRange } */) {
  // Remove timeRange argument from useQuery
  const { data: categories, isLoading, error } = useQuery(getCategorySpending)

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading categories...</div>
  if (error) return <div>Error loading categories: {error.message}</div>
  if (!categories || categories.length === 0) return <div>No category data available for this month.</div>

  // Calculate total spending for the month
  const totalSpending = categories.reduce((sum, cat) => sum + cat.total, 0)

  const categoriesWithPercentage = categories.map(category => ({
    ...category,
    percentage: totalSpending > 0 ? ((category.total / totalSpending) * 100).toFixed(1) : '0.0',
  }))

  // Limit to top 5 categories for display
  const topCategories = categoriesWithPercentage.slice(0, 5)

  return (
    <div className="space-y-4">
      {topCategories.map((category, index) => {
        // Get pretty name and CSS variable name
        const prettyName = getPrettyCategoryName(category.category)
        const cssVariable = getCategoryCssVariable(prettyName)

        return (
          <motion.div
            key={category.category}
            className="space-y-1.5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index, duration: 0.5 }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-light">{prettyName}</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-light">${category.total.toFixed(2)}</p>
                <p className="text-xs text-zinc-400">{category.percentage}%</p>
              </div>
            </div>
            <motion.div
              className="h-[3px] bg-muted rounded-sm"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.2 * index, duration: 0.7, ease: "easeOut" }}
              style={{ originX: 0 }}
            >
              <motion.div
                className="h-full bg-foreground rounded-sm"
                initial={{ width: 0 }}
                animate={{ width: `${category.percentage}%` }}
                transition={{ delay: 0.3 * index, duration: 0.7, ease: "easeOut" }}
                style={{ backgroundColor: `hsl(var(${cssVariable}))` }}
              />
            </motion.div>
          </motion.div>
        )
      })}
    </div>
  )
}

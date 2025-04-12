import { useMotion } from '../motion/motion-provider'
import { fadeIn, staggerContainer } from '../motion/transitionPresets'
import { motion } from 'motion/react'
import { useAuth } from 'wasp/client/auth';
import {
  createLinkToken,
  exchangePublicToken,
  getInstitutions,
  syncTransactions,
  getSpendingSummary,
  getMonthlySpending,
  getCategorySpending
} from 'wasp/client/operations'
import { PlaidLinkButton } from './components/PlaidLinkButton'
import { useQuery, useAction } from 'wasp/client/operations'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Button } from '../client/components/ui/button'
import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../client/components/ui/card";

dayjs.extend(relativeTime)

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export default function Landing() {
  const { transition, key } = useMotion()
  const { data: user } = useAuth();
  const { data: institutions, isLoading: isLoadingInstitutions, error: institutionsError, refetch: refetchInstitutions } = useQuery(getInstitutions, undefined, {
    enabled: !!user,
  });
  const syncTransactionsAction = useAction(syncTransactions);
  const [syncingInstitutionId, setSyncingInstitutionId] = useState<string | null>(null);

  const { data: spendingSummary, isLoading: isLoadingSummary, error: summaryError } = useQuery(
    getSpendingSummary,
    undefined,
    { enabled: !!user && !isLoadingInstitutions }
  );

  const { data: monthlySpending, isLoading: isLoadingMonthly, error: monthlyError } = useQuery(
    getMonthlySpending,
    { months: 6 },
    { enabled: !!user && !isLoadingInstitutions }
  );

  const { data: categorySpending, isLoading: isLoadingCategory, error: categoryError } = useQuery(
    getCategorySpending,
    undefined,
    { enabled: !!user && !isLoadingInstitutions }
  );

  const handleSync = async (institutionId: string, institutionName: string) => {
    setSyncingInstitutionId(institutionId);
    try {
      const result = await syncTransactionsAction({ institutionId });
      toast.success(`Synced ${result.syncedTransactions} transactions for ${institutionName}.`);
      refetchInstitutions();
    } catch (error: any) {
      console.error("Sync failed:", error);
      const errorMessage = error?.message || 'Failed to sync transactions. Please try again later.';
      toast.error(`Sync failed for ${institutionName}: ${errorMessage}`);
    } finally {
      setSyncingInstitutionId(null);
    }
  };

  return (
    <motion.div
      key={key}
      variants={staggerContainer}
      initial='hidden'
      animate='show'
      exit='exit'
      transition={transition}
      custom={transition}
      className='container mx-auto py-12'
    >
      <motion.section variants={fadeIn} className='space-y-4'>
        <h1 className='text-4xl font-bold'>
          {import.meta.env.REACT_APP_NAME || 'What I Spent'}
        </h1>

        {!user ? (
          <p className="mt-8 text-lg text-muted-foreground">Please log in or sign up to manage your accounts.</p>
        ) : isLoadingInstitutions ? (
          <p>Loading connected accounts...</p>
        ) : institutionsError ? (
          <p className="text-red-500">Error loading accounts: {institutionsError.message}</p>
        ) : institutions && institutions.length > 0 ? (
          <div className="mt-8 border-t pt-8">
            <h3 className="mb-4 text-2xl font-semibold">Connected Accounts</h3>
            <ul className="space-y-4">
              {institutions.map((inst) => {
                const isSyncing = syncingInstitutionId === inst.id;
                return (
                  <li key={inst.id} className="p-4 border rounded-md space-y-3">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <span className="font-medium">{inst.institutionName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Last sync: {inst.lastSync ? dayjs(inst.lastSync).fromNow() : 'Never'}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSync(inst.id, inst.institutionName)}
                          disabled={isSyncing}
                        >
                          {isSyncing ? 'Syncing...' : 'Sync Now'}
                        </Button>
                      </div>
                    </div>
                    {inst.accounts && inst.accounts.length > 0 && (
                      <ul className="pl-4 border-l ml-2 space-y-2">
                        {inst.accounts.map((acc) => (
                          <li key={acc.id} className="text-sm flex justify-between items-center">
                            <span>{acc.name} ({acc.subtype})</span>
                            <span className="font-mono text-xs text-muted-foreground">*{acc.mask}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="mt-6 border-t pt-6">
              <h3 className="mb-4 text-xl font-semibold">Connect Another Account</h3>
              <PlaidLinkButton
                createLinkTokenAction={createLinkToken}
                exchangePublicTokenAction={exchangePublicToken}
              />
            </div>
          </div>
        ) : (
          <div className="mt-8 border-t pt-8">
            <h3 className="mb-4 text-2xl font-semibold">Connect Your First Bank Account</h3>
            <p className='mb-4 text-muted-foreground'>Link your financial institutions securely via Plaid.</p>
            <PlaidLinkButton
              createLinkTokenAction={createLinkToken}
              exchangePublicTokenAction={exchangePublicToken}
            />
          </div>
        )}

        {user && !isLoadingInstitutions && (
          <motion.section variants={fadeIn} className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Spending Summary</CardTitle>
                <CardDescription>Your spending activity</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSummary && <p>Loading summary...</p>}
                {summaryError && <p className="text-red-500">Error: {summaryError.message}</p>}
                {spendingSummary && (
                  <ul className="space-y-2">
                    <li>Today: <span className="font-medium">{formatCurrency(spendingSummary.today.amount)}</span></li>
                    <li>This Week: <span className="font-medium">{formatCurrency(spendingSummary.thisWeek.amount)}</span></li>
                    <li>This Month: <span className="font-medium">{formatCurrency(spendingSummary.thisMonth.amount)}</span></li>
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Spending</CardTitle>
                <CardDescription>Last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingMonthly && <p>Loading monthly data...</p>}
                {monthlyError && <p className="text-red-500">Error: {monthlyError.message}</p>}
                {monthlySpending && monthlySpending.length > 0 ? (
                  <ul className="space-y-2 text-sm">
                    {monthlySpending.map((entry) => (
                      <li key={entry.month} className="flex justify-between">
                        <span>{dayjs(entry.month + '-01').format('MMM YYYY')}</span>
                        <span className="font-medium">{formatCurrency(entry.total)}</span>
                      </li>
                    ))}
                  </ul>
                ) : monthlySpending ? (
                   <p className="text-muted-foreground">No spending data for this period.</p>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Categories (This Month)</CardTitle>
                 <CardDescription>Spending breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingCategory && <p>Loading categories...</p>}
                {categoryError && <p className="text-red-500">Error: {categoryError.message}</p>}
                {categorySpending && categorySpending.length > 0 ? (
                  <ul className="space-y-3">
                    {categorySpending.slice(0, 5).map((entry) => (
                      <li key={entry.category}>
                         <div className="flex justify-between text-sm mb-1">
                           <span>{entry.category}</span>
                           <span className="font-medium">{formatCurrency(entry.total)}</span>
                         </div>
                      </li>
                    ))}
                  </ul>
                ) : categorySpending ? (
                  <p className="text-muted-foreground">No category spending data for this month.</p>
                ) : null}
              </CardContent>
            </Card>
          </motion.section>
        )}
      </motion.section>
    </motion.div>
  )
}

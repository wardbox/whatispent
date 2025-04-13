import { useAuth } from 'wasp/client/auth'
import { useAction } from 'wasp/client/operations'
// Only import needed actions
import {
  createCheckoutSession,
  createCustomerPortalSession,
} from 'wasp/client/operations'
import { Button } from './client/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from './client/components/ui/card'
import { Loader2 } from 'lucide-react'
import { cn } from './lib/utils' // Assuming this path is correct now
import { useState } from 'react'
import { Check } from '@phosphor-icons/react' // Import Check icon

// --- Removed Enum and Multi-Tier Types ---

// Define details for the single subscription plan
const PLAN_NAME = 'Standard Plan'
const PLAN_PRICE = 499 // Price in cents ($4.99)
const PLAN_FEATURES = ['Feature 1', 'Feature 2', 'Feature 3']

// const PLAN_TIER_NAME = 'standard'; // Internal name used for user.subscriptionTier

function formatPrice(priceInCents: number): string {
  return (priceInCents / 100).toFixed(2)
}

export default function SubscriptionPage() {
  const { data: user } = useAuth()
  // Removed useQuery(getSubscriptionTiers)
  const createCheckoutSessionFn = useAction(createCheckoutSession)
  const createCustomerPortalSessionFn = useAction(createCustomerPortalSession)

  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)
  const [isPortalLoading, setIsPortalLoading] = useState(false)

  const isLoading = isCheckoutLoading || isPortalLoading // Simplified loading state

  const handleManageSubscription = async () => {
    if (!user) return // Should not happen if button is shown correctly

    setIsPortalLoading(true)
    try {
      console.log('User active, redirecting to portal...')
      const result = await createCustomerPortalSessionFn({})
      if ((result as { sessionUrl: string })?.sessionUrl) {
        window.location.href = (result as { sessionUrl: string }).sessionUrl
      } else {
        console.error('Could not get customer portal URL.')
        // TODO: Show error message to user
      }
    } catch (error) {
      console.error('Error creating portal session:', error)
      // TODO: Show error message to user
    } finally {
      setIsPortalLoading(false)
    }
  }

  const handleSubscribe = async () => {
    if (!user) {
      console.log('User not logged in, redirecting to login...')
      window.location.href = '/login?redirect=/subscribe'
      return
    }

    // If user is already active, redirect to portal management instead of subscribing again
    if (user.subscriptionStatus === 'active') {
      handleManageSubscription()
      return
    }

    setIsCheckoutLoading(true)
    try {
      const result = await createCheckoutSessionFn({})
      if ((result as { sessionUrl: string })?.sessionUrl) {
        window.location.href = (result as { sessionUrl: string }).sessionUrl
      } else {
        console.error('Stripe Checkout Session URL not received.')
        // TODO: Show error message to user
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      // TODO: Show error message to user
    } finally {
      setIsCheckoutLoading(false)
    }
  }

  const getButtonText = () => {
    if (!user) return 'Login to Subscribe'
    const isActive = user.subscriptionStatus === 'active'
    // Optionally check tier if you implement it
    // const isCorrectTier = user?.subscriptionTier === PLAN_TIER_NAME;

    if (isActive) return 'Manage Subscription'
    if (user.subscriptionStatus === 'incomplete') return 'Complete Payment' // Handle incomplete state
    return `Subscribe ($${formatPrice(PLAN_PRICE)}/month)`
  }

  const isSubscribed = user?.subscriptionStatus === 'active'

  return (
    <div className='flex w-full flex-col'>
      {/* Page Header */}
      <header className='mb-8 flex items-center justify-between'>
        <h1 className='text-3xl font-extralight tracking-tight text-foreground'>
          Subscription
        </h1>
        {/* Potential placeholder for actions if needed */}
      </header>

      {/* Removed Tier Loading/Error states */}

      {/* Center the card */}
      <div className='mx-auto w-full max-w-md'>
        <Card className={cn(isSubscribed ? 'border-2 border-primary' : '')}>
          <CardHeader>
            <CardTitle>{PLAN_NAME}</CardTitle>
            <CardDescription>Access all features.</CardDescription>{' '}
          </CardHeader>
          <CardContent className='space-y-6'>
            <p className='text-3xl font-bold'>
              ${formatPrice(PLAN_PRICE)}
              <span className='text-sm font-normal text-muted-foreground'>
                /month
              </span>
            </p>
            <ul className='space-y-2 pt-4'>
              {PLAN_FEATURES.map((feature, index) => (
                <li key={index} className='flex items-center gap-2'>
                  <Check className="h-4 w-4 text-green-500" />
                  <span className='text-sm font-light text-muted-foreground'>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className='w-full'
              onClick={
                isSubscribed ? handleManageSubscription : handleSubscribe
              }
              disabled={isLoading}
            >
              {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {getButtonText()}
            </Button>
          </CardFooter>
        </Card>

        {/* Display status if needed */}
        {user && (
          <p className='mt-4 text-center text-sm text-muted-foreground'>
            Current status:{' '}
            <span className="font-medium">
              {user.subscriptionStatus
                ? user.subscriptionStatus.charAt(0).toUpperCase() +
                  user.subscriptionStatus.slice(1)
                : 'Not Subscribed'}
            </span>
            {user.subscriptionStatus === 'canceled' &&
              ' (Expires end of period)'}
          </p>
        )}
      </div>
    </div>
  )
}

import React from 'react'
import { Link } from 'wasp/client/router'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../../client/components/ui/card'
import { Button } from '../../client/components/ui/button'
import { AlertCircle } from 'lucide-react'

export function SubscriptionInterstitial({
  trialEndsAt,
}: {
  trialEndsAt?: Date | null
}) {
  const trialEnded = trialEndsAt && new Date(trialEndsAt) < new Date()

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm'>
      <Card className='w-[380px]'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <AlertCircle className='text-yellow-500' />
            {trialEnded ? 'Trial Ended' : 'Subscription Required'}
          </CardTitle>
          <CardDescription>
            {trialEnded
              ? 'Your 7-day free trial has ended. Please subscribe to continue using What I Spent.'
              : 'Access to this feature requires an active subscription or free trial.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground'>
            Unlock full access to transaction tracking, spending insights, and
            more.
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild className='w-full'>
            <Link to='/subscription'>
              {trialEnded ? 'Subscribe Now' : 'View Subscription Options'}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

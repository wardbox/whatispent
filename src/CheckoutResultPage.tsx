import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from './client/components/ui/card'
import { Button } from './client/components/ui/button'
import { CheckCircle, XCircle } from '@phosphor-icons/react'

function useQuery() {
  const { search } = useLocation()
  return React.useMemo(() => new URLSearchParams(search), [search])
}

export default function CheckoutResultPage() {
  const query = useQuery()
  const success = query.get('success') === 'true'
  const canceled = query.get('canceled') === 'true'

  return (
    <div className='container mx-auto flex min-h-[calc(100vh-var(--header-height))] items-center justify-center px-4 py-16'>
      <Card className='w-full max-w-md text-center'>
        <CardHeader>
          {success && (
            <CheckCircle className='mx-auto mb-4 h-12 w-12 text-green-500' />
          )}
          {canceled && (
            <XCircle className='mx-auto mb-4 h-12 w-12 text-red-500' />
          )}
          <CardTitle>
            {success ? 'Payment Successful!' : 'Payment Canceled'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {success && (
            <p>
              Thank you for subscribing! Your account is now active. You can
              manage your subscription in the settings.
            </p>
          )}
          {canceled && (
            <p>
              Your payment process was canceled. You can try subscribing again
              anytime.
            </p>
          )}
        </CardContent>
        <CardFooter className='flex justify-center'>
          <Button asChild>
            <Link to='/dashboard'>Go to Dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

import React, { useState, useCallback } from 'react'
// Remove react-plaid-link imports
// import {
//   usePlaidLink,
//   PlaidLinkOptions,
//   PlaidLinkOnSuccess,
// } from 'react-plaid-link';
import { Button } from '../../client/components/ui/button'
// Import the toast function
import { toast } from '../../hooks/use-toast'

// Define type for the Plaid Link handler
declare global {
  interface Window {
    Plaid: {
      create: (config: PlaidConfig) => PlaidHandler
    }
  }
}

// Simplified Plaid Link types (adjust based on actual usage)
interface PlaidConfig {
  token: string | null
  onSuccess: (public_token: string, metadata: any) => void
  onExit?: (err: any, metadata: any) => void
  onEvent?: (eventName: string, metadata: any) => void
  receivedRedirectUri?: string | null // Add if using OAuth
}

interface PlaidHandler {
  open: () => void
  exit: (options?: any) => void
  destroy: () => void
}

// Update props
interface PlaidLinkButtonProps {
  // Use explicit function signatures instead of typeof
  createLinkTokenAction: () => Promise<string>
  exchangePublicTokenAction: (args: {
    publicToken: string
    // Define the expected result type inline or import it if shared
  }) => Promise<{ institutionId: string }>
  // Update onSuccess prop type to accept the result
  onSuccess?: (result: { institutionId: string }) => void
  // Add onError prop
  onError?: (error: any) => void
  onExit?: (err: any, metadata: any) => void
  onEvent?: (eventName: string, metadata: any) => void
}

export const PlaidLinkButton: React.FC<PlaidLinkButtonProps> = ({
  createLinkTokenAction,
  exchangePublicTokenAction,
  onSuccess,
  // Get onError from props
  onError,
  onExit,
  onEvent,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  // No need for handler state here, create it on click
  // No need for isReady state

  const handlePlaidSuccess = useCallback(
    async (public_token: string) => {
      setIsLoading(true) // Indicate processing
      try {
        // Capture the result of the exchange action
        const result = await exchangePublicTokenAction({
          publicToken: public_token,
        })
        // Optionally: Trigger UI update or navigation
        if (onSuccess) {
          // Pass the result to the onSuccess callback
          onSuccess(result)
        }
      } catch (err) {
        // Call the onError callback if provided
        if (onError) {
          onError(err)
        }
      } finally {
        setIsLoading(false)
      }
    },
    [exchangePublicTokenAction, onSuccess, onError],
  )

  const handlePlaidExit = useCallback(
    (err: any, metadata: any) => {
      // Call external onExit if provided
      if (onExit) {
        onExit(err, metadata)
      }
      setIsLoading(false) // Ensure loading is stopped on exit
    },
    [onExit],
  )

  // Remove the useEffect that depended on the token prop

  const handleOpen = async () => {
    if (!window.Plaid) {
      const err = { message: 'Plaid script failed to load.' }
      if (onError) {
        onError(err)
      } else {
        toast({
          variant: 'destructive',
          title: 'Connection Error',
          description: err.message || 'Plaid script failed to load.',
        })
      }
      return
    }

    setIsLoading(true)

    try {
      // 1. Get link token
      const linkToken = await createLinkTokenAction()
      if (!linkToken) {
        throw new Error('Received null or undefined link token.')
      }

      // 2. Create Plaid Handler
      const plaidHandler = window.Plaid.create({
        token: linkToken,
        onSuccess: handlePlaidSuccess,
        onExit: handlePlaidExit,
        onEvent: onEvent,
        // receivedRedirectUri: window.location.href.includes('?oauth_state_id=') ? window.location.href : null,
      })

      // 3. Open Plaid Link
      plaidHandler.open()
      // No need to call setIsLoading(false) here, as the modal is now open
      // Loading state will be handled by onSuccess or onExit callbacks
    } catch (err) {
      setIsLoading(false)

      // Safely determine the error message
      let errorMessage = 'Could not initialize connection.' // Default message
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (
        typeof err === 'object' &&
        err !== null &&
        'message' in err &&
        typeof err.message === 'string'
      ) {
        // Handle cases where it might be an error-like object from Plaid or elsewhere
        errorMessage = err.message
      }

      // Also call onError for initialization errors
      if (onError) {
        onError(err) // Pass the original error object
      } else {
        toast({
          variant: 'destructive',
          title: 'Connection Error',
          description: errorMessage, // Use the safely determined message
        })
      }
    }
  }

  // Update button text and state logic
  let buttonText = 'Add'
  let isButtonDisabled = isLoading

  if (isLoading) {
    buttonText = 'Connecting...'
  }

  return (
    <Button
      variant='outline'
      size='sm'
      className='h-7 text-xs'
      onClick={handleOpen}
      disabled={isButtonDisabled}
    >
      {buttonText}
    </Button>
  )
}

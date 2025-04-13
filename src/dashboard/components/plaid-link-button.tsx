import React, { useState, useCallback } from 'react'
// Remove react-plaid-link imports
// import {
//   usePlaidLink,
//   PlaidLinkOptions,
//   PlaidLinkOnSuccess,
// } from 'react-plaid-link';
import { Button } from '../../client/components/ui/button'

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
  }) => Promise<{ institutionId: string }>
  onSuccess?: () => void
  onExit?: (err: any, metadata: any) => void
  onEvent?: (eventName: string, metadata: any) => void
}

export const PlaidLinkButton: React.FC<PlaidLinkButtonProps> = ({
  createLinkTokenAction,
  exchangePublicTokenAction,
  onSuccess,
  onExit,
  onEvent,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<any>(null)
  // No need for handler state here, create it on click
  // No need for isReady state

  const handlePlaidSuccess = useCallback(
    async (public_token: string, metadata: any) => {
      console.log('Plaid Link success:', public_token, metadata)
      setIsLoading(true) // Indicate processing
      setError(null)
      try {
        await exchangePublicTokenAction({ publicToken: public_token })
        console.log('Public token exchanged successfully!')
        // Optionally: Trigger UI update or navigation
        if (onSuccess) {
          onSuccess()
        }
      } catch (err) {
        console.error('Error exchanging public token:', err)
        setError(err) // Show error state
      } finally {
        setIsLoading(false)
      }
    },
    [exchangePublicTokenAction, onSuccess],
  )

  const handlePlaidExit = useCallback(
    (err: any, metadata: any) => {
      console.log('Plaid exited:', err, metadata)
      if (err) {
        setError(err)
      }
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
      console.error('Plaid.js script not loaded')
      setError({ message: 'Plaid script failed to load.' })
      return
    }

    setIsLoading(true)
    setError(null)

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
      console.error('Error initiating Plaid Link:', err)
      setError(err)
      setIsLoading(false)
    }
  }

  // Update button text and state logic
  let buttonText = 'Add'
  let isButtonDisabled = isLoading

  if (isLoading) {
    buttonText = 'Connecting...'
  } else if (error) {
    buttonText = 'Connection Error'
    isButtonDisabled = false // Allow retry
  }

  return (
      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleOpen} disabled={isButtonDisabled}>
        {buttonText}
      </Button>
  )
}

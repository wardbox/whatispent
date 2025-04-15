import { plaidClient } from './client'
import {
  CountryCode,
  LinkTokenCreateRequest,
  Products,
  TransactionsGetRequest,
  AccountsBalanceGetRequest,
  Transaction as PlaidTransaction,
  AccountBase,
} from 'plaid'
import { encrypt, decrypt } from './utils/encryption'

/**
 * Creates a Plaid Link token for a given user.
 * This token is used by the frontend Plaid Link component.
 */
export async function _internalCreateLinkToken(
  userId: string,
): Promise<string> {
  // Define the Plaid Link configuration
  const request: LinkTokenCreateRequest = {
    user: {
      client_user_id: userId, // Associate the token with your internal user ID
    },
    client_name: 'What I Spent',
    // Specify the products you want to use (e.g., 'transactions', 'auth')
    products: [Products.Transactions],
    // Specify the countries your users are in
    country_codes: [CountryCode.Us],
    language: 'en', // Specify the language
    // Optional: webhook configuration if using webhooks
    // webhook: 'https://your-webhook-url.com/plaid',
  }

  try {
    const response = await plaidClient.linkTokenCreate(request)
    return response.data.link_token
  } catch (error: any) {
    console.error(
      'Error creating Plaid link token:',
      error.response?.data || error.message,
    )
    throw new Error('Could not create Plaid link token.')
  }
}

/**
 * Exchanges a public token from Plaid Link for an access token and item ID.
 * Fetches basic institution details.
 * Fetches associated account details.
 * Encrypts the access token before returning.
 */
export async function _internalExchangePublicToken(
  publicToken: string,
): Promise<{
  accessToken: string
  itemId: string
  institutionName: string
  institutionId: string
  accounts: AccountBase[]
  institutionLogo?: string | null
}> {
  try {
    // Exchange public token for access token and item ID
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    })
    const accessToken = exchangeResponse.data.access_token
    const itemId = exchangeResponse.data.item_id

    // Decrypt needed for subsequent calls within this function
    const decryptedAccessToken = accessToken // No need to decrypt yet as it's fresh

    // Fetch item details (including institution ID)
    const itemResponse = await plaidClient.itemGet({
      access_token: decryptedAccessToken,
    })
    const institutionId = itemResponse.data.item.institution_id

    if (!institutionId) {
      throw new Error('Could not retrieve institution ID for the item.')
    }

    // Fetch institution details by ID
    const institutionResponse = await plaidClient.institutionsGetById({
      institution_id: institutionId,
      country_codes: [CountryCode.Us], // Specify country code(s)
      options: { include_optional_metadata: true }, // Get name, logo, etc.
    })

    const institutionName = institutionResponse.data.institution.name
    const institutionLogo = institutionResponse.data.institution.logo

    // Fetch accounts associated with the item
    const accountsResponse = await plaidClient.accountsGet({
      access_token: decryptedAccessToken,
    })
    const accounts = accountsResponse.data.accounts

    // Encrypt the access token before returning
    const encryptedAccessToken = encrypt(accessToken)

    return {
      accessToken: encryptedAccessToken,
      itemId: itemId,
      institutionName: institutionName,
      institutionId: institutionId, // Plaid's ID for the institution
      accounts: accounts,
      institutionLogo: institutionLogo,
    }
  } catch (error: any) {
    console.error(
      'Error exchanging Plaid public token, fetching institution, or fetching accounts:',
      error.response?.data || error.message,
    )
    // Consider more specific error handling based on Plaid error codes if needed
    throw new Error(
      'Could not exchange Plaid public token, fetch institution details, or fetch accounts.',
    )
  }
}

/**
 * Fetches transactions from Plaid for a given access token within a specified date range.
 * Handles pagination automatically.
 * Decrypts the provided access token before use.
 */
export async function _internalFetchTransactions(
  encryptedAccessToken: string,
  startDate: string, // YYYY-MM-DD
  endDate: string, // YYYY-MM-DD
): Promise<PlaidTransaction[]> {
  const accessToken = decrypt(encryptedAccessToken)
  let allTransactions: PlaidTransaction[] = []
  let hasMore = true
  let offset = 0
  const count = 100 // Fetch 100 transactions per request (max 500)

  try {
    while (hasMore) {
      const request: TransactionsGetRequest = {
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
        options: {
          count: count,
          offset: offset,
        },
      }

      const response = await plaidClient.transactionsGet(request)
      const transactions = response.data.transactions
      const totalTransactions = response.data.total_transactions

      allTransactions = allTransactions.concat(transactions)

      if (allTransactions.length < totalTransactions) {
        offset += transactions.length // Use actual length in case it's less than count
      } else {
        hasMore = false
      }

      // Optional: Add a small delay if hitting rate limits frequently
      // await new Promise(resolve => setTimeout(resolve, 200));
    }

    // We might also want to fetch accounts here if needed elsewhere,
    // but for just transactions, this is sufficient.
    // const accounts = response.data.accounts;

    return allTransactions
  } catch (error: any) {
    console.error(
      'Error fetching Plaid transactions:',
      error.response?.data || error.message,
    )
    // Consider specific error handling, e.g., ITEM_LOGIN_REQUIRED
    if (error.response?.data?.error_code === 'ITEM_LOGIN_REQUIRED') {
      // Need to inform the user to re-authenticate this item
      console.warn(
        `Item login required for token associated with fetch attempt.`,
      )
      // Depending on use case, might throw a specific error type
    }
    throw new Error('Could not fetch Plaid transactions.')
  }
}

/**
 * Fetches the current balance for all accounts associated with a given access token.
 * Decrypts the provided access token before use.
 */
export async function _internalFetchBalances(
  encryptedAccessToken: string,
): Promise<AccountBase[]> {
  // Returns an array of accounts with balances
  const accessToken = decrypt(encryptedAccessToken)

  try {
    const request: AccountsBalanceGetRequest = {
      access_token: accessToken,
    }
    const response = await plaidClient.accountsBalanceGet(request)
    return response.data.accounts
  } catch (error: any) {
    console.error(
      'Error fetching Plaid account balances:',
      error.response?.data || error.message,
    )
    if (error.response?.data?.error_code === 'ITEM_LOGIN_REQUIRED') {
      console.warn(
        `Item login required for token associated with balance fetch attempt.`,
      )
    }
    throw new Error('Could not fetch Plaid account balances.')
  }
}

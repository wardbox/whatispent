import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;
const PLAID_ENV = process.env.PLAID_ENV || 'sandbox';

if (!PLAID_CLIENT_ID) {
  throw new Error('PLAID_CLIENT_ID is not set in the environment variables.');
}

if (!PLAID_SECRET) {
  throw new Error('PLAID_SECRET is not set in the environment variables.');
}

const plaidEnvironment = PlaidEnvironments[PLAID_ENV];

if (!plaidEnvironment) {
  throw new Error(`Invalid PLAID_ENV: ${PLAID_ENV}. Must be one of ${Object.keys(PlaidEnvironments).join(', ')}`);
}

const config: Configuration = new Configuration({
  basePath: plaidEnvironment,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
      'PLAID-SECRET': PLAID_SECRET,
      'Plaid-Version': '2020-09-14', // Specify the Plaid API version
    },
  },
});

export const plaidClient = new PlaidApi(config); 

// Mapping from Plaid category names to pretty names
export const prettyCategoryNames: { [key: string]: string } = {
  INCOME: "Income",
  TRANSFER_IN: "Transfers In",
  TRANSFER_OUT: "Transfers Out",
  LOAN_PAYMENTS: "Loan Payments",
  BANK_FEES: "Bank Fees",
  ENTERTAINMENT: "Entertainment",
  FOOD_AND_DRINK: "Food & Drink",
  GENERAL_MERCHANDISE: "Shopping",
  HOME_IMPROVMENT: "Home Improvement", // Using the provided name including typo
  MEDICAL: "Medical",
  PERSONAL_CARE: "Personal Care",
  GENERAL_SERVICES: "Services",
  GOVERNMENT_AND_NON_PROFIT: "Government & Non-Profit",
  TRANSPORTATION: "Transportation",
  TRAVEL: "Travel",
  RENT_AND_UTILITIES: "Rent & Utilities",
};

// Function to get the pretty name, falling back to the original if not found
export const getPrettyCategoryName = (plaidCategory: string): string => {
  return prettyCategoryNames[plaidCategory] || plaidCategory;
};

// Function to convert a pretty category name to its CSS variable name format
export const getCategoryCssVariable = (prettyName: string): string => {
  const variableName = prettyName
    .toLowerCase()
    .replace(/ & /g, '-') // Replace " & " with "-"
    .replace(/ /g, '-'); // Replace remaining spaces with "-"
  return `--category-${variableName}`;
}; 

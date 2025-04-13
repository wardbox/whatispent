import {
  ShoppingBag,
  ForkKnife,
  HouseSimple,
  Car,
  AirplaneTilt,
  Bank,
  Heartbeat,
  HandHeart,
  Wrench,
  Receipt,
  PiggyBank,
  Gift,
  Icon,
} from '@phosphor-icons/react'

// Mapping from Plaid category names to pretty names
export const prettyCategoryNames: { [key: string]: string } = {
  INCOME: 'Income',
  TRANSFER_IN: 'Transfers In',
  TRANSFER_OUT: 'Transfers Out',
  LOAN_PAYMENTS: 'Loan Payments',
  BANK_FEES: 'Bank Fees',
  ENTERTAINMENT: 'Entertainment',
  FOOD_AND_DRINK: 'Food & Drink',
  GENERAL_MERCHANDISE: 'Shopping',
  HOME_IMPROVMENT: 'Home Improvement', // Using the provided name including typo
  MEDICAL: 'Medical',
  PERSONAL_CARE: 'Personal Care',
  GENERAL_SERVICES: 'Services',
  GOVERNMENT_AND_NON_PROFIT: 'Government & Non-Profit',
  TRANSPORTATION: 'Transportation',
  TRAVEL: 'Travel',
  RENT_AND_UTILITIES: 'Rent & Utilities',
}

// Function to get the pretty name, falling back to the original if not found
export const getPrettyCategoryName = (plaidCategory: string): string => {
  return prettyCategoryNames[plaidCategory] || plaidCategory
}

// Function to convert a pretty category name to its CSS variable name format
export const getCategoryCssVariable = (prettyName: string): string => {
  const variableName = prettyName
    .toLowerCase()
    .replace(/ & /g, '-') // Replace " & " with "-"
    .replace(/ /g, '-') // Replace remaining spaces with "-"
  return `--category-${variableName}`
}

// Mapping from Plaid primary category names to Phosphor icons
export const categoryIcons: { [key: string]: Icon } = {
  INCOME: PiggyBank,
  TRANSFER_IN: Bank,
  TRANSFER_OUT: Bank,
  LOAN_PAYMENTS: Receipt,
  BANK_FEES: Bank,
  ENTERTAINMENT: Gift, // Placeholder, could be more specific later
  FOOD_AND_DRINK: ForkKnife,
  GENERAL_MERCHANDISE: ShoppingBag,
  HOME_IMPROVEMENT: Wrench, // Corrected typo from pretty names
  MEDICAL: Heartbeat,
  PERSONAL_CARE: HandHeart,
  GENERAL_SERVICES: Receipt, // Placeholder
  GOVERNMENT_AND_NON_PROFIT: Bank, // Placeholder
  TRANSPORTATION: Car,
  TRAVEL: AirplaneTilt,
  RENT_AND_UTILITIES: HouseSimple,
  // Add more specific mappings as needed
}

// Function to get the icon for a category, falling back to a default if not found
export const getCategoryIcon = (plaidCategory: string | undefined): Icon => {
  if (!plaidCategory) return Receipt // Default icon
  return categoryIcons[plaidCategory] || Receipt // Default icon if specific category not mapped
}

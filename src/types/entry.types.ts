export type EntryType = 'income' | 'expense';

export const DEFAULT_INCOME_CATEGORIES: string[] = [];

export const DEFAULT_EXPENSE_CATEGORIES: string[] = [];

export interface Entry {
  id: string;
  type: EntryType;
  date: string; // YYYY-MM-DD format for easy querying & grouping
  serial: number;
  description: string;
  amount: number;
  category?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface UserNote {
  id: string;
  dateFrom: string; // YYYY-MM-DD
  dateTo: string;   // YYYY-MM-DD
  content: string;
  updatedAt: number;
}

export type TimeFilterType = 'day' | 'week' | 'month' | 'year' | 'custom';

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  incomeCount: number;
  expenseCount: number;
}

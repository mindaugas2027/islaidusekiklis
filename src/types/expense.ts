export interface Expense {
  id: string;
  amount: number;
  category: string; // Changed from ExpenseCategory enum to string
  description: string;
  date: string; // YYYY-MM-DD format
}
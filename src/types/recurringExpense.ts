export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
  day_of_month: number; // Changed to match database column name
}
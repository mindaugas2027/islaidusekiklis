export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
  dayOfMonth: number; // Day of the month (1-31)
}
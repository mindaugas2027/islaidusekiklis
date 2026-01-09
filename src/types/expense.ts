export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string; // YYYY-MM-DD format
  user_id?: string; // Optional as it's set by the database
  created_at?: string; // Optional as it's set by the database
}
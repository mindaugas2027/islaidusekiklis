export enum ExpenseCategory {
  FOOD = "Maistas",
  FUEL = "Kuras",
  ENTERTAINMENT = "Pramogos",
  TRANSPORT = "Transportas",
  HOUSING = "Būstas",
  UTILITIES = "Komunalinės paslaugos",
  HEALTH = "Sveikata",
  EDUCATION = "Mokslas",
  CLOTHING = "Apranga",
  OTHER = "Kita",
}

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: string; // YYYY-MM-DD format
}
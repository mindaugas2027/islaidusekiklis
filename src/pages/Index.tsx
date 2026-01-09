import React, { useState, useEffect, useMemo } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseList from "@/components/ExpenseList";
import ExpenseChart from "@/components/ExpenseChart";
import IncomeTracker from "@/components/IncomeTracker"; // Import IncomeTracker
import { Expense } from "@/types/expense";

const Index = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Load expenses from localStorage on initial render
  useEffect(() => {
    const storedExpenses = localStorage.getItem("expenses");
    if (storedExpenses) {
      setExpenses(JSON.parse(storedExpenses));
    }
  }, []);

  // Save expenses to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses));
  }, [expenses]);

  const handleAddExpense = (newExpense: Expense) => {
    setExpenses((prevExpenses) => [...prevExpenses, newExpense]);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses((prevExpenses) => prevExpenses.filter((expense) => expense.id !== id));
  };

  // Calculate total expenses for the current month/year for the IncomeTracker
  const totalExpenses = useMemo(() => {
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const currentYear = String(new Date().getFullYear());

    const monthlyExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const expenseMonth = String(expenseDate.getMonth() + 1).padStart(2, '0');
      const expenseYear = String(expenseDate.getFullYear());
      return expenseMonth === currentMonth && expenseYear === currentYear;
    });
    return monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);


  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-5xl font-extrabold text-center mb-10">
          Išlaidų Sekiklis
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ExpenseForm onAddExpense={handleAddExpense} />
          <IncomeTracker totalExpenses={totalExpenses} /> {/* Add IncomeTracker */}
        </div>

        <ExpenseChart expenses={expenses} />
        <ExpenseList expenses={expenses} onDeleteExpense={handleDeleteExpense} />
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;
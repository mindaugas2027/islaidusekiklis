import React, { useState, useEffect } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseList from "@/components/ExpenseList";
import ExpenseChart from "@/components/ExpenseChart";
import { Expense } from "@/types/expense"; // Using @ alias

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-5xl font-extrabold text-center text-gray-900 dark:text-gray-50 mb-10">
          Išlaidų Sekiklis
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ExpenseForm onAddExpense={handleAddExpense} />
          <ExpenseChart expenses={expenses} />
        </div>

        <ExpenseList expenses={expenses} onDeleteExpense={handleDeleteExpense} />
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;
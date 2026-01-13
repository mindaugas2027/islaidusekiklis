import React, { useState, useEffect, useMemo } from "react";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseList from "@/components/ExpenseList";
import ExpenseChart from "@/components/ExpenseChart";
import IncomeTracker from "@/components/IncomeTracker";
import Sidebar from "@/components/Sidebar";
import MonthlyLineChart from "@/components/MonthlyLineChart";
import { Expense } from "@/types/expense";
import { RecurringExpense } from "@/types/recurringExpense";
import { toast } from "sonner";
import MonthYearNavigator from "@/components/MonthYearNavigator";
import { format, lastDayOfMonth } from "date-fns";
import { useExpenses } from "@/hooks/useExpenses";
import { useCategories } from "@/hooks/useCategories";
import { useMonthlyIncomes } from "@/hooks/useMonthlyIncomes";
import { useRecurringExpenses } from "@/hooks/useRecurringExpenses";

const DEFAULT_CATEGORIES = [
  "Maistas",
  "Kuras",
  "Pramogos",
  "Transportas",
  "Būstas",
  "Komunalinės paslaugos",
  "Sveikata",
  "Mokslas",
  "Apranga",
  "Kita"
];

const months = [
  { value: "01", label: "Sausis" },
  { value: "02", label: "Vasaris" },
  { value: "03", label: "Kovas" },
  { value: "04", label: "Balandis" },
  { value: "05", label: "Gegužė" },
  { value: "06", label: "Birželis" },
  { value: "07", label: "Liepa" },
  { value: "08", label: "Rugpjūtis" },
  { value: "09", label: "Rugsėjis" },
  { value: "10", label: "Spalis" },
  { value: "11", label: "Lapkritis" },
  { value: "12", label: "Gruodis" },
];

const Index = () => {
  const impersonatedUser = useMemo(() => {
    const impersonatingUserStr = localStorage.getItem('impersonating_user');
    if (impersonatingUserStr) {
      try {
        return JSON.parse(impersonatingUserStr);
      } catch (e) {
        return null;
      }
    }
    return null;
  }, []);

  const impersonatedUserId = impersonatedUser?.id;

  const { expenses, loading: expensesLoading, addExpense, deleteExpense } = useExpenses(impersonatedUserId);
  const { categories, loading: categoriesLoading, addCategory, deleteCategory } = useCategories(impersonatedUserId);
  const { monthlyIncomes, defaultMonthlyIncome, saveIncome } = useMonthlyIncomes(impersonatedUserId);
  const { recurringExpenses, addRecurringExpense, deleteRecurringExpense } = useRecurringExpenses(impersonatedUserId);

  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const currentYear = String(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);

  useEffect(() => {
    if (!categoriesLoading && categories.length === 0) {
      DEFAULT_CATEGORIES.forEach(cat => {
        addCategory(cat);
      });
    }
  }, [categoriesLoading, categories, addCategory]);

  useEffect(() => {
    const generateAndMergeExpenses = () => {
      const today = new Date();
      const currentActualYear = today.getFullYear();
      const currentActualMonth = String(today.getMonth() + 1).padStart(2, '0');
      const currentActualDay = today.getDate();

      let maxDayToShow = 0;

      if (parseInt(selectedYear) < currentActualYear ||
          (parseInt(selectedYear) === currentActualYear && selectedMonth < currentActualMonth)) {
        maxDayToShow = 31;
      } else if (parseInt(selectedYear) === currentActualYear && selectedMonth === currentActualMonth) {
        maxDayToShow = currentActualDay;
      } else {
        maxDayToShow = 0;
      }

      const recurringExpensesForSelectedMonthYear: Expense[] = [];
      const currentMonthYearPrefix = `${selectedYear}-${selectedMonth}`;

      recurringExpenses.forEach(recExpense => {
        if (recExpense.day_of_month <= maxDayToShow) {
          const tempDate = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, recExpense.day_of_month);
          const actualDay = Math.min(recExpense.day_of_month, lastDayOfMonth(tempDate).getDate());
          const expenseDate = format(
            new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, actualDay),
            'yyyy-MM-dd'
          );

          recurringExpensesForSelectedMonthYear.push({
            id: `RECURRING-${recExpense.id}-${expenseDate}`,
            amount: recExpense.amount,
            category: recExpense.category,
            description: recExpense.name,
            date: expenseDate,
          });
        }
      });
    };

    generateAndMergeExpenses();
  }, [selectedMonth, selectedYear, recurringExpenses]);

  const handleAddExpense = async (newExpense: Omit<Expense, 'id'>) => {
    await addExpense(newExpense);
  };

  const handleDeleteExpense = async (id: string) => {
    await deleteExpense(id);
  };

  const handleAddCategory = async (newCategory: string) => {
    await addCategory(newCategory);
  };

  const handleDeleteCategory = async (categoryToDelete: string) => {
    const expensesWithCategory = expenses.filter(
      (expense) => expense.category === categoryToDelete
    );

    const recurringExpensesWithCategory = recurringExpenses.filter(
      (recExpense) => recExpense.category === categoryToDelete
    );

    if (expensesWithCategory.length > 0 || recurringExpensesWithCategory.length > 0) {
      toast.error(
        `Negalima ištrinti kategorijos "${categoryToDelete}", nes ji naudojama išlaidose arba pasikartojančiose išlaidose.`
      );
      return;
    }

    await deleteCategory(categoryToDelete);
  };

  const handleSaveIncome = async (income: number, type: 'default' | 'month', monthYear?: string) => {
    await saveIncome(income, type, monthYear);
  };

  const handleAddRecurringExpense = async (newRecExpense: Omit<RecurringExpense, "id">) => {
    await addRecurringExpense(newRecExpense);
  };

  const handleDeleteRecurringExpense = async (id: string) => {
    await deleteRecurringExpense(id);
  };

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    expenses.forEach(expense => years.add(new Date(expense.date).getFullYear().toString()));
    years.add(String(new Date().getFullYear()));
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const expenseMonth = String(expenseDate.getMonth() + 1).padStart(2, '0');
      const expenseYear = String(expenseDate.getFullYear());
      return expenseMonth === selectedMonth && expenseYear === selectedYear;
    });
  }, [expenses, selectedMonth, selectedYear]);

  const totalExpensesForSelectedMonth = useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [filteredExpenses]);

  const selectedMonthYear = `${selectedYear}-${selectedMonth}`;
  const currentMonthIncome = monthlyIncomes[selectedMonthYear] !== undefined && monthlyIncomes[selectedMonthYear] !== null
    ? monthlyIncomes[selectedMonthYear]
    : defaultMonthlyIncome;

  const previousMonthCarryOver = useMemo(() => {
    let prevMonth = parseInt(selectedMonth) - 1;
    let prevYear = parseInt(selectedYear);

    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }

    const prevMonthPadded = String(prevMonth).padStart(2, '0');
    const prevMonthYear = `${prevYear}-${prevMonthPadded}`;

    const expensesForPreviousMonth = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const expenseMonth = String(expenseDate.getMonth() + 1).padStart(2, '0');
      const expenseYear = String(expenseDate.getFullYear());
      return expenseMonth === prevMonthPadded && expenseYear === String(prevYear);
    });

    const totalExpensesForPreviousMonth = expensesForPreviousMonth.reduce((sum, expense) => sum + expense.amount, 0);
    const previousMonthIncome = monthlyIncomes[prevMonthYear] !== undefined && monthlyIncomes[prevMonthYear] !== null
      ? monthlyIncomes[prevMonthYear]
      : defaultMonthlyIncome;

    return previousMonthIncome - totalExpensesForPreviousMonth;
  }, [expenses, monthlyIncomes, defaultMonthlyIncome, selectedMonth, selectedYear]);

  const monthlyExpenseTotals = useMemo(() => {
    const monthlyTotals: { [key: string]: number } = {};

    expenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      const year = String(expenseDate.getFullYear());
      const month = String(expenseDate.getMonth() + 1).padStart(2, '0');

      if (year === selectedYear) {
        monthlyTotals[month] = (monthlyTotals[month] || 0) + expense.amount;
      }
    });

    return months.map(m => ({
      name: m.label,
      total: parseFloat((monthlyTotals[m.value] || 0).toFixed(2)),
    }));
  }, [expenses, selectedYear]);

  if (expensesLoading || categoriesLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <p>Įkeliama...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-2 sm:p-4 md:p-6 lg:p-8">
      <Sidebar
        categories={categories}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
        monthlyIncomes={monthlyIncomes}
        defaultMonthlyIncome={defaultMonthlyIncome}
        onSaveIncome={handleSaveIncome}
        recurringExpenses={recurringExpenses}
        onAddRecurringExpense={handleAddRecurringExpense}
        onDeleteRecurringExpense={handleDeleteRecurringExpense}
      />

      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 pt-16">
        <h1 className="text-2xl xs:text-3xl sm:text-4xl font-extrabold text-center mb-4 sm:mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500 drop-shadow-sm px-2">
          Išlaidų Skaičiuoklė
        </h1>

        {impersonatedUser && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 font-medium">
              Peržiūrite vartotojo <span className="font-semibold">{impersonatedUser.email || impersonatedUser.id}</span> duomenis.
              Visos operacijos (išlaidų pridėjimas, kategorijų valdymas ir t.t.) bus atliekamos šio vartotojo vardu.
            </p>
          </div>
        )}

        <div className="mb-4 sm:mb-6 flex justify-center">
          <MonthYearNavigator
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <ExpenseForm onAddExpense={handleAddExpense} categories={categories} />
          <IncomeTracker
            monthlyIncome={currentMonthIncome}
            totalExpenses={totalExpensesForSelectedMonth}
            previousMonthCarryOver={previousMonthCarryOver}
          />
        </div>

        <div className="space-y-4 sm:space-y-6">
          <ExpenseChart
            expenses={filteredExpenses}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
          <MonthlyLineChart monthlyData={monthlyExpenseTotals} selectedYear={selectedYear} />
          <ExpenseList expenses={filteredExpenses} onDeleteExpense={handleDeleteExpense} />
        </div>
      </div>
    </div>
  );
};

export default Index;
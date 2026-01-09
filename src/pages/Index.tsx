import React, { useState, useEffect, useMemo } from "react";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseList from "@/components/ExpenseList";
import ExpenseChart from "@/components/ExpenseChart";
import IncomeTracker from "@/components/IncomeTracker";
import Sidebar from "@/components/Sidebar";
import { Expense } from "@/types/expense";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const DEFAULT_CATEGORIES = [
  "Maistas", "Kuras", "Pramogos", "Transportas", "Būstas",
  "Komunalinės paslaugos", "Sveikata", "Mokslas", "Apranga", "Kita"
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
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [monthlyIncomes, setMonthlyIncomes] = useState<{ [key: string]: number }>({}); // Pajamos pagal mėnesius (YYYY-MM)
  const [defaultMonthlyIncome, setDefaultMonthlyIncome] = useState<number>(0); // Numatytosios pajamos

  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const currentYear = String(new Date().getFullYear());

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);

  // Load data from localStorage on initial render
  useEffect(() => {
    const storedExpenses = localStorage.getItem("expenses");
    if (storedExpenses) {
      setExpenses(JSON.parse(storedExpenses));
    }

    const storedCategories = localStorage.getItem("categories");
    if (storedCategories) {
      setCategories(JSON.parse(storedCategories));
    } else {
      setCategories(DEFAULT_CATEGORIES);
    }

    const storedMonthlyIncomes = localStorage.getItem("monthlyIncomes");
    if (storedMonthlyIncomes) {
      setMonthlyIncomes(JSON.parse(storedMonthlyIncomes));
    }

    const storedDefaultIncome = localStorage.getItem("defaultMonthlyIncome");
    if (storedDefaultIncome) {
      const parsedIncome = parseFloat(storedDefaultIncome);
      if (!isNaN(parsedIncome)) {
        setDefaultMonthlyIncome(parsedIncome);
      }
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem("categories", JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem("monthlyIncomes", JSON.stringify(monthlyIncomes));
  }, [monthlyIncomes]);

  useEffect(() => {
    localStorage.setItem("defaultMonthlyIncome", defaultMonthlyIncome.toString());
  }, [defaultMonthlyIncome]);

  const handleAddExpense = (newExpense: Expense) => {
    setExpenses((prevExpenses) => [...prevExpenses, newExpense]);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses((prevExpenses) => prevExpenses.filter((expense) => expense.id !== id));
  };

  const handleAddCategory = (newCategory: string) => {
    setCategories((prevCategories) => [...prevCategories, newCategory]);
  };

  const handleDeleteCategory = (categoryToDelete: string) => {
    const expensesWithCategory = expenses.filter(
      (expense) => expense.category === categoryToDelete
    );

    if (expensesWithCategory.length > 0) {
      toast.error(
        `Negalima ištrinti kategorijos "${categoryToDelete}", nes ji naudojama ${expensesWithCategory.length} išlaidose.`
      );
      return;
    }

    setCategories((prevCategories) =>
      prevCategories.filter((cat) => cat !== categoryToDelete)
    );
    toast.success(`Kategorija "${categoryToDelete}" ištrinta.`);
  };

  const handleSaveIncome = (income: number, type: 'default' | 'month', monthYear?: string) => {
    if (type === 'default') {
      setDefaultMonthlyIncome(income);
      toast.success("Numatytosios mėnesio pajamos atnaujintos!");
    } else if (type === 'month' && monthYear) {
      setMonthlyIncomes((prev) => ({
        ...prev,
        [monthYear]: income,
      }));
      toast.success(`Mėnesio ${monthYear} pajamos atnaujintos!`);
    }
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
  const currentMonthIncome = monthlyIncomes[selectedMonthYear] !== undefined
    ? monthlyIncomes[selectedMonthYear]
    : defaultMonthlyIncome;

  const previousMonthCarryOver = useMemo(() => {
    let prevMonth = parseInt(selectedMonth) - 1;
    let prevYear = parseInt(selectedYear);

    if (prevMonth === 0) { // If current month is January, previous month is December of previous year
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
    const previousMonthIncome = monthlyIncomes[prevMonthYear] !== undefined
      ? monthlyIncomes[prevMonthYear]
      : defaultMonthlyIncome;

    return previousMonthIncome - totalExpensesForPreviousMonth;
  }, [expenses, monthlyIncomes, defaultMonthlyIncome, selectedMonth, selectedYear]);


  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <Sidebar
        categories={categories}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
        monthlyIncomes={monthlyIncomes}
        defaultMonthlyIncome={defaultMonthlyIncome}
        onSaveIncome={handleSaveIncome}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        availableYears={availableYears}
      />
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-5xl font-extrabold text-center mb-10">
          Išlaidų Sekiklis
        </h1>

        <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-center">
          <div className="flex-1">
            <Label htmlFor="month-select">Mėnuo</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger id="month-select">
                <SelectValue placeholder="Pasirinkite mėnesį" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label htmlFor="year-select">Metai</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger id="year-select">
                <SelectValue placeholder="Pasirinkite metus" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ExpenseForm onAddExpense={handleAddExpense} categories={categories} />
          <IncomeTracker
            monthlyIncome={currentMonthIncome}
            totalExpenses={totalExpensesForSelectedMonth}
            previousMonthCarryOver={previousMonthCarryOver} // Perduodame naują prop
          />
        </div>

        <ExpenseChart expenses={filteredExpenses} selectedMonth={selectedMonth} selectedYear={selectedYear} />
        <ExpenseList expenses={filteredExpenses} onDeleteExpense={handleDeleteExpense} />
      </div>
    </div>
  );
};

export default Index;
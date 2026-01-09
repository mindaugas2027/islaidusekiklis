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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import MonthYearNavigator from "@/components/MonthYearNavigator";
import { format, lastDayOfMonth, isValid } from "date-fns";

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
  const [monthlyIncomes, setMonthlyIncomes] = useState<{ [key: string]: number }>({});
  const [defaultMonthlyIncome, setDefaultMonthlyIncome] = useState<number>(0);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);

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

    const storedRecurringExpenses = localStorage.getItem("recurringExpenses");
    if (storedRecurringExpenses) {
      setRecurringExpenses(JSON.parse(storedRecurringExpenses));
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

  useEffect(() => {
    localStorage.setItem("recurringExpenses", JSON.stringify(recurringExpenses));
  }, [recurringExpenses]);

  // Logic to automatically add recurring expenses for the selected month/year based on current date
  useEffect(() => {
    const generateAndMergeExpenses = () => {
      const today = new Date();
      const currentActualYear = today.getFullYear();
      const currentActualMonth = String(today.getMonth() + 1).padStart(2, '0');
      const currentActualDay = today.getDate();

      let maxDayToShow = 0;

      if (parseInt(selectedYear) < currentActualYear || (parseInt(selectedYear) === currentActualYear && selectedMonth < currentActualMonth)) {
        // Past month/year: all recurring expenses for this month are considered due
        maxDayToShow = 31; 
      } else if (parseInt(selectedYear) === currentActualYear && selectedMonth === currentActualMonth) {
        // Current month/year: only recurring expenses up to today's date
        maxDayToShow = currentActualDay;
      } else {
        // Future month/year: no recurring expenses are due yet
        maxDayToShow = 0;
      }

      const recurringExpensesForSelectedMonthYear: Expense[] = [];
      const currentMonthYearPrefix = `${selectedYear}-${selectedMonth}`;

      recurringExpenses.forEach(recExpense => {
        if (recExpense.dayOfMonth <= maxDayToShow) {
          const tempDate = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, recExpense.dayOfMonth);
          const actualDay = Math.min(recExpense.dayOfMonth, lastDayOfMonth(tempDate).getDate());
          const expenseDate = format(new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, actualDay), 'yyyy-MM-dd');
          
          recurringExpensesForSelectedMonthYear.push({
            id: `RECURRING-${recExpense.id}-${expenseDate}`, // Unique ID for this instance
            amount: recExpense.amount,
            category: recExpense.category,
            description: recExpense.name,
            date: expenseDate,
          });
        }
      });

      setExpenses(prevExpenses => {
        // Filter out all recurring expenses for the *currently selected month/year*
        // and keep all non-recurring expenses and recurring expenses from *other* months/years.
        const baseExpenses = prevExpenses.filter(exp => 
          !exp.id.startsWith("RECURRING-") || !exp.date.startsWith(currentMonthYearPrefix)
        );
        
        // Merge with the newly generated recurring expenses for the selected month/year
        // This ensures that only the currently due recurring expenses are present.
        return [...baseExpenses, ...recurringExpensesForSelectedMonthYear];
      });
    };

    generateAndMergeExpenses();
  }, [selectedMonth, selectedYear, recurringExpenses]);

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
    const recurringExpensesWithCategory = recurringExpenses.filter(
      (recExpense) => recExpense.category === categoryToDelete
    );

    if (expensesWithCategory.length > 0 || recurringExpensesWithCategory.length > 0) {
      toast.error(
        `Negalima ištrinti kategorijos "${categoryToDelete}", nes ji naudojama išlaidose arba pasikartojančiose išlaidose.`
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

  const handleAddRecurringExpense = (newRecExpense: Omit<RecurringExpense, "id">) => {
    setRecurringExpenses((prev) => [...prev, { ...newRecExpense, id: Date.now().toString() }]);
  };

  const handleDeleteRecurringExpense = (id: string) => {
    setRecurringExpenses((prev) => prev.filter((rec) => rec.id !== id));
    toast.success("Pasikartojanti išlaida sėkmingai ištrinta.");
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
    const previousMonthIncome = monthlyIncomes[prevMonthYear] !== undefined
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


  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
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
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-6xl font-extrabold text-center mb-10 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500 drop-shadow-lg">
          Išlaidų Sekiklis
        </h1>

        <div className="mb-6 flex justify-center">
          <MonthYearNavigator
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ExpenseForm onAddExpense={handleAddExpense} categories={categories} />
          <IncomeTracker
            monthlyIncome={currentMonthIncome}
            totalExpenses={totalExpensesForSelectedMonth}
            previousMonthCarryOver={previousMonthCarryOver}
          />
        </div>

        <ExpenseChart expenses={filteredExpenses} selectedMonth={selectedMonth} selectedYear={selectedYear} />
        <MonthlyLineChart monthlyData={monthlyExpenseTotals} selectedYear={selectedYear} />
        <ExpenseList expenses={filteredExpenses} onDeleteExpense={handleDeleteExpense} />
      </div>
    </div>
  );
};

export default Index;
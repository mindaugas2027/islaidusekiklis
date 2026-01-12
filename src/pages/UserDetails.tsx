import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Expense } from "@/types/expense";
import { format } from "date-fns";
import { ArrowLeft, User, CreditCard, Tag, Calendar, Euro } from "lucide-react";
import ExpenseForm from "@/components/ExpenseForm";
import IncomeTracker from "@/components/IncomeTracker";
import ExpenseChart from "@/components/ExpenseChart";
import MonthlyLineChart from "@/components/MonthlyLineChart";
import MonthYearNavigator from "@/components/MonthYearNavigator";

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  created_at: string;
}

interface MonthlyIncome {
  id: string;
  month_year: string;
  income: number;
  created_at: string;
}

interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
  day_of_month: number;
  created_at: string;
}

const UserDetails = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [monthlyIncomes, setMonthlyIncomes] = useState<MonthlyIncome[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const currentYear = String(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email === 'mindaugas@gmail.com') {
        setIsAdmin(true);
      } else {
        toast.error("Neturite teisės peržiūrėti šio puslapio");
        navigate("/");
      }
    };

    checkAdminStatus();
  }, [navigate]);

  useEffect(() => {
    if (!userId || !isAdmin) return;

    const fetchUserData = async () => {
      setLoading(true);
      try {
        // Fetch user profile using the admin function
        const { data: profileData, error: profileError } = await supabase
          .rpc('get_user_by_id', { user_id: userId });

        if (profileError) {
          console.error("Profile error:", profileError);
        } else if (profileData && profileData.length > 0) {
          setUser(profileData[0]);
        }

        // Fetch expenses
        const { data: expensesData, error: expensesError } = await supabase
          .from('expenses')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false });

        if (expensesError) {
          console.error("Expenses error:", expensesError);
        } else {
          setExpenses(expensesData);
        }

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', userId)
          .order('name');

        if (categoriesError) {
          console.error("Categories error:", categoriesError);
        } else {
          setCategories(categoriesData);
        }

        // Fetch monthly incomes
        const { data: incomesData, error: incomesError } = await supabase
          .from('monthly_incomes')
          .select('*')
          .eq('user_id', userId)
          .order('month_year');

        if (incomesError) {
          console.error("Incomes error:", incomesError);
        } else {
          setMonthlyIncomes(incomesData);
        }

        // Fetch recurring expenses
        const { data: recurringData, error: recurringError } = await supabase
          .from('recurring_expenses')
          .select('*')
          .eq('user_id', userId)
          .order('name');

        if (recurringError) {
          console.error("Recurring expenses error:", recurringError);
        } else {
          setRecurringExpenses(recurringData);
        }

        toast.success("Vartotojo duomenys sėkmingai įkelti");
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Nepavyko įkelti vartotojo duomenų");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, isAdmin]);

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
    : (monthlyIncomes.find(income => income.month_year === 'default')?.income || 0);

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

    return months.map(m => ({
      name: m.label,
      total: parseFloat((monthlyTotals[m.value] || 0).toFixed(2)),
    }));
  }, [expenses, selectedYear]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Įkeliama...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Vartotojas nerastas</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Grįžti į administratoriaus skydelį
          </Button>
          <h1 className="text-2xl xs:text-3xl sm:text-4xl font-extrabold text-center mb-4 sm:mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500 drop-shadow-sm px-2">
            Vartotojo "{user.email}" duomenys
          </h1>
        </div>

        <div className="mb-4 sm:mb-6 flex justify-center">
          <MonthYearNavigator
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-center">Vartotojo informacija</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">El. paštas</span>
                  <span className="font-medium">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vardas</span>
                  <span className="font-medium">{user.first_name || 'Nenurodyta'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pavardė</span>
                  <span className="font-medium">{user.last_name || 'Nenurodyta'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Registracijos data</span>
                  <span className="font-medium">
                    {new Date(user.created_at).toLocaleDateString('lt-LT')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <IncomeTracker
            monthlyIncome={currentMonthIncome}
            totalExpenses={totalExpensesForSelectedMonth}
            previousMonthCarryOver={0} // We'll calculate this later if needed
          />
        </div>

        <div className="space-y-4 sm:space-y-6">
          <ExpenseChart
            expenses={filteredExpenses}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
          <MonthlyLineChart monthlyData={monthlyExpenseTotals} selectedYear={selectedYear} />

          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-center">Visos išlaidos</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredExpenses.length === 0 ? (
                <p className="text-center text-gray-500">Kol kas nėra išlaidų pasirinktam mėnesiui.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Data</TableHead>
                        <TableHead className="whitespace-nowrap">Aprašymas</TableHead>
                        <TableHead className="whitespace-nowrap">Kategorija</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Suma (€)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExpenses
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((expense) => (
                          <TableRow key={expense.id}>
                            <TableCell className="whitespace-nowrap">{expense.date}</TableCell>
                            <TableCell className="max-w-[150px] truncate">{expense.description}</TableCell>
                            <TableCell className="whitespace-nowrap">{expense.category}</TableCell>
                            <TableCell className="text-right whitespace-nowrap">{expense.amount.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-center">Kategorijos</CardTitle>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <p className="text-center text-gray-500">Kol kas nėra kategorijų.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {categories.map((category) => (
                    <Badge key={category.id} variant="secondary" className="justify-center py-1">
                      {category.name}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-center">Pasikartojančios išlaidos</CardTitle>
            </CardHeader>
            <CardContent>
              {recurringExpenses.length === 0 ? (
                <p className="text-center text-gray-500">Kol kas nėra pasikartojančių išlaidų.</p>
              ) : (
                <div className="space-y-3">
                  {recurringExpenses.map((expense) => (
                    <div key={expense.id} className="flex justify-between items-center p-2 border rounded-md">
                      <div>
                        <p className="font-medium">{expense.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {expense.amount.toFixed(2)} € | {expense.category} | {expense.day_of_month} d.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;
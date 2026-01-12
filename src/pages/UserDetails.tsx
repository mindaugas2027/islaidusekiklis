import React, { useState, useEffect } from "react";
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
          // Don't throw error, just set user to null
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

  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  // Get default monthly income
  const defaultIncome = monthlyIncomes.find(income => income.month_year === 'default')?.income || 0;

  // Get current month income
  const currentDate = new Date();
  const currentMonthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthIncome = monthlyIncomes.find(income => income.month_year === currentMonthYear)?.income || defaultIncome;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Grįžti į administratoriaus skydelį
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">Vartotojo informacija</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vartotojo profilis</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pajamos</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Numatytosios pajamos</span>
                  <span className="font-medium">{defaultIncome.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Šio mėnesio pajamos</span>
                  <span className="font-medium">{currentMonthIncome.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Viso pajamų nustatymų</span>
                  <Badge variant="secondary">{monthlyIncomes.length}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Išlaidos</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Viso išlaidų</span>
                  <span className="font-medium">{totalExpenses.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Išlaidų įrašų</span>
                  <Badge variant="secondary">{expenses.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pasikartojančių išlaidų</span>
                  <Badge variant="secondary">{recurringExpenses.length}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Kategorijos</CardTitle>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <p className="text-center text-gray-500">Nėra kategorijų</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
              <CardTitle className="text-lg font-semibold">Pasikartojančios išlaidos</CardTitle>
            </CardHeader>
            <CardContent>
              {recurringExpenses.length === 0 ? (
                <p className="text-center text-gray-500">Nėra pasikartojančių išlaidų</p>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Visos išlaidos</CardTitle>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <p className="text-center text-gray-500">Nėra išlaidų</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Aprašymas</TableHead>
                      <TableHead>Kategorija</TableHead>
                      <TableHead className="text-right">Suma (€)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{format(new Date(expense.date), 'yyyy-MM-dd')}</TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell className="text-right">{expense.amount.toFixed(2)}</TableCell>
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
            <CardTitle className="text-lg font-semibold">Mėnesio pajamų nustatymai</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyIncomes.length === 0 ? (
              <p className="text-center text-gray-500">Nėra pajamų nustatymų</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mėnuo</TableHead>
                      <TableHead className="text-right">Pajamos (€)</TableHead>
                      <TableHead>Sukurta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyIncomes.map((income) => (
                      <TableRow key={income.id}>
                        <TableCell>
                          {income.month_year === 'default' ? 'Numatytosios' : income.month_year}
                        </TableCell>
                        <TableCell className="text-right">{income.income.toFixed(2)}</TableCell>
                        <TableCell>
                          {new Date(income.created_at).toLocaleDateString('lt-LT')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserDetails;
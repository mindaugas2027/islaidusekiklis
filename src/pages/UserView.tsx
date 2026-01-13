import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Euro, Tag, List } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  created_at: string;
}

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  created_at: string;
}

interface Category {
  name: string;
}

interface MonthlyIncome {
  month_year: string;
  income: number;
}

interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
  day_of_month: number;
}

const UserView = () => {
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
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email === 'mindaugas@gmail.com') {
        setIsAdmin(true);
      } else {
        toast.error("Neturite teisės peržiūrėti šio puslapio");
        navigate("/");
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      toast.error("Nepavyko patikrinti vartotojo teisių");
      navigate("/");
    }
  };

  useEffect(() => {
    if (isAdmin && userId) {
      fetchUserData();
    }
  }, [isAdmin, userId]);

  const fetchUserData = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Fetch user profile
      const { data: userData, error: userError } = await supabase.rpc('get_user_by_id', { user_id: userId });
      if (userError) {
        console.error("Error fetching user:", userError);
        toast.error("Nepavyko įkelti vartotojo informacijos");
        return;
      }
      
      if (userData && userData.length > 0) {
        const user = userData[0];
        setUser({
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          created_at: user.created_at
        });
      }

      // Fetch user expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      
      if (expensesError) {
        console.error("Error fetching expenses:", expensesError);
        toast.error("Nepavyko įkelti vartotojo išlaidų");
      } else {
        setExpenses(expensesData || []);
      }

      // Fetch user categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('name')
        .eq('user_id', userId)
        .order('name');
      
      if (categoriesError) {
        console.error("Error fetching categories:", categoriesError);
        toast.error("Nepavyko įkelti vartotojo kategorijų");
      } else {
        setCategories(categoriesData || []);
      }

      // Fetch user monthly incomes
      const { data: incomesData, error: incomesError } = await supabase
        .from('monthly_incomes')
        .select('month_year, income')
        .eq('user_id', userId)
        .order('month_year');
      
      if (incomesError) {
        console.error("Error fetching incomes:", incomesError);
        toast.error("Nepavyko įkelti vartotojo pajamų");
      } else {
        setMonthlyIncomes(incomesData || []);
      }

      // Fetch user recurring expenses
      const { data: recurringData, error: recurringError } = await supabase
        .from('recurring_expenses')
        .select('*')
        .eq('user_id', userId)
        .order('name');
      
      if (recurringError) {
        console.error("Error fetching recurring expenses:", recurringError);
        toast.error("Nepavyko įkelti vartotojo pasikartojančių išlaidų");
      } else {
        setRecurringExpenses(recurringData || []);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Nepavyko įkelti vartotojo duomenų");
    } finally {
      setLoading(false);
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const defaultIncome = monthlyIncomes.find(income => income.month_year === 'default')?.income || 0;
  const specificIncomes = monthlyIncomes.filter(income => income.month_year !== 'default');

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
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <Button 
              onClick={() => navigate("/admin")} 
              variant="outline" 
              className="mb-4 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Grįžti į administratoriaus skydelį
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold">Vartotojo peržiūra</h1>
            <p className="text-muted-foreground">
              Peržiūrite kaip {user.email || user.id}
            </p>
          </div>
          <Button onClick={() => navigate("/")}>Grįžti į pagrindinį</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vardas</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {user.first_name || 'Nėra'} {user.last_name || ''}
              </div>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Išlaidos</CardTitle>
              <List className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expenses.length}</div>
              <p className="text-xs text-muted-foreground">Viso įrašų</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Išlaidų suma</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalExpenses.toFixed(2)} €</div>
              <p className="text-xs text-muted-foreground">Viso išlaidų</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registracija</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {user.created_at ? new Date(user.created_at).toLocaleDateString('lt-LT') : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">Registracijos data</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Kategorijos ({categories.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <p className="text-gray-500">Vartotojas neturi sukurtų kategorijų</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.map((category, index) => (
                    <Badge key={index} variant="secondary">
                      {category.name}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Pajamos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Numatytosios pajamos:</h3>
                  <p className="text-2xl font-bold">{defaultIncome.toFixed(2)} €</p>
                </div>
                
                {specificIncomes.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Specifinės pajamos:</h3>
                    <div className="space-y-2">
                      {specificIncomes.map((income, index) => (
                        <div key={index} className="flex justify-between p-2 border rounded">
                          <span>{income.month_year}</span>
                          <span className="font-medium">{income.income.toFixed(2)} €</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Pasikartojančios išlaidos ({recurringExpenses.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {recurringExpenses.length === 0 ? (
                <p className="text-gray-500">Vartotojas neturi pasikartojančių išlaidų</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pavadinimas</TableHead>
                        <TableHead>Kategorija</TableHead>
                        <TableHead className="text-right">Suma (€)</TableHead>
                        <TableHead className="text-right">Diena</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recurringExpenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell className="font-medium">{expense.name}</TableCell>
                          <TableCell>{expense.category}</TableCell>
                          <TableCell className="text-right">{expense.amount.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{expense.day_of_month}</TableCell>
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
              <CardTitle className="text-xl font-semibold">Visos išlaidos ({expenses.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <p className="text-gray-500">Vartotojas neturi išlaidų</p>
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
        </div>
      </div>
    </div>
  );
};

export default UserView;
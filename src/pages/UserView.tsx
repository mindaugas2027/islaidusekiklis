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
import { useExpenses } from "@/hooks/useExpenses";
import { useCategories } from "@/hooks/useCategories";
import { useMonthlyIncomes } from "@/hooks/useMonthlyIncomes";
import { useRecurringExpenses } from "@/hooks/useRecurringExpenses";
import ExpenseChart from "@/components/ExpenseChart";
import IncomeTracker from "@/components/IncomeTracker";
import ExpenseList from "@/components/ExpenseList";
import MonthlyLineChart from "@/components/MonthlyLineChart";
import MonthYearNavigator from "@/components/MonthYearNavigator";

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

const UserView = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));
  
  // Use the same hooks as regular user view but with impersonated user ID
  const { expenses, loading: expensesLoading, deleteExpense } = useExpenses(userId);
  const { categories, loading: categoriesLoading } = useCategories(userId);
  const { monthlyIncomes, defaultMonthlyIncome } = useMonthlyIncomes(userId);
  const { recurringExpenses, loading: recurringLoading } = useRecurringExpenses(userId);
  
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    checkAdminStatus();
    fetchUserEmail();
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

  const fetchUserEmail = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase.rpc('get_user_by_id', { user_id: userId });
      if (error) {
        console.error("Error fetching user email:", error);
        return;
      }
      
      if (data && data.length > 0) {
        setUserEmail(data[0].email);
      }
    } catch (error) {
      console.error("Error fetching user email:", error);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    await deleteExpense(id);
  };

  const filteredExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    const expenseMonth = String(expenseDate.getMonth() + 1).padStart(2, '0');
    const expenseYear = String(expenseDate.getFullYear());
    return expenseMonth === selectedMonth && expenseYear === selectedYear;
  });

  const totalExpensesForSelectedMonth = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  const selectedMonthYear = `${selectedYear}-${selectedMonth}`;
  const currentMonthIncome = monthlyIncomes[selectedMonthYear] !== undefined && monthlyIncomes[selectedMonthYear] !== null 
    ? monthlyIncomes[selectedMonthYear] 
    : defaultMonthlyIncome;

  const monthlyExpenseTotals = months.map(m => {
    const monthlyTotal = expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        const expenseYear = String(expenseDate.getFullYear());
        return expenseYear === selectedYear && String(expenseDate.getMonth() + 1).padStart(2, '0') === m.value;
      })
      .reduce((sum, expense) => sum + expense.amount, 0);
    
    return {
      name: m.label,
      total: parseFloat(monthlyTotal.toFixed(2))
    };
  });

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Neturite teisės peržiūrėti šio puslapio</p>
      </div>
    );
  }

  if (expensesLoading || categoriesLoading || recurringLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Įkeliama...</p>
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
              Peržiūrate kaip {userEmail || userId}
            </p>
          </div>
          <Button onClick={() => navigate("/")}>Grįžti į pagrindinį</Button>
        </div>

        <div className="mb-6 flex justify-center">
          <MonthYearNavigator 
            selectedMonth={selectedMonth} 
            setSelectedMonth={setSelectedMonth}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Kategorijos ({categories.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <p className="text-gray-500">Vartotojas neturi sukurtų kategorijų</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.map((category, index) => (
                    <Badge key={index} variant="secondary">
                      {category}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Pajamos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Numatytosios pajamos:</h3>
                  <p className="text-2xl font-bold">{defaultMonthlyIncome.toFixed(2)} €</p>
                </div>
                
                {Object.keys(monthlyIncomes).filter(key => key !== 'default').length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Specifinės pajamos:</h3>
                    <div className="space-y-2">
                      {Object.entries(monthlyIncomes)
                        .filter(([key]) => key !== 'default')
                        .map(([monthYear, income], index) => (
                          <div key={index} className="flex justify-between p-2 border rounded">
                            <span>{monthYear}</span>
                            <span className="font-medium">{income.toFixed(2)} €</span>
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
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <List className="h-5 w-5" />
                Pasikartojančios išlaidos ({recurringExpenses.length})
              </CardTitle>
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
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Statistika
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded">
                    <p className="text-sm text-muted-foreground">Išlaidų įrašai</p>
                    <p className="text-2xl font-bold">{expenses.length}</p>
                  </div>
                  <div className="p-4 border rounded">
                    <p className="text-sm text-muted-foreground">Išlaidų suma</p>
                    <p className="text-2xl font-bold">
                      {expenses.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2)} €
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <IncomeTracker 
            monthlyIncome={currentMonthIncome} 
            totalExpenses={totalExpensesForSelectedMonth} 
            previousMonthCarryOver={0} 
          />
          
          <ExpenseChart 
            expenses={filteredExpenses} 
            selectedMonth={selectedMonth} 
            selectedYear={selectedYear} 
          />
          
          <MonthlyLineChart 
            monthlyData={monthlyExpenseTotals} 
            selectedYear={selectedYear} 
          />
          
          <ExpenseList 
            expenses={filteredExpenses} 
            onDeleteExpense={handleDeleteExpense} 
          />
        </div>
      </div>
    </div>
  );
};

export default UserView;
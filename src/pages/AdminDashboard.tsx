import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Expense } from "@/types/expense";
import { format } from "date-fns";

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  created_at: string;
}

interface UserExpense {
  user_id: string;
  user_email: string;
  user_name: string;
  expense: Expense;
}

const AdminDashboard = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [allExpenses, setAllExpenses] = useState<UserExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("users");
  const navigate = useNavigate();

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
    if (isAdmin) {
      fetchUsers();
      fetchAllExpenses();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    if (!isAdmin) return;
    setLoading(true);
    
    try {
      console.log("Attempting to fetch users via function...");
      const { data, error } = await supabase.rpc('get_all_users');
      
      if (error) {
        console.error("Function error:", error);
        toast.error(`Funkcijos klaida: ${error.message}`);
        throw error;
      }
      
      console.log("Users fetched:", data?.length || 0);
      const transformedUsers = data.map((user: any) => ({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        created_at: user.created_at
      }));
      
      console.log("Transformed users:", transformedUsers.length);
      setUsers(transformedUsers);
      toast.success(`Sėkmingai įkelta ${transformedUsers.length} vartotojų`);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error("Nepavyko įkelti vartotojų sąrašo");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllExpenses = async () => {
    if (!isAdmin) return;
    
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*, profiles!inner(email, first_name, last_name)');
      
      if (error) {
        console.error("Error fetching all expenses:", error);
        toast.error("Nepavyko įkelti visų išlaidų");
        return;
      }
      
      const transformedExpenses = data.map((item: any) => ({
        user_id: item.user_id,
        user_email: item.profiles.email,
        user_name: `${item.profiles.first_name || ''} ${item.profiles.last_name || ''}`.trim() || item.profiles.email,
        expense: {
          id: item.id,
          amount: item.amount,
          category: item.category,
          description: item.description,
          date: item.date,
          user_id: item.user_id,
          created_at: item.created_at
        }
      }));
      
      setAllExpenses(transformedExpenses);
      toast.success(`Sėkmingai įkelta ${transformedExpenses.length} išlaidų iš visų vartotojų`);
    } catch (error) {
      console.error("Error fetching all expenses:", error);
      toast.error("Nepavyko įkelti visų išlaidų");
    }
  };

  const impersonateUser = async (userId: string, userEmail: string | null) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        localStorage.setItem('admin_session', JSON.stringify(session));
      }
      
      const impersonationData = {
        id: userId,
        email: userEmail
      };
      
      localStorage.setItem('impersonating_user', JSON.stringify(impersonationData));
      localStorage.setItem('is_impersonating', 'true');
      
      toast.success(`Peržiūrate kaip ${userEmail || userId}. Visos duomenys bus rodomi kaip šio vartotojo.`);
      navigate("/");
    } catch (error: any) {
      console.error("Error impersonating user:", error);
      toast.error("Nepavyko peržiūrėti vartotojo");
    }
  };

  const stopImpersonation = async () => {
    try {
      const adminSessionStr = localStorage.getItem('admin_session');
      if (adminSessionStr) {
        const adminSession = JSON.parse(adminSessionStr);
        await supabase.auth.setSession({
          access_token: adminSession.access_token,
          refresh_token: adminSession.refresh_token
        });
        
        localStorage.removeItem('admin_session');
        localStorage.removeItem('impersonating_user');
        localStorage.removeItem('is_impersonating');
        
        toast.success("Grįžta į administratoriaus paskyrą");
        window.location.reload();
      }
    } catch (error) {
      console.error("Error stopping impersonation:", error);
      toast.error("Nepavyko grįžti į administratoriaus paskyrą");
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      setDeletingUserId(userId);
      const { data, error } = await supabase.functions.invoke('delete_user', {
        body: { user_id: userId }
      });
      
      if (error) {
        console.error("Error calling delete_user function:", error);
        throw new Error(error.message || "Nepavyko ištrinti vartotojo");
      }
      
      if (data?.error) {
        console.error("Function returned error:", data.error);
        throw new Error(data.error);
      }
      
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      toast.success("Vartotojas sėkmingai ištrintas");
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Nepavyko ištrinti vartotojo");
    } finally {
      setDeletingUserId(null);
    }
  };

  useEffect(() => {
    const impersonatingUserStr = localStorage.getItem('impersonating_user');
    if (impersonatingUserStr && isAdmin) {
      const impersonatingUser = JSON.parse(impersonatingUserStr);
      toast.info(`Peržiūrate kaip ${impersonatingUser.email || impersonatingUser.id}`, {
        action: {
          label: "Baigti peržiūrą",
          onClick: stopImpersonation
        }
      });
    }
  }, [isAdmin]);

  if (loading && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Įkeliama...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Neturite teisės peržiūrėti šio puslapio</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Administratoriaus skydelis</h1>
          <div className="flex gap-2">
            <Button onClick={fetchUsers} variant="outline">Atnaujinti vartotojus</Button>
            <Button onClick={fetchAllExpenses} variant="outline">Atnaujinti išlaidas</Button>
            <Button onClick={() => navigate("/")}>Grįžti į pagrindinį</Button>
          </div>
        </div>

        <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Vartotojai</TabsTrigger>
            <TabsTrigger value="expenses">Visos išlaidos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Visi vartotojai ({users.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500 mb-4">Nerasta vartotojų</p>
                    <Button onClick={fetchUsers} variant="outline">
                      Bandyti dar kartą
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>El. paštas</TableHead>
                          <TableHead>Vardas</TableHead>
                          <TableHead>Pavardė</TableHead>
                          <TableHead>Registracijos data</TableHead>
                          <TableHead>Veiksmai</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.email || 'N/A'}</TableCell>
                            <TableCell>{user.first_name || 'Nėra'}</TableCell>
                            <TableCell>{user.last_name || 'Nėra'}</TableCell>
                            <TableCell>
                              {user.created_at ? new Date(user.created_at).toLocaleDateString('lt-LT') : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => impersonateUser(user.id, user.email)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Peržiūrėti
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Ar tikrai norite ištrinti vartotoją?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Šis veiksmas negrįžtamas. Bus ištrinti visi vartotojo duomenys, įskaitant išlaidas, kategorijas ir kitą informaciją.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Atšaukti</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => deleteUser(user.id)} 
                                        disabled={deletingUserId === user.id}
                                      >
                                        {deletingUserId === user.id ? "Trinama..." : "Patvirtinti"}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="expenses">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Visos išlaidos ({allExpenses.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {allExpenses.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500 mb-4">Nerasta išlaidų</p>
                    <Button onClick={fetchAllExpenses} variant="outline">
                      Bandyti dar kartą
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Vartotojas</TableHead>
                          <TableHead>Aprašymas</TableHead>
                          <TableHead>Kategorija</TableHead>
                          <TableHead className="text-right">Suma (€)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allExpenses
                          .sort((a, b) => new Date(b.expense.date).getTime() - new Date(a.expense.date).getTime())
                          .map((item) => (
                            <TableRow key={item.expense.id}>
                              <TableCell>{format(new Date(item.expense.date), 'yyyy-MM-dd')}</TableCell>
                              <TableCell>
                                <div className="font-medium">{item.user_email}</div>
                                <div className="text-sm text-muted-foreground">{item.user_name}</div>
                              </TableCell>
                              <TableCell>{item.expense.description}</TableCell>
                              <TableCell>{item.expense.category}</TableCell>
                              <TableCell className="text-right">{item.expense.amount.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
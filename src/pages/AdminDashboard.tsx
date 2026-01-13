import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  created_at: string;
}

const AdminDashboard = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
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
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    if (!isAdmin) return;
    setLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('get_all_users');
      
      if (error) {
        console.error("Function error:", error);
        toast.error(`Funkcijos klaida: ${error.message}`);
        throw error;
      }
      
      const transformedUsers = data.map((user: any) => ({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        created_at: user.created_at
      }));
      
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

  const viewUser = (userId: string) => {
    navigate(`/user/${userId}`);
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
            <Button onClick={() => navigate("/")}>Grįžti į pagrindinį</Button>
          </div>
        </div>

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
                              onClick={() => viewUser(user.id)}
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
      </div>
    </div>
  );
};

export default AdminDashboard;
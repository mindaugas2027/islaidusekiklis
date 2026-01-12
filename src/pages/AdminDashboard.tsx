import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.email === 'mindaugas@gmail.com') {
        setIsAdmin(true);
        fetchUsers();
      } else {
        toast.error("Neturite teisės peržiūrėti šio puslapio");
        navigate("/");
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      toast.error("Nepavyko patikrinti vartotojo teisių");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      console.log("Attempting to fetch users...");
      
      // Get all users from auth
      const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error("Auth error:", authError);
        toast.error(`Auth klaida: ${authError.message}`);
        throw authError;
      }
      
      console.log("Auth users fetched:", authUsers?.length || 0);
      
      // Get profile data for all users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) {
        console.error("Profiles error:", profilesError);
        toast.error(`Profilio klaida: ${profilesError.message}`);
        throw profilesError;
      }

      console.log("Profiles fetched:", profiles?.length || 0);

      // Combine auth data with profile data
      const usersWithProfiles = authUsers.map(authUser => {
        const profile = profiles.find(p => p.id === authUser.id) || {
          id: authUser.id,
          first_name: null,
          last_name: null,
          created_at: authUser.created_at
        };
        
        return {
          ...profile,
          email: authUser.email
        };
      });

      console.log("Combined users:", usersWithProfiles.length);
      setUsers(usersWithProfiles);
      toast.success(`Sėkmingai įkelta ${usersWithProfiles.length} vartotojų`);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error("Nepavyko įkelti vartotojų sąrašo");
      // Set empty array to show UI even on error
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const impersonateUser = async (userId: string) => {
    toast.info("Funkcionalumas dar neįgyvendintas", {
      description: "Vartotojo peržiūros režimas bus įgyvendintas vėliau"
    });
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
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Administratoriaus skydelis</h1>
          <Button onClick={() => navigate("/")}>Grįžti į pagrindinį</Button>
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
                          {user.created_at 
                            ? new Date(user.created_at).toLocaleDateString('lt-LT') 
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => impersonateUser(user.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Peržiūrėti
                            </Button>
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
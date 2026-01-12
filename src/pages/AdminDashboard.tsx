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
      console.log("Attempting to fetch users via function...");
      // Use the secure function instead of admin API
      const { data, error } = await supabase.rpc('get_all_users');
      if (error) {
        console.error("Function error:", error);
        toast.error(`Funkcijos klaida: ${error.message}`);
        throw error;
      }
      console.log("Users fetched:", data?.length || 0);
      // Transform the data to match our interface
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
      // Set empty array to show UI even on error
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const impersonateUser = async (userId: string, userEmail: string | null) => {
    try {
      // Store the admin session in localStorage
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        localStorage.setItem('admin_session', JSON.stringify(session));
      }
      
      // Store impersonation info
      const impersonationData = {
        id: userId,
        email: userEmail
      };
      localStorage.setItem('impersonating_user', JSON.stringify(impersonationData));
      
      // Set a flag to indicate we're impersonating
      localStorage.setItem('is_impersonating', 'true');
      
      toast.success(`Peržiūrite kaip ${userEmail || userId}`);
      navigate("/");
    } catch (error: any) {
      console.error("Error impersonating user:", error);
      toast.error("Nepavyko peržiūrėti vartotojo");
    }
  };

  const stopImpersonation = async () => {
    try {
      // Get the admin session from localStorage
      const adminSessionStr = localStorage.getItem('admin_session');
      if (adminSessionStr) {
        const adminSession = JSON.parse(adminSessionStr);
        // Restore admin session
        await supabase.auth.setSession({
          access_token: adminSession.access_token,
          refresh_token: adminSession.refresh_token
        });
        // Clear impersonation data
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

  // Check if we're impersonating a user
  useEffect(() => {
    const impersonatingUserStr = localStorage.getItem('impersonating_user');
    if (impersonatingUserStr) {
      const impersonatingUser = JSON.parse(impersonatingUserStr);
      toast.info(`Peržiūrite kaip ${impersonatingUser.email || impersonatingUser.id}`, {
        action: {
          label: "Baigti peržiūrą",
          onClick: stopImpersonation
        }
      });
    }
  }, []);

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
          <div className="flex gap-2">
            <Button onClick={fetchUsers} variant="outline">Atnaujinti</Button>
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
                            <Button variant="outline" size="sm" onClick={() => impersonateUser(user.id, user.email)}>
                              <Eye className="h-4 w-4 mr-1" /> Peržiūrėti
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
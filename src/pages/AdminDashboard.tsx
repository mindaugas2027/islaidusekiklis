import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, User } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface UserRole {
  id: string;
  role: string;
  subscription_type: string;
  created_at: string;
  user?: {
    email?: string;
  } | null;
}

const AdminDashboard = () => {
  const [users, setUsers] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          id,
          role,
          subscription_type,
          created_at,
          auth.users (email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Properly type the response data
      const usersData = data as unknown as UserRole[];
      setUsers(usersData);
    } catch (error) {
      toast.error("Nepavyko įkelti vartotojų sąrašo");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const impersonateUser = async (userId: string) => {
    toast.info("Funkcionalumas dar neįgyvendintas", {
      description: "Vartotojo peržiūros režimas bus įgyvendintas vėliau"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Įkeliama...</p>
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
            <CardTitle className="text-xl font-semibold">Visi vartotojai</CardTitle>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Nerasta vartotojų</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>El. paštas</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Prenumeratos tipas</TableHead>
                      <TableHead>Registracijos data</TableHead>
                      <TableHead>Veiksmai</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.user?.email || 'N/A'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin' 
                              ? 'bg-red-100 text-red-800' 
                              : user.subscription_type === 'paid' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role === 'admin' ? 'Administratorius' : 
                             user.subscription_type === 'paid' ? 'Mokamas vartotojas' : 'Vartotojas'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {user.subscription_type === 'paid' ? 'Mokama' : 'Nemokama'}
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString('lt-LT')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => impersonateUser(user.id)}
                              disabled={user.role === 'admin'}
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
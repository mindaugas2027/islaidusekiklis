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
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // First, let's just get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error("Profiles error:", profilesError);
        throw profilesError;
      }

      // Then get auth user data for each profile
      const usersWithAuthData = await Promise.all(
        profiles.map(async (profile) => {
          try {
            const { data: { user }, error } = await supabase.auth.admin.getUserById(profile.id);
            if (error) {
              console.error(`Error fetching user ${profile.id}:`, error);
              return {
                ...profile,
                email: null
              };
            }
            return {
              ...profile,
              email: user?.email || null
            };
          } catch (err) {
            console.error(`Error fetching user ${profile.id}:`, err);
            return {
              ...profile,
              email: null
            };
          }
        })
      );

      setUsers(usersWithAuthData);
    } catch (error) {
      toast.error("Nepavyko įkelti vartotojų sąrašo");
      console.error("Error fetching users:", error);
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
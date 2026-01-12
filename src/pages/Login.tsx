import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (isSignUp) {
        result = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });
      } else {
        result = await supabase.auth.signInWithPassword({
          email,
          password
        });
      }

      if (result.error) {
        toast.error(result.error.message);
      } else if (isSignUp) {
        toast.success("Registracija sėkminga! Patikrinkite el. paštą patvirtinimui.");
        setIsSignUp(false);
      } else {
        toast.success("Sėkmingai prisijungėte!");
        navigate("/");
      }
    } catch (error) {
      toast.error("Įvyko netikėta klaida. Bandykite dar kartą.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
            {isSignUp ? "Registracija" : "Prisijungimas"}
          </CardTitle>
          <CardDescription className="text-center">
            {isSignUp 
              ? "Susikurkite naują paskyrą" 
              : "Prisijunkite prie savo paskyros"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">El. pašto adresas</Label>
              <Input
                id="email"
                type="email"
                placeholder="iveskite@pastas.lt"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Slaptažodis</Label>
              <Input
                id="password"
                type="password"
                placeholder="Įveskite slaptažodį"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading 
                ? (isSignUp ? "Registruojamasi..." : "Prisijungiama...") 
                : (isSignUp ? "Registruotis" : "Prisijungti")}
            </Button>
          </form>

          <div className="text-center text-sm">
            {isSignUp ? (
              <p>
                Jau turite paskyrą?{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className="text-primary hover:underline font-medium"
                >
                  Prisijungti
                </button>
              </p>
            ) : (
              <p>
                Neturite paskyros?{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className="text-primary hover:underline font-medium"
                >
                  Susikurkite čia
                </button>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import UserView from "./pages/UserView";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [impersonatingUser, setImpersonatingUser] = useState(null);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);

      // Check if we're impersonating a user
      const impersonating = localStorage.getItem('is_impersonating') === 'true';
      setIsImpersonating(impersonating);

      // Get impersonating user info
      const impersonatingUserStr = localStorage.getItem('impersonating_user');
      if (impersonatingUserStr) {
        try {
          setImpersonatingUser(JSON.parse(impersonatingUserStr));
        } catch (e) {
          console.error("Error parsing impersonating user:", e);
        }
      }

      // Check if current user is admin
      if (session?.user?.email === 'mindaugas@gmail.com') {
        setIsAdmin(true);
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);

      // Check if we're impersonating a user
      const impersonating = localStorage.getItem('is_impersonating') === 'true';
      setIsImpersonating(impersonating);

      // Get impersonating user info
      const impersonatingUserStr = localStorage.getItem('impersonating_user');
      if (impersonatingUserStr) {
        try {
          setImpersonatingUser(JSON.parse(impersonatingUserStr));
        } catch (e) {
          console.error("Error parsing impersonating user:", e);
        }
      }

      // Check if current user is admin
      if (session?.user?.email === 'mindaugas@gmail.com') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

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
        setIsImpersonating(false);
        setImpersonatingUser(null);
        window.location.reload();
      }
    } catch (error) {
      console.error("Error stopping impersonation:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Įkeliama...</p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        {isImpersonating && impersonatingUser && isAdmin && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1">
              <User className="h-4 w-4" />
              <span>Peržiūri: {impersonatingUser.email || impersonatingUser.id}</span>
            </Badge>
            <Button variant="destructive" onClick={stopImpersonation} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Baigti peržiūrą
            </Button>
          </div>
        )}

        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
            <Route path="/admin" element={session && isAdmin ? <AdminDashboard /> : <Navigate to="/login" />} />
            <Route path="/user/:userId" element={session && isAdmin ? <UserView /> : <Navigate to="/login" />} />
            <Route path="/" element={session ? <Index /> : <Navigate to="/login" />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
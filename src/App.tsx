import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner"; // Import toast for notifications

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [impersonatingUser, setImpersonatingUser] = useState<{ id: string; email: string } | null>(null);

  const location = useLocation(); // Get location object

  useEffect(() => {
    const updateAuthAndImpersonationState = async () => {
      setLoading(true);
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);

      // Check admin status
      if (currentSession) {
        const { data: adminStatus, error } = await supabase.rpc('is_admin');
        if (error) {
          console.error("[App] Error checking admin status:", error);
          setIsAdmin(false);
        } else {
          setIsAdmin(adminStatus === true);
        }
      } else {
        setIsAdmin(false);
      }

      // Check impersonation status from localStorage
      const impersonating = localStorage.getItem('is_impersonating') === 'true';
      setIsImpersonating(impersonating);

      const impersonatingUserStr = localStorage.getItem('impersonating_user');
      if (impersonatingUserStr) {
        try {
          setImpersonatingUser(JSON.parse(impersonatingUserStr));
        } catch (e) {
          console.error("[App] Error parsing impersonating user:", e);
          setImpersonatingUser(null);
        }
      } else {
        setImpersonatingUser(null);
      }
      setLoading(false);
    };

    updateAuthAndImpersonationState(); // Initial load and on location change

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      // This listener handles changes to the actual Supabase session
      // When session changes, we re-evaluate everything
      updateAuthAndImpersonationState(); 
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [location.pathname]); // Re-run this effect when the path changes

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
        
        // After restoring admin session, the onAuthStateChange listener will fire
        // and updateAuthAndImpersonationState will be called, refreshing the UI.
        toast.success("Grįžta į administratoriaus paskyrą");
      }
    } catch (error) {
      console.error("[App] Error stopping impersonation:", error);
      toast.error("Nepavyko grįžti į administratoriaus paskyrą");
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
            <Route path="/admin" element={session && isAdmin ? <AdminDashboard /> : <Navigate to="/" />} />
            <Route path="/" element={session ? <Index impersonatedUserId={isImpersonating ? impersonatingUser?.id : undefined} /> : <Navigate to="/login" />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
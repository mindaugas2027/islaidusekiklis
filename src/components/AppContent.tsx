import { useEffect, useState, useRef } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
import AdminDashboard from "@/pages/AdminDashboard";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const AppContent = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [impersonatingUser, setImpersonatingUser] = useState<{ id: string; email: string } | null>(null);

  const location = useLocation();
  const mounted = useRef(false); // Ref to track if the component is mounted

  useEffect(() => {
    mounted.current = true; // Set to true when component mounts

    const updateAuthAndImpersonationState = async () => {
      setLoading(true);
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!mounted.current) return; // Prevent state update if component unmounted
      setSession(currentSession);

      if (currentSession) {
        const { data: adminStatus, error } = await supabase.rpc('is_admin');
        if (!mounted.current) return; // Prevent state update if component unmounted
        if (error) {
          console.error("[AppContent] Error checking admin status:", error);
          setIsAdmin(false);
        } else {
          setIsAdmin(adminStatus === true);
        }
      } else {
        if (!mounted.current) return; // Prevent state update if component unmounted
        setIsAdmin(false);
      }

      if (!mounted.current) return; // Prevent state update if component unmounted
      const impersonating = localStorage.getItem('is_impersonating') === 'true';
      setIsImpersonating(impersonating);

      const impersonatingUserStr = localStorage.getItem('impersonating_user');
      if (impersonatingUserStr) {
        try {
          const parsedUser = JSON.parse(impersonatingUserStr);
          if (!mounted.current) return; // Prevent state update if component unmounted
          setImpersonatingUser(parsedUser);
        } catch (e) {
          console.error("[AppContent] Error parsing impersonating user:", e);
          if (!mounted.current) return; // Prevent state update if component unmounted
          setImpersonatingUser(null);
        }
      } else {
        if (!mounted.current) return; // Prevent state update if component unmounted
        setImpersonatingUser(null);
      }
      if (!mounted.current) return; // Prevent state update if component unmounted
      setLoading(false);
    };

    updateAuthAndImpersonationState();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted.current) return; // Prevent update if component unmounted
      updateAuthAndImpersonationState(); 
    });

    return () => {
      mounted.current = false; // Set to false when component unmounts
      authListener.subscription.unsubscribe();
    };
  }, [location.pathname]);

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
      }
    } catch (error) {
      console.error("[AppContent] Error stopping impersonation:", error);
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
    <>
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

      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
        <Route path="/admin" element={session && isAdmin ? <AdminDashboard /> : <Navigate to="/" />} />
        <Route path="/" element={session ? <Index impersonatedUserId={isImpersonating ? impersonatingUser?.id : undefined} /> : <Navigate to="/login" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default AppContent;
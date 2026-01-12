import React, { useEffect, useState } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        navigate("/");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Prisijungimas</CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            Prisijunkite prie savo paskyros
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Auth
            supabaseClient={supabase}
            providers={[]}
            redirectTo={`${window.location.origin}/`}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: "hsl(var(--primary))",
                    brandAccent: "hsl(var(--primary-foreground))",
                    defaultButtonBackground: "hsl(var(--secondary))",
                    defaultButtonBackgroundHover: "hsl(var(--secondary))",
                    defaultButtonText: "hsl(var(--secondary-foreground))",
                    anchorTextColor: "hsl(var(--primary))",
                    anchorTextHoverColor: "hsl(var(--primary-foreground))",
                    inputBackground: "hsl(var(--background))",
                    inputBorderFocus: "hsl(var(--primary))",
                    inputLabelText: "hsl(var(--foreground))",
                    inputPlaceholder: "hsl(var(--muted-foreground))",
                  },
                  fontSizes: {
                    baseInputSize: "14px",
                  },
                  space: {
                    buttonPadding: "8px 16px",
                    labelBottomMargin: "8px",
                  },
                  radii: {
                    borderRadiusButton: "6px",
                    buttonBorderRadius: "6px",
                    inputBorderRadius: "6px",
                  },
                },
              },
            }}
            theme="light"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
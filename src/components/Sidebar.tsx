import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Settings, LogOut, Users } from "lucide-react";
import CategoryManager from "./CategoryManager";
import MonthlyBudgetSettings from "./MonthlyBudgetSettings";
import RecurringExpenseManager from "./RecurringExpenseManager";
import { RecurringExpense } from "@/types/recurringExpense";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface SidebarProps {
  categories: string[];
  onAddCategory: (category: string) => Promise<void>;
  onDeleteCategory: (category: string) => Promise<void>;
  monthlyIncomes: { [key: string]: number };
  defaultMonthlyIncome: number;
  onSaveIncome: (income: number, type: 'default' | 'month', monthYear?: string) => void;
  recurringExpenses: RecurringExpense[];
  onAddRecurringExpense: (expense: Omit<RecurringExpense, "id">) => void;
  onDeleteRecurringExpense: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  categories,
  onAddCategory,
  onDeleteCategory,
  monthlyIncomes,
  defaultMonthlyIncome,
  onSaveIncome,
  recurringExpenses,
  onAddRecurringExpense,
  onDeleteRecurringExpense,
}) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data, error } = await supabase.rpc('is_admin');
      if (error) {
        console.error("[Sidebar] Error checking admin status:", error);
        setIsAdmin(false);
      } else {
        setIsAdmin(data === true);
      }
    };

    checkAdminStatus();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Nepavyko atsijungti");
      console.error(error);
    } else {
      toast.success("Sėkmingai atsijungta");
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="fixed top-4 left-4 z-50">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Atidaryti nustatymus</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-2xl sm:text-3xl font-bold text-center">Nustatymai</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {isAdmin && (
            <Button
              variant="outline"
              className="w-full flex items-center justify-start gap-2"
              onClick={() => navigate("/admin")}
            >
              <Users className="h-5 w-5" />
              <span>Visi vartotojai</span>
            </Button>
          )}
          <CategoryManager
            categories={categories}
            onAddCategory={onAddCategory}
            onDeleteCategory={onDeleteCategory}
          />
          <MonthlyBudgetSettings
            monthlyIncomes={monthlyIncomes}
            defaultMonthlyIncome={defaultMonthlyIncome}
            onSaveIncome={onSaveIncome}
          />
          <RecurringExpenseManager
            recurringExpenses={recurringExpenses}
            categories={categories}
            onAddRecurringExpense={onAddRecurringExpense}
            onDeleteRecurringExpense={onDeleteRecurringExpense}
          />
          <Button variant="destructive" className="w-full mt-4" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Atsijungti
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default Sidebar;
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Expense } from "@/types/expense";
import { toast } from "sonner";

export const useExpenses = (userId?: string) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const getTargetUserId = useCallback(async () => {
    // If userId is provided, use it (for impersonation)
    if (userId) return userId;
    
    // Otherwise get current user
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
  }, [userId]);

  const refreshExpenses = useCallback(async () => {
    setLoading(true);
    const targetUserId = await getTargetUserId();
    
    if (!targetUserId) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    // Fetch expenses for the target user
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', targetUserId)
      .order('date', { ascending: false });

    if (error) {
      toast.error("Nepavyko įkelti išlaidų");
      console.error(error);
    } else {
      setExpenses(data as Expense[]);
    }
    setLoading(false);
  }, [getTargetUserId]);

  useEffect(() => {
    refreshExpenses();
    
    // Set up real-time subscription for the target user
    const setupSubscription = async () => {
      const targetUserId = await getTargetUserId();
      if (!targetUserId) return;
      
      const channel = supabase
        .channel('expenses-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'expenses',
            filter: `user_id=eq.${targetUserId}`
          },
          (payload) => {
            refreshExpenses();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'expenses',
            filter: `user_id=eq.${targetUserId}`
          },
          (payload) => {
            refreshExpenses();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'expenses',
            filter: `user_id=eq.${targetUserId}`
          },
          (payload) => {
            refreshExpenses();
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    };
    
    setupSubscription();
  }, [refreshExpenses, getTargetUserId]);

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    const targetUserId = await getTargetUserId();
    if (!targetUserId) {
      toast.error("Nepavyko pridėti išlaidos - nėra vartotojo");
      return null;
    }

    // Optimistically update UI
    const tempId = `temp-${Date.now()}`;
    const tempExpense: Expense = {
      ...expense,
      id: tempId,
      user_id: targetUserId,
      created_at: new Date().toISOString()
    };
    setExpenses(prevExpenses => [tempExpense, ...prevExpenses]);

    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert([{ ...expense, user_id: targetUserId }])
        .select()
        .single();

      if (error) {
        // Revert optimistic update on error
        setExpenses(prevExpenses => prevExpenses.filter(exp => exp.id !== tempId));
        toast.error("Nepavyko pridėti išlaidos");
        console.error(error);
        return null;
      }

      // Replace temporary expense with actual data from backend
      setExpenses(prevExpenses => {
        const withoutTemp = prevExpenses.filter(exp => exp.id !== tempId);
        return [data as Expense, ...withoutTemp];
      });
      
      toast.success("Išlaida sėkmingai pridėta!");
      return data as Expense;
    } catch (error) {
      // Revert optimistic update on error
      setExpenses(prevExpenses => prevExpenses.filter(exp => exp.id !== tempId));
      toast.error("Nepavyko pridėti išlaidos");
      console.error(error);
      return null;
    }
  };

  const deleteExpense = async (id: string) => {
    // Optimistically update UI
    setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== id));

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) {
      // Revert optimistic update on error
      refreshExpenses();
      toast.error("Nepavyko ištrinti išlaidos");
      console.error(error);
      return false;
    }
    
    toast.success("Išlaida sėkmingai ištrinta.");
    return true;
  };

  // New function to get monthly total for a specific month
  const getMonthlyTotal = async (monthYear: string) => {
    const targetUserId = await getTargetUserId();
    if (!targetUserId) return 0;
    
    const { data, error } = await supabase
      .rpc('calculate_monthly_total', {
        user_id: targetUserId,
        month_year: monthYear
      });
      
    if (error) {
      console.error('Error calculating monthly total:', error);
      return 0;
    }
    
    return data || 0;
  };

  // New function to get category total for a specific month
  const getCategoryTotal = async (category: string, monthYear: string) => {
    const targetUserId = await getTargetUserId();
    if (!targetUserId) return 0;
    
    const { data, error } = await supabase
      .rpc('calculate_category_total', {
        user_id: targetUserId,
        category_name: category,
        month_year: monthYear
      });
      
    if (error) {
      console.error('Error calculating category total:', error);
      return 0;
    }
    
    return data || 0;
  };

  return {
    expenses,
    loading,
    addExpense,
    deleteExpense,
    refreshExpenses,
    getMonthlyTotal,
    getCategoryTotal
  };
};
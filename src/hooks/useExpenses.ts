import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Expense } from "@/types/expense";
import { toast } from "sonner";

export const useExpenses = (impersonatedUserIdFromProps?: string) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const getEffectiveUserId = useCallback(async () => {
    console.log("[useExpenses] getEffectiveUserId called. impersonatedUserIdFromProps:", impersonatedUserIdFromProps);
    if (impersonatedUserIdFromProps) {
      console.log("[useExpenses] Returning impersonatedUserIdFromProps:", impersonatedUserIdFromProps);
      return impersonatedUserIdFromProps;
    }
    const { data: { user } } = await supabase.auth.getUser();
    console.log("[useExpenses] No impersonated ID. Falling back to supabase.auth.getUser(). User ID:", user?.id);
    return user?.id;
  }, [impersonatedUserIdFromProps]);

  const refreshExpenses = useCallback(async () => {
    setLoading(true);
    const targetUserId = await getEffectiveUserId();
    console.log("[useExpenses] refreshExpenses using targetUserId:", targetUserId);
    
    if (!targetUserId) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', targetUserId)
      .order('date', { ascending: false });

    if (error) {
      toast.error("Nepavyko įkelti išlaidų");
      console.error("[useExpenses] Error loading expenses:", error);
    } else {
      setExpenses(data as Expense[]);
      console.log("[useExpenses] Loaded expenses for user:", targetUserId, data);
    }
    setLoading(false);
  }, [getEffectiveUserId]);

  useEffect(() => {
    refreshExpenses();
    
    const setupSubscription = async () => {
      const targetUserId = await getEffectiveUserId();
      console.log("[useExpenses] Setting up subscription for targetUserId:", targetUserId);
      
      if (!targetUserId) return;
      
      const channel = supabase
        .channel(`expenses-changes-${targetUserId}`) // Unique channel name per user
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'expenses', filter: `user_id=eq.${targetUserId}` },
          (payload) => {
            console.log("[useExpenses] Realtime INSERT event:", payload);
            refreshExpenses();
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'expenses', filter: `user_id=eq.${targetUserId}` },
          (payload) => {
            console.log("[useExpenses] Realtime UPDATE event:", payload);
            refreshExpenses();
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'expenses', filter: `user_id=eq.${targetUserId}` },
          (payload) => {
            console.log("[useExpenses] Realtime DELETE event:", payload);
            refreshExpenses();
          }
        )
        .subscribe();
      
      return () => {
        console.log("[useExpenses] Unsubscribing from channel:", `expenses-changes-${targetUserId}`);
        supabase.removeChannel(channel);
      };
    };
    
    setupSubscription();
  }, [refreshExpenses, getEffectiveUserId]);

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    const targetUserId = await getEffectiveUserId();
    console.log("[useExpenses] addExpense using targetUserId:", targetUserId);
    
    if (!targetUserId) {
      toast.error("Nepavyko pridėti išlaidos - nėra vartotojo");
      return null;
    }
    
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
        setExpenses(prevExpenses => prevExpenses.filter(exp => exp.id !== tempId));
        toast.error("Nepavyko pridėti išlaidos");
        console.error("[useExpenses] Error adding expense:", error);
        return null;
      }

      setExpenses(prevExpenses => {
        const withoutTemp = prevExpenses.filter(exp => exp.id !== tempId);
        return [data as Expense, ...withoutTemp];
      });
      
      toast.success("Išlaida sėkmingai pridėta!");
      return data as Expense;
    } catch (error) {
      setExpenses(prevExpenses => prevExpenses.filter(exp => exp.id !== tempId));
      toast.error("Nepavyko pridėti išlaidos");
      console.error("[useExpenses] Unexpected error adding expense:", error);
      return null;
    }
  };

  const deleteExpense = async (id: string) => {
    const targetUserId = await getEffectiveUserId();
    console.log("[useExpenses] deleteExpense using targetUserId:", targetUserId);

    if (!targetUserId) {
      toast.error("Nepavyko ištrinti išlaidos - nėra vartotojo");
      return false;
    }

    setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== id));

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', targetUserId); // Ensure RLS is respected

      if (error) {
        refreshExpenses();
        toast.error("Nepavyko ištrinti išlaidos");
        console.error("[useExpenses] Error deleting expense:", error);
        return false;
      }
      
      toast.success("Išlaida sėkmingai ištrinta.");
      return true;
    } catch (error) {
      refreshExpenses();
      toast.error("Nepavyko ištrinti išlaidos");
      console.error("[useExpenses] Unexpected error deleting expense:", error);
      return false;
    }
  };

  const getMonthlyTotal = async (monthYear: string) => {
    const targetUserId = await getEffectiveUserId();
    console.log("[useExpenses] getMonthlyTotal using targetUserId:", targetUserId);
    
    if (!targetUserId) return 0;

    const { data, error } = await supabase
      .rpc('calculate_monthly_total', { user_id: targetUserId, month_year: monthYear });

    if (error) {
      console.error('[useExpenses] Error calculating monthly total:', error);
      return 0;
    }
    
    return data || 0;
  };

  const getCategoryTotal = async (category: string, monthYear: string) => {
    const targetUserId = await getEffectiveUserId();
    console.log("[useExpenses] getCategoryTotal using targetUserId:", targetUserId);
    
    if (!targetUserId) return 0;

    const { data, error } = await supabase
      .rpc('calculate_category_total', { user_id: targetUserId, category_name: category, month_year: monthYear });

    if (error) {
      console.error('[useExpenses] Error calculating category total:', error);
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
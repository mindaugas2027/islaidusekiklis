import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Expense } from "@/types/expense";
import { toast } from "sonner";

export const useExpenses = (impersonatedUserId?: string) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const getEffectiveUserId = useCallback(async () => {
    if (impersonatedUserId) {
      return impersonatedUserId;
    }
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
  }, [impersonatedUserId]);

  const refreshExpenses = useCallback(async () => {
    setLoading(true);
    const targetUserId = await getEffectiveUserId();
    
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
      console.error(error);
    } else {
      setExpenses(data as Expense[]);
    }
    setLoading(false);
  }, [getEffectiveUserId]);

  useEffect(() => {
    refreshExpenses();
    
    const setupSubscription = async () => {
      const targetUserId = await getEffectiveUserId();
      
      if (!targetUserId) return;
      
      const channel = supabase
        .channel('expenses-changes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'expenses', filter: `user_id=eq.${targetUserId}` },
          (payload) => {
            refreshExpenses();
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'expenses', filter: `user_id=eq.${targetUserId}` },
          (payload) => {
            refreshExpenses();
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'expenses', filter: `user_id=eq.${targetUserId}` },
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
  }, [refreshExpenses, getEffectiveUserId]);

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    const targetUserId = await getEffectiveUserId();
    
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
        console.error(error);
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
      console.error(error);
      return null;
    }
  };

  const deleteExpense = async (id: string) => {
    setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== id));

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) {
      refreshExpenses();
      toast.error("Nepavyko ištrinti išlaidos");
      console.error(error);
      return false;
    }
    
    toast.success("Išlaida sėkmingai ištrinta.");
    return true;
  };

  const getMonthlyTotal = async (monthYear: string) => {
    const targetUserId = await getEffectiveUserId();
    
    if (!targetUserId) return 0;

    const { data, error } = await supabase
      .rpc('calculate_monthly_total', { user_id: targetUserId, month_year: monthYear });

    if (error) {
      console.error('Error calculating monthly total:', error);
      return 0;
    }
    
    return data || 0;
  };

  const getCategoryTotal = async (category: string, monthYear: string) => {
    const targetUserId = await getEffectiveUserId();
    
    if (!targetUserId) return 0;

    const { data, error } = await supabase
      .rpc('calculate_category_total', { user_id: targetUserId, category_name: category, month_year: monthYear });

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
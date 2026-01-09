import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Expense } from "@/types/expense";
import { toast } from "sonner";

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshExpenses = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      toast.error("Nepavyko įkelti išlaidų");
      console.error(error);
    } else {
      setExpenses(data as Expense[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshExpenses();
    
    const channel = supabase
      .channel('expenses-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'expenses' },
        (payload) => {
          refreshExpenses();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'expenses' },
        (payload) => {
          refreshExpenses();
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'expenses' },
        (payload) => {
          refreshExpenses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshExpenses]);

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    const { data, error } = await supabase
      .from('expenses')
      .insert([expense])
      .select()
      .single();

    if (error) {
      toast.error("Nepavyko pridėti išlaidos");
      console.error(error);
      return null;
    }

    toast.success("Išlaida sėkmingai pridėta!");
    return data as Expense;
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
    const { data, error } = await supabase
      .rpc('calculate_monthly_total', {
        user_id: (await supabase.auth.getUser()).data.user?.id,
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
    const { data, error } = await supabase
      .rpc('calculate_category_total', {
        user_id: (await supabase.auth.getUser()).data.user?.id,
        category_name: category,
        month_year: monthYear
      });

    if (error) {
      console.error('Error calculating category total:', error);
      return 0;
    }

    return data || 0;
  };

  return { expenses, loading, addExpense, deleteExpense, refreshExpenses, getMonthlyTotal, getCategoryTotal };
};
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RecurringExpense } from "@/types/recurringExpense";
import { toast } from "sonner";

export const useRecurringExpenses = () => {
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshRecurringExpenses = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('recurring_expenses')
      .select('*')
      .order('name');
    
    if (error) {
      toast.error("Nepavyko įkelti pasikartojančių išlaidų");
      console.error(error);
    } else {
      setRecurringExpenses(data as RecurringExpense[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshRecurringExpenses();
    
    const channel = supabase
      .channel('recurring-expenses-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'recurring_expenses' },
        (payload) => {
          refreshRecurringExpenses();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'recurring_expenses' },
        (payload) => {
          refreshRecurringExpenses();
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'recurring_expenses' },
        (payload) => {
          refreshRecurringExpenses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshRecurringExpenses]);

  const addRecurringExpense = async (expense: Omit<RecurringExpense, 'id'>) => {
    // Optimistically update UI
    const tempId = `temp-${Date.now()}`;
    const tempExpense: RecurringExpense = {
      ...expense,
      id: tempId,
    };
    
    setRecurringExpenses(prevExpenses => [...prevExpenses, tempExpense].sort((a, b) => a.name.localeCompare(b.name)));
    
    try {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .insert([{
          name: expense.name,
          amount: expense.amount,
          category: expense.category,
          day_of_month: expense.day_of_month
        }])
        .select()
        .single();
      
      if (error) {
        // Revert optimistic update on error
        setRecurringExpenses(prevExpenses => prevExpenses.filter(exp => exp.id !== tempId));
        toast.error("Nepavyko pridėti pasikartojančios išlaidos");
        console.error(error);
        return null;
      }
      
      // Replace temporary expense with actual data from backend
      setRecurringExpenses(prevExpenses => {
        const withoutTemp = prevExpenses.filter(exp => exp.id !== tempId);
        return [...withoutTemp, data as RecurringExpense].sort((a, b) => a.name.localeCompare(b.name));
      });

      toast.success(`Pasikartojanti išlaida "${expense.name}" pridėta.`);
      return data as RecurringExpense;
    } catch (error) {
      // Revert optimistic update on error
      setRecurringExpenses(prevExpenses => prevExpenses.filter(exp => exp.id !== tempId));
      toast.error("Nepavyko pridėti pasikartojančios išlaidos");
      console.error(error);
      return null;
    }
  };

  const deleteRecurringExpense = async (id: string) => {
    // Optimistically update UI
    setRecurringExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== id));

    try {
      const { error } = await supabase
        .from('recurring_expenses')
        .delete()
        .eq('id', id);
      
      if (error) {
        // Revert optimistic update on error
        refreshRecurringExpenses();
        toast.error("Nepavyko ištrinti pasikartojančios išlaidos");
        console.error(error);
        return false;
      }
      
      toast.success("Pasikartojanti išlaida sėkmingai ištrinta.");
      return true;
    } catch (error) {
      // Revert optimistic update on error
      refreshRecurringExpenses();
      toast.error("Nepavyko ištrinti pasikartojančios išlaidos");
      console.error(error);
      return false;
    }
  };

  return {
    recurringExpenses,
    loading,
    addRecurringExpense,
    deleteRecurringExpense,
    refreshRecurringExpenses
  };
};
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RecurringExpense } from "@/types/recurringExpense";
import { toast } from "sonner";

export const useRecurringExpenses = () => {
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecurringExpenses();
    
    const channel = supabase
      .channel('recurring-expenses-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'recurring_expenses' },
        (payload) => {
          setRecurringExpenses((prev) => [...prev, payload.new as RecurringExpense]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'recurring_expenses' },
        (payload) => {
          setRecurringExpenses((prev) =>
            prev.map((expense) =>
              expense.id === payload.new.id ? (payload.new as RecurringExpense) : expense
            )
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'recurring_expenses' },
        (payload) => {
          setRecurringExpenses((prev) => prev.filter((expense) => expense.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRecurringExpenses = async () => {
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
  };

  const addRecurringExpense = async (expense: Omit<RecurringExpense, 'id'>) => {
    // Remove manual ID generation
    const { data, error } = await supabase
      .from('recurring_expenses')
      .insert([{ ...expense }])
      .select()
      .single();

    if (error) {
      toast.error("Nepavyko pridėti pasikartojančios išlaidos");
      console.error(error);
      return null;
    }

    toast.success(`Pasikartojanti išlaida "${expense.name}" pridėta.`);
    return data as RecurringExpense;
  };

  const deleteRecurringExpense = async (id: string) => {
    const { error } = await supabase
      .from('recurring_expenses')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Nepavyko ištrinti pasikartojančios išlaidos");
      console.error(error);
      return false;
    }

    toast.success("Pasikartojanti išlaida sėkmingai ištrinta.");
    return true;
  };

  return { recurringExpenses, loading, addRecurringExpense, deleteRecurringExpense, fetchRecurringExpenses };
};
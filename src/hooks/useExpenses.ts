import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Expense } from "@/types/expense";
import { toast } from "sonner";

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenses();
    const channel = supabase
      .channel('expenses-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'expenses' },
        (payload) => {
          setExpenses((prev) => [...prev, payload.new as Expense]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'expenses' },
        (payload) => {
          setExpenses((prev) => 
            prev.map((expense) => 
              expense.id === payload.new.id ? (payload.new as Expense) : expense
            )
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'expenses' },
        (payload) => {
          setExpenses((prev) => prev.filter((expense) => expense.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchExpenses = async () => {
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
  };

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    // Remove the manual ID generation since Supabase will handle it automatically
    const { data, error } = await supabase
      .from('expenses')
      .insert([{ ...expense }])
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
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Nepavyko ištrinti išlaidos");
      console.error(error);
      return false;
    }

    toast.success("Išlaida sėkmingai ištrinta.");
    return true;
  };

  return { expenses, loading, addExpense, deleteExpense, fetchExpenses };
};
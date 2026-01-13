import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RecurringExpense } from "@/types/recurringExpense";
import { toast } from "sonner";

export const useRecurringExpenses = (impersonatedUserIdFromProps?: string) => {
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);

  const getEffectiveUserId = useCallback(async () => {
    console.log("[useRecurringExpenses] getEffectiveUserId called. impersonatedUserIdFromProps:", impersonatedUserIdFromProps);
    if (impersonatedUserIdFromProps) {
      console.log("[useRecurringExpenses] Returning impersonatedUserIdFromProps:", impersonatedUserIdFromProps);
      return impersonatedUserIdFromProps;
    }
    const { data: { user } } = await supabase.auth.getUser();
    console.log("[useRecurringExpenses] No impersonated ID. Falling back to supabase.auth.getUser(). User ID:", user?.id);
    return user?.id;
  }, [impersonatedUserIdFromProps]);

  const refreshRecurringExpenses = useCallback(async () => {
    setLoading(true);
    const targetUserId = await getEffectiveUserId();
    console.log("[useRecurringExpenses] refreshRecurringExpenses using targetUserId:", targetUserId);

    if (!targetUserId) {
      setRecurringExpenses([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('recurring_expenses')
      .select('*')
      .eq('user_id', targetUserId)
      .order('name');

    if (error) {
      toast.error("Nepavyko įkelti pasikartojančių išlaidų");
      console.error("[useRecurringExpenses] Error loading recurring expenses:", error);
    } else {
      setRecurringExpenses(data as RecurringExpense[]);
      console.log("[useRecurringExpenses] Loaded recurring expenses for user:", targetUserId, data);
    }
    setLoading(false);
  }, [getEffectiveUserId]);

  useEffect(() => {
    refreshRecurringExpenses();

    const setupSubscription = async () => {
      const targetUserId = await getEffectiveUserId();
      console.log("[useRecurringExpenses] Setting up subscription for targetUserId:", targetUserId);

      if (!targetUserId) return;

      const channel = supabase
        .channel(`recurring-expenses-changes-${targetUserId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'recurring_expenses', filter: `user_id=eq.${targetUserId}` },
          (payload) => {
            console.log("[useRecurringExpenses] Realtime INSERT event:", payload);
            refreshRecurringExpenses();
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'recurring_expenses', filter: `user_id=eq.${targetUserId}` },
          (payload) => {
            console.log("[useRecurringExpenses] Realtime UPDATE event:", payload);
            refreshRecurringExpenses();
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'recurring_expenses', filter: `user_id=eq.${targetUserId}` },
          (payload) => {
            console.log("[useRecurringExpenses] Realtime DELETE event:", payload);
            refreshRecurringExpenses();
          }
        )
        .subscribe();

      return () => {
        console.log("[useRecurringExpenses] Unsubscribing from channel:", `recurring-expenses-changes-${targetUserId}`);
        supabase.removeChannel(channel);
      };
    };

    setupSubscription();
  }, [refreshRecurringExpenses, getEffectiveUserId]);

  const addRecurringExpense = async (expense: Omit<RecurringExpense, 'id'>) => {
    const targetUserId = await getEffectiveUserId();
    console.log("[useRecurringExpenses] addRecurringExpense using targetUserId:", targetUserId);

    if (!targetUserId) {
      toast.error("Nepavyko pridėti pasikartojančios išlaidos - nėra vartotojo");
      return null;
    }

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
          day_of_month: expense.day_of_month,
          user_id: targetUserId
        }])
        .select()
        .single();

      if (error) {
        setRecurringExpenses(prevExpenses => prevExpenses.filter(exp => exp.id !== tempId));
        toast.error("Nepavyko pridėti pasikartojančios išlaidos");
        console.error("[useRecurringExpenses] Error adding recurring expense:", error);
        return null;
      }

      setRecurringExpenses(prevExpenses => {
        const withoutTemp = prevExpenses.filter(exp => exp.id !== tempId);
        return [...withoutTemp, data as RecurringExpense].sort((a, b) => a.name.localeCompare(b.name));
      });

      toast.success(`Pasikartojanti išlaida "${expense.name}" pridėta.`);
      console.log("[useRecurringExpenses] Recurring expense added:", data);
      return data as RecurringExpense;
    } catch (error) {
      setRecurringExpenses(prevExpenses => prevExpenses.filter(exp => exp.id !== tempId));
      toast.error("Nepavyko pridėti pasikartojančios išlaidos");
      console.error("[useRecurringExpenses] Unexpected error adding recurring expense:", error);
      return null;
    }
  };

  const deleteRecurringExpense = async (id: string) => {
    const targetUserId = await getEffectiveUserId();
    console.log("[useRecurringExpenses] deleteRecurringExpense using targetUserId:", targetUserId);

    if (!targetUserId) {
      toast.error("Nepavyko ištrinti pasikartojančios išlaidos - nėra vartotojo");
      return false;
    }

    setRecurringExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== id));

    try {
      const { error } = await supabase
        .from('recurring_expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', targetUserId);

      if (error) {
        refreshRecurringExpenses();
        toast.error("Nepavyko ištrinti pasikartojančios išlaidos");
        console.error("[useRecurringExpenses] Error deleting recurring expense:", error);
        return false;
      }

      toast.success("Pasikartojanti išlaida sėkmingai ištrinta.");
      return true;
    } catch (error) {
      refreshRecurringExpenses();
      toast.error("Nepavyko ištrinti pasikartojančios išlaidos");
      console.error("[useRecurringExpenses] Unexpected error deleting recurring expense:", error);
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
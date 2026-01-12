import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useMonthlyIncomes = (userId?: string) => {
  const [monthlyIncomes, setMonthlyIncomes] = useState<{ [key: string]: number }>({});
  const [defaultMonthlyIncome, setDefaultMonthlyIncome] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const getTargetUserId = useCallback(async () => {
    // If userId is provided, use it (for impersonation)
    if (userId) return userId;
    
    // Otherwise get current user
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
  }, [userId]);

  const refreshMonthlyIncomes = useCallback(async () => {
    setLoading(true);
    const targetUserId = await getTargetUserId();
    
    if (!targetUserId) {
      setMonthlyIncomes({});
      setDefaultMonthlyIncome(0);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('monthly_incomes')
      .select('month_year, income')
      .eq('user_id', targetUserId);

    if (error) {
      toast.error("Nepavyko įkelti pajamų");
      console.error(error);
    } else {
      const defaultIncome = data.find(item => item.month_year === 'default');
      if (defaultIncome) {
        setDefaultMonthlyIncome(defaultIncome.income);
      }
      
      const monthIncomes = data
        .filter(item => item.month_year !== 'default')
        .reduce((acc, item) => {
          acc[item.month_year] = item.income;
          return acc;
        }, {} as { [key: string]: number });
      
      setMonthlyIncomes(monthIncomes);
    }
    setLoading(false);
  }, [getTargetUserId]);

  useEffect(() => {
    refreshMonthlyIncomes();
    
    const setupSubscription = async () => {
      const targetUserId = await getTargetUserId();
      
      if (!targetUserId) return;
      
      const channel = supabase
        .channel('monthly-incomes-changes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'monthly_incomes', filter: `user_id=eq.${targetUserId}` },
          (payload) => {
            refreshMonthlyIncomes();
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'monthly_incomes', filter: `user_id=eq.${targetUserId}` },
          (payload) => {
            refreshMonthlyIncomes();
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'monthly_incomes', filter: `user_id=eq.${targetUserId}` },
          (payload) => {
            refreshMonthlyIncomes();
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    };
    
    setupSubscription();
  }, [refreshMonthlyIncomes, getTargetUserId]);

  const saveIncome = async (income: number, type: 'default' | 'month', monthYear?: string) => {
    const targetUserId = await getTargetUserId();
    
    if (!targetUserId) {
      toast.error("Nepavyko išsaugoti pajamų - nėra vartotojo");
      return false;
    }

    const month_year = type === 'default' ? 'default' : monthYear;
    
    if (!month_year) {
      toast.error("Nepavyko išsaugoti pajamų - nenurodytas mėnuo");
      return false;
    }

    // Handle removal of specific month income (when income is 0 and it's a month type)
    if (type === 'month' && income === 0) {
      // First try to delete existing record
      const { error: deleteError } = await supabase
        .from('monthly_incomes')
        .delete()
        .eq('month_year', month_year)
        .eq('user_id', targetUserId);

      if (deleteError) {
        toast.error("Nepavyko pašalinti mėnesio pajamų");
        console.error(deleteError);
        return false;
      }
      
      // Optimistically update UI
      setMonthlyIncomes(prev => {
        const newIncomes = {...prev};
        delete newIncomes[month_year];
        return newIncomes;
      });
      
      toast.success(`Mėnesio ${monthYear} pajamos pašalintos. Bus naudojamos numatytosios pajamos.`);
      return true;
    }

    // First try to update existing record
    const { data: updateData, error: updateError } = await supabase
      .from('monthly_incomes')
      .update({ income })
      .eq('month_year', month_year)
      .eq('user_id', targetUserId)
      .select()
      .single();

    if (updateData) {
      // Successfully updated
      // Optimistically update UI
      if (type === 'default') {
        setDefaultMonthlyIncome(income);
      } else if (monthYear) {
        setMonthlyIncomes(prev => ({ ...prev, [monthYear]: income }));
      }
      
      if (type === 'default') {
        toast.success("Numatytosios mėnesio pajamos atnaujintos!");
      } else if (monthYear) {
        toast.success(`Mėnesio ${monthYear} pajamos atnaujintos!`);
      }
      return true;
    }

    // If update failed because record doesn't exist, insert new record
    const { data: insertData, error: insertError } = await supabase
      .from('monthly_incomes')
      .insert([{ month_year, income, user_id: targetUserId }])
      .select()
      .single();

    if (insertError) {
      toast.error("Nepavyko išsaugoti pajamų");
      console.error(insertError);
      return false;
    }

    // Optimistically update UI
    if (type === 'default') {
      setDefaultMonthlyIncome(income);
    } else if (monthYear) {
      setMonthlyIncomes(prev => ({ ...prev, [monthYear]: income }));
    }
    
    if (type === 'default') {
      toast.success("Numatytosios mėnesio pajamos atnaujintos!");
    } else if (monthYear) {
      toast.success(`Mėnesio ${monthYear} pajamos atnaujintos!`);
    }
    return true;
  };

  return {
    monthlyIncomes,
    defaultMonthlyIncome,
    loading,
    saveIncome,
    refreshMonthlyIncomes
  };
};
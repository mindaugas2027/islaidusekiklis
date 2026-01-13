import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useMonthlyIncomes = (impersonatedUserIdFromProps?: string) => {
  const [monthlyIncomes, setMonthlyIncomes] = useState<{ [key: string]: number }>({});
  const [defaultMonthlyIncome, setDefaultMonthlyIncome] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const getEffectiveUserId = useCallback(async () => {
    console.log("[useMonthlyIncomes] getEffectiveUserId called. impersonatedUserIdFromProps:", impersonatedUserIdFromProps);
    if (impersonatedUserIdFromProps) {
      console.log("[useMonthlyIncomes] Returning impersonatedUserIdFromProps:", impersonatedUserIdFromProps);
      return impersonatedUserIdFromProps;
    }
    const { data: { user } } = await supabase.auth.getUser();
    console.log("[useMonthlyIncomes] No impersonated ID. Falling back to supabase.auth.getUser(). User ID:", user?.id);
    return user?.id;
  }, [impersonatedUserIdFromProps]);

  const refreshMonthlyIncomes = useCallback(async () => {
    setLoading(true);
    const targetUserId = await getEffectiveUserId();
    console.log("[useMonthlyIncomes] refreshMonthlyIncomes using targetUserId:", targetUserId);

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
      console.error("[useMonthlyIncomes] Error loading incomes:", error);
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
      console.log("[useMonthlyIncomes] Loaded incomes for user:", targetUserId, { defaultIncome: defaultIncome?.income, monthIncomes });
    }
    setLoading(false);
  }, [getEffectiveUserId]);

  useEffect(() => {
    refreshMonthlyIncomes();

    const setupSubscription = async () => {
      const targetUserId = await getEffectiveUserId();
      console.log("[useMonthlyIncomes] Setting up subscription for targetUserId:", targetUserId);

      if (!targetUserId) return;

      const channel = supabase
        .channel(`monthly-incomes-changes-${targetUserId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'monthly_incomes', filter: `user_id=eq.${targetUserId}` },
          (payload) => {
            console.log("[useMonthlyIncomes] Realtime INSERT event:", payload);
            refreshMonthlyIncomes();
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'monthly_incomes', filter: `user_id=eq.${targetUserId}` },
          (payload) => {
            console.log("[useMonthlyIncomes] Realtime UPDATE event:", payload);
            refreshMonthlyIncomes();
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'monthly_incomes', filter: `user_id=eq.${targetUserId}` },
          (payload) => {
            console.log("[useMonthlyIncomes] Realtime DELETE event:", payload);
            refreshMonthlyIncomes();
          }
        )
        .subscribe();

      return () => {
        console.log("[useMonthlyIncomes] Unsubscribing from channel:", `monthly-incomes-changes-${targetUserId}`);
        supabase.removeChannel(channel);
      };
    };

    setupSubscription();
  }, [refreshMonthlyIncomes, getEffectiveUserId]);

  const saveIncome = async (income: number, type: 'default' | 'month', monthYear?: string) => {
    const targetUserId = await getEffectiveUserId();
    console.log("[useMonthlyIncomes] saveIncome using targetUserId:", targetUserId, "type:", type, "monthYear:", monthYear, "income:", income);

    if (!targetUserId) {
      toast.error("Nepavyko išsaugoti pajamų - nėra vartotojo");
      return false;
    }

    const month_year = type === 'default' ? 'default' : monthYear;

    if (!month_year) {
      toast.error("Nepavyko išsaugoti pajamų - nenurodytas mėnuo");
      return false;
    }

    if (type === 'month' && income === 0) {
      const { error: deleteError } = await supabase
        .from('monthly_incomes')
        .delete()
        .eq('month_year', month_year)
        .eq('user_id', targetUserId);

      if (deleteError) {
        toast.error("Nepavyko pašalinti mėnesio pajamų");
        console.error("[useMonthlyIncomes] Error deleting monthly income:", deleteError);
        return false;
      }

      setMonthlyIncomes(prev => {
        const newIncomes = {...prev};
        delete newIncomes[month_year];
        return newIncomes;
      });

      toast.success(`Mėnesio ${monthYear} pajamos pašalintos. Bus naudojamos numatytosios pajamos.`);
      return true;
    }

    const { data: updateData, error: updateError } = await supabase
      .from('monthly_incomes')
      .update({ income })
      .eq('month_year', month_year)
      .eq('user_id', targetUserId)
      .select()
      .single();

    if (updateData) {
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
      console.log("[useMonthlyIncomes] Income updated:", updateData);
      return true;
    }

    const { data: insertData, error: insertError } = await supabase
      .from('monthly_incomes')
      .insert([{ month_year, income, user_id: targetUserId }])
      .select()
      .single();

    if (insertError) {
      toast.error("Nepavyko išsaugoti pajamų");
      console.error("[useMonthlyIncomes] Error inserting income:", insertError);
      return false;
    }

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
    console.log("[useMonthlyIncomes] Income inserted:", insertData);
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
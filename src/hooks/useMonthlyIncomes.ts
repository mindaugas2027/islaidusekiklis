import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useMonthlyIncomes = () => {
  const [monthlyIncomes, setMonthlyIncomes] = useState<{ [key: string]: number }>({});
  const [defaultMonthlyIncome, setDefaultMonthlyIncome] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMonthlyIncomes();
    
    const channel = supabase
      .channel('monthly-incomes-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'monthly_incomes',
        },
        (payload) => {
          const { month_year, income } = payload.new;
          if (month_year === 'default') {
            setDefaultMonthlyIncome(income);
          } else {
            setMonthlyIncomes((prev) => ({ ...prev, [month_year]: income }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'monthly_incomes',
        },
        (payload) => {
          const { month_year, income } = payload.new;
          if (month_year === 'default') {
            setDefaultMonthlyIncome(income);
          } else {
            setMonthlyIncomes((prev) => ({ ...prev, [month_year]: income }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'monthly_incomes',
        },
        (payload) => {
          const { month_year } = payload.old;
          if (month_year === 'default') {
            setDefaultMonthlyIncome(0);
          } else {
            setMonthlyIncomes((prev) => {
              const newIncomes = { ...prev };
              delete newIncomes[month_year];
              return newIncomes;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMonthlyIncomes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('monthly_incomes')
      .select('month_year, income');

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
  };

  const saveIncome = async (income: number, type: 'default' | 'month', monthYear?: string) => {
    const month_year = type === 'default' ? 'default' : monthYear;
    
    if (!month_year) {
      toast.error("Nepavyko išsaugoti pajamų - nenurodytas mėnuo");
      return false;
    }

    const { data, error } = await supabase
      .from('monthly_incomes')
      .upsert({ month_year, income }, { onConflict: 'user_id,month_year' })
      .select()
      .single();

    if (error) {
      toast.error("Nepavyko išsaugoti pajamų");
      console.error(error);
      return false;
    }

    if (type === 'default') {
      setDefaultMonthlyIncome(income);
      toast.success("Numatytosios mėnesio pajamos atnaujintos!");
    } else if (monthYear) {
      setMonthlyIncomes((prev) => ({ ...prev, [monthYear]: income }));
      toast.success(`Mėnesio ${monthYear} pajamos atnaujintos!`);
    }

    return true;
  };

  return {
    monthlyIncomes,
    defaultMonthlyIncome,
    loading,
    saveIncome,
    fetchMonthlyIncomes
  };
};
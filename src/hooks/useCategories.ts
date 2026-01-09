import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useCategories = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshCategories = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('name')
      .order('name');
    
    if (error) {
      toast.error("Nepavyko įkelti kategorijų");
      console.error(error);
    } else {
      setCategories(data.map((item) => item.name));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshCategories();
    
    const channel = supabase
      .channel('categories-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'categories' },
        (payload) => {
          refreshCategories();
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'categories' },
        (payload) => {
          refreshCategories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshCategories]);

  const addCategory = async (name: string) => {
    // Optimistically update UI
    setCategories(prevCategories => [...prevCategories, name].sort());

    try {
      const { error } = await supabase
        .from('categories')
        .insert([{ name }]);
      
      if (error) {
        // Revert optimistic update on error
        setCategories(prevCategories => prevCategories.filter(cat => cat !== name));
        if (error.code === '23505') { // Unique violation
          toast.error("Tokia kategorija jau egzistuoja.");
        } else {
          toast.error("Nepavyko pridėti kategorijos");
          console.error(error);
        }
        return false;
      }
      
      toast.success(`Kategorija "${name}" pridėta.`);
      return true;
    } catch (error) {
      // Revert optimistic update on error
      setCategories(prevCategories => prevCategories.filter(cat => cat !== name));
      toast.error("Nepavyko pridėti kategorijos");
      console.error(error);
      return false;
    }
  };

  const deleteCategory = async (name: string) => {
    // Optimistically update UI
    setCategories(prevCategories => prevCategories.filter(cat => cat !== name));

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('name', name);
      
      if (error) {
        // Revert optimistic update on error
        refreshCategories();
        toast.error("Nepavyko ištrinti kategorijos");
        console.error(error);
        return false;
      }
      
      toast.success(`Kategorija "${name}" ištrinta.`);
      return true;
    } catch (error) {
      // Revert optimistic update on error
      refreshCategories();
      toast.error("Nepavyko ištrinti kategorijos");
      console.error(error);
      return false;
    }
  };

  return {
    categories,
    loading,
    addCategory,
    deleteCategory,
    refreshCategories
  };
};
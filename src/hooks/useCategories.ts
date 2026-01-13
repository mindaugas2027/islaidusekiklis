import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useCategories = (userId?: string) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const getTargetUserId = useCallback(async () => {
    // If userId is provided (for impersonation), use it
    if (userId) return userId;

    // Otherwise get current user
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
  }, [userId]);

  const refreshCategories = useCallback(async () => {
    setLoading(true);
    const targetUserId = await getTargetUserId();

    if (!targetUserId) {
      setCategories([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('categories')
      .select('name')
      .eq('user_id', targetUserId)
      .order('name');

    if (error) {
      toast.error("Nepavyko įkelti kategorijų");
      console.error(error);
    } else {
      // Ensure categories are unique by using Set
      const uniqueCategories = Array.from(new Set(data.map((item) => item.name)));
      setCategories(uniqueCategories);
    }
    setLoading(false);
  }, [getTargetUserId]);

  useEffect(() => {
    refreshCategories();

    const setupSubscription = async () => {
      const targetUserId = await getTargetUserId();

      if (!targetUserId) return;

      const channel = supabase
        .channel('categories-changes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'categories', filter: `user_id=eq.${targetUserId}` },
          (payload) => {
            refreshCategories();
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'categories', filter: `user_id=eq.${targetUserId}` },
          (payload) => {
            refreshCategories();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupSubscription();
  }, [refreshCategories, getTargetUserId]);

  const addCategory = async (name: string) => {
    const targetUserId = await getTargetUserId();

    if (!targetUserId) {
      toast.error("Nepavyko pridėti kategorijos - nėra vartotojo");
      return false;
    }

    // Check if category already exists (case-insensitive)
    const trimmedName = name.trim();
    if (categories.some(cat => cat.toLowerCase() === trimmedName.toLowerCase())) {
      toast.error(`Kategorija "${trimmedName}" jau egzistuoja.`);
      return false;
    }

    // Optimistically update UI
    setCategories(prevCategories => [...prevCategories, trimmedName].sort());

    try {
      const { error } = await supabase
        .from('categories')
        .insert([{ name: trimmedName, user_id: targetUserId }]);

      if (error) {
        // Revert optimistic update on error
        setCategories(prevCategories => prevCategories.filter(cat => cat !== trimmedName));

        if (error.code === '23505') { // Unique violation
          toast.error("Tokia kategorija jau egzistuoja.");
        } else {
          toast.error("Nepavyko pridėti kategorijos");
          console.error(error);
        }
        return false;
      }

      toast.success(`Kategorija "${trimmedName}" pridėta.`);
      return true;
    } catch (error) {
      // Revert optimistic update on error
      setCategories(prevCategories => prevCategories.filter(cat => cat !== trimmedName));
      toast.error("Nepavyko pridėti kategorijos");
      console.error(error);
      return false;
    }
  };

  const deleteCategory = async (name: string) => {
    const targetUserId = await getTargetUserId();

    if (!targetUserId) {
      toast.error("Nepavyko ištrinti kategorijos - nėra vartotojo");
      return false;
    }

    // Optimistically update UI
    setCategories(prevCategories => prevCategories.filter(cat => cat !== name));

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('name', name)
        .eq('user_id', targetUserId);

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
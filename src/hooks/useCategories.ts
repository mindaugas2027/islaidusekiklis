import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useCategories = (impersonatedUserIdFromProps?: string) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const getEffectiveUserId = useCallback(async () => {
    console.log("[useCategories] getEffectiveUserId called. impersonatedUserIdFromProps:", impersonatedUserIdFromProps);
    if (impersonatedUserIdFromProps) {
      console.log("[useCategories] Returning impersonatedUserIdFromProps:", impersonatedUserIdFromProps);
      return impersonatedUserIdFromProps;
    }
    const { data: { user } } = await supabase.auth.getUser();
    console.log("[useCategories] No impersonated ID. Falling back to supabase.auth.getUser(). User ID:", user?.id);
    return user?.id;
  }, [impersonatedUserIdFromProps]);

  const refreshCategories = useCallback(async () => {
    setLoading(true);
    const targetUserId = await getEffectiveUserId();
    console.log("[useCategories] refreshCategories using targetUserId:", targetUserId);

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
      console.error("[useCategories] Error loading categories:", error);
    } else {
      const uniqueCategories = Array.from(new Set(data.map((item) => item.name)));
      setCategories(uniqueCategories);
      console.log("[useCategories] Loaded categories for user:", targetUserId, uniqueCategories);
    }
    setLoading(false);
  }, [getEffectiveUserId]);

  useEffect(() => {
    refreshCategories();

    const setupSubscription = async () => {
      const targetUserId = await getEffectiveUserId();
      console.log("[useCategories] Setting up subscription for targetUserId:", targetUserId);

      if (!targetUserId) return;

      const channel = supabase
        .channel(`categories-changes-${targetUserId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'categories', filter: `user_id=eq.${targetUserId}` },
          (payload) => {
            console.log("[useCategories] Realtime INSERT event:", payload);
            refreshCategories();
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'categories', filter: `user_id=eq.${targetUserId}` },
          (payload) => {
            console.log("[useCategories] Realtime DELETE event:", payload);
            refreshCategories();
          }
        )
        .subscribe();

      return () => {
        console.log("[useCategories] Unsubscribing from channel:", `categories-changes-${targetUserId}`);
        supabase.removeChannel(channel);
      };
    };

    setupSubscription();
  }, [refreshCategories, getEffectiveUserId]);

  const addCategory = async (name: string) => {
    const targetUserId = await getEffectiveUserId();
    console.log("[useCategories] addCategory using targetUserId:", targetUserId);

    if (!targetUserId) {
      toast.error("Nepavyko pridėti kategorijos - nėra vartotojo");
      return false;
    }

    const trimmedName = name.trim();
    if (categories.some(cat => cat.toLowerCase() === trimmedName.toLowerCase())) {
      toast.error(`Kategorija "${trimmedName}" jau egzistuoja.`);
      return false;
    }

    setCategories(prevCategories => [...prevCategories, trimmedName].sort());

    try {
      const { error } = await supabase
        .from('categories')
        .insert([{ name: trimmedName, user_id: targetUserId }]);

      if (error) {
        setCategories(prevCategories => prevCategories.filter(cat => cat !== trimmedName));

        if (error.code === '23505') {
          toast.error("Tokia kategorija jau egzistuoja.");
        } else {
          toast.error("Nepavyko pridėti kategorijos");
          console.error("[useCategories] Error adding category:", error);
        }
        return false;
      }

      toast.success(`Kategorija "${trimmedName}" pridėta.`);
      return true;
    } catch (error) {
      setCategories(prevCategories => prevCategories.filter(cat => cat !== trimmedName));
      toast.error("Nepavyko pridėti kategorijos");
      console.error("[useCategories] Unexpected error adding category:", error);
      return false;
    }
  };

  const deleteCategory = async (name: string) => {
    const targetUserId = await getEffectiveUserId();
    console.log("[useCategories] deleteCategory using targetUserId:", targetUserId);

    if (!targetUserId) {
      toast.error("Nepavyko ištrinti kategorijos - nėra vartotojo");
      return false;
    }

    setCategories(prevCategories => prevCategories.filter(cat => cat !== name));

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('name', name)
        .eq('user_id', targetUserId);

      if (error) {
        refreshCategories();
        toast.error("Nepavyko ištrinti kategorijos");
        console.error("[useCategories] Error deleting category:", error);
        return false;
      }

      toast.success(`Kategorija "${name}" ištrinta.`);
      return true;
    } catch (error) {
      refreshCategories();
      toast.error("Nepavyko ištrinti kategorijos");
      console.error("[useCategories] Unexpected error deleting category:", error);
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
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { X } from "lucide-react";

interface CategoryManagerProps {
  categories: string[];
  onAddCategory: (category: string) => Promise<void>;
  onDeleteCategory: (category: string) => Promise<void>;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, onAddCategory, onDeleteCategory }) => {
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  const [deletingCategories, setDeletingCategories] = useState<Set<string>>(new Set());
  const [optimisticCategories, setOptimisticCategories] = useState<string[]>([]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newCategoryName.trim();
    
    if (!trimmedName) {
      toast.error("Kategorijos pavadinimas negali būti tuščias.");
      return;
    }
    
    // Check if category already exists in current list or optimistic list
    if (categories.includes(trimmedName) || optimisticCategories.includes(trimmedName)) {
      toast.error("Tokia kategorija jau egzistuoja.");
      return;
    }
    
    setIsAdding(true);
    
    // Immediately add to optimistic list for instant UI feedback
    setOptimisticCategories(prev => [...prev, trimmedName]);
    setNewCategoryName("");
    
    try {
      await onAddCategory(trimmedName);
      // Success message is handled in the hook
      // Remove from optimistic list after successful addition
      setOptimisticCategories(prev => prev.filter(cat => cat !== trimmedName));
    } catch (error) {
      toast.error("Nepavyko pridėti kategorijos");
      // Remove from optimistic list if failed
      setOptimisticCategories(prev => prev.filter(cat => cat !== trimmedName));
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteCategory = async (category: string) => {
    // Immediately add to deleting set for UI feedback
    setDeletingCategories(prev => new Set(prev).add(category));
    
    try {
      await onDeleteCategory(category);
      // Success message is handled in the hook
    } catch (error) {
      toast.error("Nepavyko ištrinti kategorijos");
      // Remove from deleting set if failed
      setDeletingCategories(prev => {
        const newSet = new Set(prev);
        newSet.delete(category);
        return newSet;
      });
    }
  };

  // Combine real categories with optimistic ones and filter out deleting ones
  const visibleCategories = [...categories, ...optimisticCategories]
    .filter(category => !deletingCategories.has(category))
    // Remove duplicates
    .filter((category, index, self) => self.indexOf(category) === index)
    .sort();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Kategorijų valdymas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleAddCategory} className="flex gap-2">
          <Input 
            type="text" 
            placeholder="Naujos kategorijos pavadinimas" 
            value={newCategoryName} 
            onChange={(e) => setNewCategoryName(e.target.value)} 
            className="flex-grow" 
            disabled={isAdding} 
          />
          <Button type="submit" disabled={isAdding}>
            {isAdding ? "Pridedama..." : "Pridėti"}
          </Button>
        </form>
        
        {visibleCategories.length === 0 ? (
          <p className="text-center text-gray-500">Kol kas nėra kategorijų. Pridėkite naują!</p>
        ) : (
          <div className="space-y-2">
            <Label className="text-lg font-semibold">Esamos kategorijos:</Label>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {visibleCategories.map((category) => (
                <li 
                  key={category} 
                  className="flex items-center justify-between p-2 border rounded-md bg-secondary text-secondary-foreground"
                >
                  <span>{category}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDeleteCategory(category)} 
                    className="h-auto p-1"
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryManager;
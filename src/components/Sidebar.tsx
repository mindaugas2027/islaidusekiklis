import React from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Settings } from "lucide-react";
import CategoryManager from "./CategoryManager";
import MonthlyBudgetSettings from "./MonthlyBudgetSettings";

interface SidebarProps {
  categories: string[];
  onAddCategory: (category: string) => void;
  onDeleteCategory: (category: string) => void;
  monthlyIncome: number;
  onSaveMonthlyIncome: (income: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  categories,
  onAddCategory,
  onDeleteCategory,
  monthlyIncome,
  onSaveMonthlyIncome,
}) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="fixed top-4 right-4 z-50">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Atidaryti nustatymus</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-3xl font-bold text-center">Nustatymai</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <CategoryManager
            categories={categories}
            onAddCategory={onAddCategory}
            onDeleteCategory={onDeleteCategory}
          />
          <MonthlyBudgetSettings
            monthlyIncome={monthlyIncome}
            onSaveMonthlyIncome={onSaveMonthlyIncome}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default Sidebar;
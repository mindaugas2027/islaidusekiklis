import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MonthlyBudgetSettingsProps {
  monthlyIncome: number;
  onSaveMonthlyIncome: (income: number) => void;
}

const MonthlyBudgetSettings: React.FC<MonthlyBudgetSettingsProps> = ({
  monthlyIncome,
  onSaveMonthlyIncome,
}) => {
  const [inputIncome, setInputIncome] = useState<string>(monthlyIncome.toFixed(2));

  useEffect(() => {
    setInputIncome(monthlyIncome.toFixed(2));
  }, [monthlyIncome]);

  const handleSaveIncome = () => {
    const parsedIncome = parseFloat(inputIncome);
    if (isNaN(parsedIncome) || parsedIncome < 0) {
      toast.error("Prašome įvesti teigiamą pajamų sumą.");
      return;
    }
    onSaveMonthlyIncome(parsedIncome);
    toast.success("Mėnesio pajamos atnaujintos!");
  };

  return (
    <div className="space-y-4 p-4 border-t pt-4">
      <h3 className="text-xl font-semibold text-center">Mėnesio pajamų nustatymai</h3>
      <div>
        <Label htmlFor="monthly-income-input">Mėnesio pajamos (€)</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="monthly-income-input"
            type="number"
            value={inputIncome}
            onChange={(e) => setInputIncome(e.target.value)}
            placeholder="0.00"
            step="0.01"
          />
          <Button onClick={handleSaveIncome}>Išsaugoti</Button>
        </div>
      </div>
    </div>
  );
};

export default MonthlyBudgetSettings;
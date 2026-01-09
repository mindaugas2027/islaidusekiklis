import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface IncomeTrackerProps {
  totalExpenses: number;
}

const IncomeTracker: React.FC<IncomeTrackerProps> = ({ totalExpenses }) => {
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [inputIncome, setInputIncome] = useState<string>("");

  useEffect(() => {
    const storedIncome = localStorage.getItem("monthlyIncome");
    if (storedIncome) {
      const parsedIncome = parseFloat(storedIncome);
      if (!isNaN(parsedIncome)) {
        setMonthlyIncome(parsedIncome);
        setInputIncome(parsedIncome.toFixed(2));
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("monthlyIncome", monthlyIncome.toString());
  }, [monthlyIncome]);

  const handleSaveIncome = () => {
    const parsedIncome = parseFloat(inputIncome);
    if (isNaN(parsedIncome) || parsedIncome < 0) {
      toast.error("Prašome įvesti teigiamą pajamų sumą.");
      return;
    }
    setMonthlyIncome(parsedIncome);
    toast.success("Mėnesio pajamos atnaujintos!");
  };

  const remainingBudget = monthlyIncome - totalExpenses;
  const isOverBudget = remainingBudget < 0;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Mėnesio pajamos ir biudžetas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="monthly-income">Mėnesio pajamos (€)</Label>
          <div className="flex gap-2">
            <Input
              id="monthly-income"
              type="number"
              value={inputIncome}
              onChange={(e) => setInputIncome(e.target.value)}
              placeholder="0.00"
              step="0.01"
            />
            <Button onClick={handleSaveIncome}>Išsaugoti</Button>
          </div>
        </div>
        <div className="text-center text-lg">
          <p className="font-semibold">Viso išleista: <span className="text-red-600">{totalExpenses.toFixed(2)} €</span></p>
          <p className={`font-bold ${isOverBudget ? "text-red-600" : "text-green-600"}`}>
            {isOverBudget ? "Viršytas biudžetas:" : "Liko biudžeto:"} {remainingBudget.toFixed(2)} €
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default IncomeTracker;
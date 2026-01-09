import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface IncomeTrackerProps {
  monthlyIncome: number; // Now receives monthlyIncome as a prop
  totalExpenses: number;
}

const IncomeTracker: React.FC<IncomeTrackerProps> = ({ monthlyIncome, totalExpenses }) => {
  const remainingBudget = monthlyIncome - totalExpenses;
  const isOverBudget = remainingBudget < 0;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Mėnesio biudžeto apžvalga</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-center text-lg">
        <p className="font-semibold">Nustatytos mėnesio pajamos: <span className="text-primary">{monthlyIncome.toFixed(2)} €</span></p>
        <p className="font-semibold">Viso išleista: <span className="text-destructive">{totalExpenses.toFixed(2)} €</span></p>
        <p className={`font-bold ${isOverBudget ? "text-destructive" : "text-green-600"}`}>
          {isOverBudget ? "Viršytas biudžetas:" : "Liko biudžeto:"} {remainingBudget.toFixed(2)} €
        </p>
      </CardContent>
    </Card>
  );
};

export default IncomeTracker;
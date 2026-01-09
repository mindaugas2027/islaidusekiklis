import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MonthlyBudgetSettingsProps {
  monthlyIncomes: { [key: string]: number };
  defaultMonthlyIncome: number;
  onSaveIncome: (income: number, type: 'default' | 'month', monthYear?: string) => void;
  selectedMonth: string;
  selectedYear: string;
}

const MonthlyBudgetSettings: React.FC<MonthlyBudgetSettingsProps> = ({
  monthlyIncomes,
  defaultMonthlyIncome,
  onSaveIncome,
  selectedMonth,
  selectedYear,
}) => {
  const selectedMonthYear = `${selectedYear}-${selectedMonth}`;
  const currentMonthSpecificIncome = monthlyIncomes[selectedMonthYear];

  const [inputMonthIncome, setInputMonthIncome] = useState<string>(
    currentMonthSpecificIncome !== undefined ? currentMonthSpecificIncome.toFixed(2) : ""
  );
  const [inputDefaultIncome, setInputDefaultIncome] = useState<string>(defaultMonthlyIncome.toFixed(2));

  useEffect(() => {
    setInputMonthIncome(
      currentMonthSpecificIncome !== undefined ? currentMonthSpecificIncome.toFixed(2) : ""
    );
  }, [currentMonthSpecificIncome]);

  useEffect(() => {
    setInputDefaultIncome(defaultMonthlyIncome.toFixed(2));
  }, [defaultMonthlyIncome]);

  const handleSaveMonthIncome = () => {
    const parsedIncome = parseFloat(inputMonthIncome);
    if (isNaN(parsedIncome) || parsedIncome < 0) {
      toast.error("Prašome įvesti teigiamą pajamų sumą pasirinktam mėnesiui.");
      return;
    }
    onSaveIncome(parsedIncome, 'month', selectedMonthYear);
  };

  const handleSaveDefaultIncome = () => {
    const parsedIncome = parseFloat(inputDefaultIncome);
    if (isNaN(parsedIncome) || parsedIncome < 0) {
      toast.error("Prašome įvesti teigiamą numatytąją pajamų sumą.");
      return;
    }
    onSaveIncome(parsedIncome, 'default');
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Mėnesio pajamų nustatymai</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="month-income-input" className="text-lg font-semibold">
            Pajamos pasirinktam mėnesiui ({selectedMonthYear})
          </Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="month-income-input"
              type="number"
              value={inputMonthIncome}
              onChange={(e) => setInputMonthIncome(e.target.value)}
              placeholder="0.00"
              step="0.01"
            />
            <Button onClick={handleSaveMonthIncome}>Išsaugoti</Button>
          </div>
          {currentMonthSpecificIncome === undefined && (
            <p className="text-sm text-muted-foreground mt-1">
              Šiam mėnesiui nustatytos numatytosios pajamos: {defaultMonthlyIncome.toFixed(2)} €
            </p>
          )}
        </div>

        <div className="border-t pt-4">
          <Label htmlFor="default-income-input" className="text-lg font-semibold">
            Numatytosios mėnesio pajamos (visada)
          </Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="default-income-input"
              type="number"
              value={inputDefaultIncome}
              onChange={(e) => setInputDefaultIncome(e.target.value)}
              placeholder="0.00"
              step="0.01"
            />
            <Button onClick={handleSaveDefaultIncome}>Išsaugoti</Button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Ši suma bus naudojama mėnesiams, kuriems nenustatytos individualios pajamos.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyBudgetSettings;
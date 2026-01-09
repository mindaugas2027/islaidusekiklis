import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Importuojame Select komponentus

interface MonthlyBudgetSettingsProps {
  monthlyIncomes: { [key: string]: number };
  defaultMonthlyIncome: number;
  onSaveIncome: (income: number, type: 'default' | 'month', monthYear?: string) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void; // Nauja prop
  selectedYear: string;
  setSelectedYear: (year: string) => void; // Nauja prop
  availableYears: string[]; // Nauja prop
}

const months = [ // Perkeliame mėnesių sąrašą čia, kad būtų prieinamas
  { value: "01", label: "Sausis" },
  { value: "02", label: "Vasaris" },
  { value: "03", label: "Kovas" },
  { value: "04", label: "Balandis" },
  { value: "05", label: "Gegužė" },
  { value: "06", label: "Birželis" },
  { value: "07", label: "Liepa" },
  { value: "08", label: "Rugpjūtis" },
  { value: "09", label: "Rugsėjis" },
  { value: "10", label: "Spalis" },
  { value: "11", label: "Lapkritis" },
  { value: "12", label: "Gruodis" },
];

const MonthlyBudgetSettings: React.FC<MonthlyBudgetSettingsProps> = ({
  monthlyIncomes,
  defaultMonthlyIncome,
  onSaveIncome,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  availableYears,
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
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <div className="flex-1">
            <Label htmlFor="month-select-settings">Mėnuo</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger id="month-select-settings">
                <SelectValue placeholder="Pasirinkite mėnesį" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label htmlFor="year-select-settings">Metai</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger id="year-select-settings">
                <SelectValue placeholder="Pasirinkite metus" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

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
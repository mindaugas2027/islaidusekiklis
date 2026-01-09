import React, { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/DatePicker";

interface MonthlyBudgetSettingsProps {
  monthlyIncomes: { [key: string]: number };
  defaultMonthlyIncome: number;
  onSaveIncome: (income: number, type: 'default' | 'month', monthYear?: string) => void;
}

const months = [
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
}) => {
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const currentYear = String(new Date().getFullYear());
  const [editingMonth, setEditingMonth] = useState<string>(currentMonth);
  const [editingYear, setEditingYear] = useState<string>(currentYear);
  const [inputMonthIncome, setInputMonthIncome] = useState<string>("");
  const [inputDefaultIncome, setInputDefaultIncome] = useState<string>(defaultMonthlyIncome.toFixed(2));
  const [defaultIncomeStartDate, setDefaultIncomeStartDate] = useState<Date | undefined>(new Date());

  const editingMonthYear = `${editingYear}-${editingMonth}`;
  const currentMonthSpecificIncome = monthlyIncomes[editingMonthYear];

  // Generate available years for the settings dropdown
  const availableYearsForSettings = useMemo(() => {
    const years = new Set<string>();
    const current = new Date().getFullYear();
    for (let i = current - 5; i <= current + 5; i++) { // Show a range of years
      years.add(String(i));
    }
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, []);

  useEffect(() => {
    // Properly handle when income is 0
    if (currentMonthSpecificIncome !== undefined) {
      setInputMonthIncome(currentMonthSpecificIncome.toFixed(2));
    } else {
      setInputMonthIncome("");
    }
  }, [currentMonthSpecificIncome, editingMonth, editingYear]); // Added editingMonth, editingYear to dependencies

  useEffect(() => {
    setInputDefaultIncome(defaultMonthlyIncome.toFixed(2));
  }, [defaultMonthlyIncome]);

  const handleSaveMonthIncome = () => {
    // Handle empty input as a request to remove specific month income
    if (inputMonthIncome === "") {
      // Remove specific month income by saving null/undefined
      onSaveIncome(0, 'month', editingMonthYear);
      toast.success(`Mėnesio ${editingMonthYear} pajamos pašalintos. Bus naudojamos numatytosios pajamos.`);
      return;
    }

    // Allow 0 as a valid value
    const parsedIncome = parseFloat(inputMonthIncome);
    if (isNaN(parsedIncome) || parsedIncome < 0) {
      toast.error("Prašome įvesti teigiamą pajamų sumą pasirinktam mėnesiui.");
      return;
    }

    onSaveIncome(parsedIncome, 'month', editingMonthYear);
  };

  const handleSaveDefaultIncome = () => {
    const parsedIncome = parseFloat(inputDefaultIncome);
    // Allow 0 as a valid value
    if (isNaN(parsedIncome) || parsedIncome < 0) {
      toast.error("Prašome įvesti teigiamą numatytąją pajamų sumą.");
      return;
    }

    onSaveIncome(parsedIncome, 'default');
  };

  const handleSaveDefaultIncomeWithDate = () => {
    if (!defaultIncomeStartDate) {
      toast.error("Prašome pasirinkti pradžios datą.");
      return;
    }

    const parsedIncome = parseFloat(inputDefaultIncome);
    if (isNaN(parsedIncome) || parsedIncome < 0) {
      toast.error("Prašome įvesti teigiamą numatytąją pajamų sumą.");
      return;
    }

    // Calculate which months should use this new default income
    const startYear = defaultIncomeStartDate.getFullYear();
    const startMonth = String(defaultIncomeStartDate.getMonth() + 1).padStart(2, '0');

    // Set the new default income
    onSaveIncome(parsedIncome, 'default');

    // Clear specific month incomes from the start date onward
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');

    // Clear months from start date to current date
    for (let year = startYear; year <= currentYear; year++) {
      const startM = year === startYear ? parseInt(startMonth) : 1;
      const endM = year === currentYear ? parseInt(currentMonth) : 12;

      for (let month = startM; month <= endM; month++) {
        const monthStr = String(month).padStart(2, '0');
        const monthYear = `${year}-${monthStr}`;

        // Only clear if this month has a specific income set
        if (monthlyIncomes[monthYear] !== undefined) {
          onSaveIncome(0, 'month', monthYear);
        }
      }
    }

    toast.success(`Numatytosios pajamos (${parsedIncome.toFixed(2)} €) nustatytos nuo ${defaultIncomeStartDate.toLocaleDateString()} ir bus taikomos visiems mėnesiams nuo šios datos.`);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Mėnesio pajamų nustatymai</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center">
          <div className="flex-1">
            <Label htmlFor="month-select-settings">Mėnuo</Label>
            <Select value={editingMonth} onValueChange={setEditingMonth}>
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
            <Select value={editingYear} onValueChange={setEditingYear}>
              <SelectTrigger id="year-select-settings">
                <SelectValue placeholder="Pasirinkite metus" />
              </SelectTrigger>
              <SelectContent>
                {availableYearsForSettings.map((year) => (
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
            Pajamos pasirinktam mėnesiui ({editingMonthYear})
          </Label>
          <div className="flex flex-col sm:flex-row gap-2 mt-1">
            <Input
              id="month-income-input"
              type="number"
              value={inputMonthIncome}
              onChange={(e) => setInputMonthIncome(e.target.value)}
              placeholder="0.00"
              step="0.01"
              className="flex-grow"
            />
            <Button onClick={handleSaveMonthIncome} className="w-full sm:w-auto">
              Išsaugoti
            </Button>
          </div>
          {currentMonthSpecificIncome !== undefined && (
            <p className="text-sm text-muted-foreground mt-1">
              Šiuo metu nustatytos {currentMonthSpecificIncome.toFixed(2)} € pajamos. Palikite tuščią lauką ir išsaugokite, jei norite naudoti numatytąsias pajamas.
            </p>
          )}
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
          <div className="flex flex-col sm:flex-row gap-2 mt-1">
            <Input
              id="default-income-input"
              type="number"
              value={inputDefaultIncome}
              onChange={(e) => setInputDefaultIncome(e.target.value)}
              placeholder="0.00"
              step="0.01"
              className="flex-grow"
            />
            <Button onClick={handleSaveDefaultIncome} className="w-full sm:w-auto">
              Išsaugoti
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Ši suma bus naudojama mėnesiams, kuriems nenustatytos individualios pajamos.
          </p>
        </div>
        <div className="border-t pt-4">
          <Label className="text-lg font-semibold">
            Nustatyti numatytąsias pajamas nuo datos
          </Label>
          <div className="space-y-2 mt-1">
            <DatePicker
              date={defaultIncomeStartDate}
              setDate={setDefaultIncomeStartDate}
              placeholder="Pasirinkite pradžios datą"
            />
            <Button
              onClick={handleSaveDefaultIncomeWithDate}
              className="w-full"
              variant="secondary"
            >
              Nustatyti numatytąsias pajamas nuo šios datos
            </Button>
            <p className="text-sm text-muted-foreground">
              Ši funkcija nustatys numatytąsias pajamas ir ištrins individualias pajamas nuo pasirinktos datos iki šiol.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyBudgetSettings;
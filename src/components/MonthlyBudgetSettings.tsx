import React, { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/DatePicker";
import { X } from "lucide-react";

interface MonthlyBudgetSettingsProps {
  monthlyIncomes: { [key: string]: number };
  defaultMonthlyIncome: number;
  onSaveIncome: (income: number, type: 'default' | 'month', monthYear?: string) => void;
}

interface DateBasedIncome {
  id: string;
  startDate: Date;
  income: number;
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
  const [dateBasedIncomes, setDateBasedIncomes] = useState<DateBasedIncome[]>([]);
  const [newIncomeDate, setNewIncomeDate] = useState<Date | undefined>(new Date());
  const [newIncomeAmount, setNewIncomeAmount] = useState<string>("");

  const editingMonthYear = `${editingYear}-${editingMonth}`;
  const currentMonthSpecificIncome = monthlyIncomes[editingMonthYear];

  // Generate available years for the settings dropdown
  const availableYearsForSettings = useMemo(() => {
    const years = new Set<string>();
    const current = new Date().getFullYear();
    for (let i = current - 5; i <= current + 5; i++) {
      years.add(String(i));
    }
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, []);

  useEffect(() => {
    if (currentMonthSpecificIncome !== undefined) {
      setInputMonthIncome(currentMonthSpecificIncome.toFixed(2));
    } else {
      setInputMonthIncome("");
    }
  }, [currentMonthSpecificIncome, editingMonth, editingYear]);

  useEffect(() => {
    setInputDefaultIncome(defaultMonthlyIncome.toFixed(2));
  }, [defaultMonthlyIncome]);

  const handleSaveMonthIncome = () => {
    if (inputMonthIncome === "") {
      onSaveIncome(0, 'month', editingMonthYear);
      toast.success(`Mėnesio ${editingMonthYear} pajamos pašalintos. Bus naudojamos numatytosios pajamos.`);
      return;
    }

    const parsedIncome = parseFloat(inputMonthIncome);
    if (isNaN(parsedIncome) || parsedIncome < 0) {
      toast.error("Prašome įvesti teigiamą pajamų sumą pasirinktam mėnesiui.");
      return;
    }

    onSaveIncome(parsedIncome, 'month', editingMonthYear);
  };

  const handleSaveDefaultIncome = () => {
    const parsedIncome = parseFloat(inputDefaultIncome);
    if (isNaN(parsedIncome) || parsedIncome < 0) {
      toast.error("Prašome įvesti teigiamą numatytąją pajamų sumą.");
      return;
    }

    onSaveIncome(parsedIncome, 'default');
  };

  const handleAddDateBasedIncome = () => {
    if (!newIncomeDate) {
      toast.error("Prašome pasirinkti pradžios datą.");
      return;
    }

    const parsedIncome = parseFloat(newIncomeAmount);
    if (isNaN(parsedIncome) || parsedIncome < 0) {
      toast.error("Prašome įvesti teigiamą pajamų sumą.");
      return;
    }

    const newIncome: DateBasedIncome = {
      id: `date-income-${Date.now()}`,
      startDate: newIncomeDate,
      income: parsedIncome,
    };

    setDateBasedIncomes(prev => [...prev, newIncome].sort((a, b) => b.startDate.getTime() - a.startDate.getTime()));
    setNewIncomeAmount("");
    toast.success(`Naujos pajamos (${parsedIncome.toFixed(2)} €) pridėtos nuo ${newIncomeDate.toLocaleDateString()}.`);
  };

  const handleDeleteDateBasedIncome = (id: string) => {
    setDateBasedIncomes(prev => prev.filter(income => income.id !== id));
    toast.success("Pajamų nustatymas sėkmingai ištrintas.");
  };

  const getCurrentIncomeForDate = (date: Date): number => {
    // Find the most recent date-based income that is on or before the given date
    const applicableIncome = dateBasedIncomes
      .filter(income => income.startDate <= date)
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())[0];

    return applicableIncome ? applicableIncome.income : defaultMonthlyIncome;
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
            Nustatyti pajamas nuo datos
          </Label>
          <div className="space-y-2 mt-1">
            <DatePicker
              date={newIncomeDate}
              setDate={setNewIncomeDate}
              placeholder="Pasirinkite pradžios datą"
            />
            <Input
              type="number"
              value={newIncomeAmount}
              onChange={(e) => setNewIncomeAmount(e.target.value)}
              placeholder="Pajamų suma"
              step="0.01"
              className="mt-2"
            />
            <Button
              onClick={handleAddDateBasedIncome}
              className="w-full"
              variant="secondary"
            >
              Pridėti pajamų nustatymą
            </Button>
            <p className="text-sm text-muted-foreground">
              Ši funkcija leidžia nustatyti pajamas, kurios bus taikomos nuo pasirinktos datos.
            </p>
          </div>
        </div>
        {dateBasedIncomes.length > 0 && (
          <div className="border-t pt-4">
            <Label className="text-lg font-semibold">
              Esami pajamų nustatymai
            </Label>
            <div className="space-y-2 mt-2">
              {dateBasedIncomes.map((income) => (
                <div key={income.id} className="flex items-center justify-between p-2 border rounded-md bg-secondary">
                  <div>
                    <p className="font-medium">
                      {income.income.toFixed(2)} € nuo {income.startDate.toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDateBasedIncome(income.id)}
                    className="h-auto p-1"
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MonthlyBudgetSettings;
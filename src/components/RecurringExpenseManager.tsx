import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { X } from "lucide-react";
import { RecurringExpense } from "@/types/recurringExpense";

interface RecurringExpenseManagerProps {
  recurringExpenses: RecurringExpense[];
  categories: string[];
  onAddRecurringExpense: (expense: Omit<RecurringExpense, "id">) => void;
  onDeleteRecurringExpense: (id: string) => void;
}

const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

const RecurringExpenseManager: React.FC<RecurringExpenseManagerProps> = ({
  recurringExpenses,
  categories,
  onAddRecurringExpense,
  onDeleteRecurringExpense,
}) => {
  const [name, setName] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<string>(categories.length > 0 ? categories[0] : "");
  const [dayOfMonth, setDayOfMonth] = useState<string>("1");

  const handleAddRecurringExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    const parsedDayOfMonth = parseInt(dayOfMonth);
    
    if (!name.trim()) {
      toast.error("Prašome įvesti pasikartojančios išlaidos pavadinimą.");
      return;
    }
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Prašome įvesti teigiamą sumą.");
      return;
    }
    
    if (!category) {
      toast.error("Prašome pasirinkti kategoriją.");
      return;
    }
    
    if (isNaN(parsedDayOfMonth) || parsedDayOfMonth < 1 || parsedDayOfMonth > 31) {
      toast.error("Prašome pasirinkti galiojančią mėnesio dieną (1-31).");
      return;
    }
    
    onAddRecurringExpense({
      name: name.trim(),
      amount: parsedAmount,
      category,
      day_of_month: parsedDayOfMonth, // Use correct column name
    });
    
    setName("");
    setAmount("");
    setCategory(categories.length > 0 ? categories[0] : "");
    setDayOfMonth("1");
    toast.success(`Pasikartojanti išlaida "${name.trim()}" pridėta.`);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Pasikartojančios išlaidos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleAddRecurringExpense} className="space-y-4">
          <div>
            <Label htmlFor="recurring-name">Pavadinimas</Label>
            <Input 
              id="recurring-name" 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Pvz., Būsto paskola" 
              required 
            />
          </div>
          <div>
            <Label htmlFor="recurring-amount">Suma (€)</Label>
            <Input 
              id="recurring-amount" 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              placeholder="0.00" 
              step="0.01" 
              required 
            />
          </div>
          <div>
            <Label htmlFor="recurring-category">Kategorija</Label>
            <Select 
              value={category} 
              onValueChange={(value: string) => setCategory(value)} 
              disabled={categories.length === 0}
            >
              <SelectTrigger id="recurring-category">
                <SelectValue placeholder={categories.length === 0 ? "Nėra kategorijų" : "Pasirinkite kategoriją"} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="recurring-day">Mėnesio diena</Label>
            <Select 
              value={dayOfMonth} 
              onValueChange={setDayOfMonth}
            >
              <SelectTrigger id="recurring-day">
                <SelectValue placeholder="Pasirinkite dieną" />
              </SelectTrigger>
              <SelectContent>
                {daysInMonth.map((day) => (
                  <SelectItem key={day} value={String(day)}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={categories.length === 0}
          >
            Pridėti pasikartojančią išlaidą
          </Button>
        </form>
        
        {recurringExpenses.length === 0 ? (
          <p className="text-center text-gray-500">Kol kas nėra pasikartojančių išlaidų.</p>
        ) : (
          <div className="space-y-2">
            <Label className="text-lg font-semibold">Esamos pasikartojančios išlaidos:</Label>
            <ul className="grid grid-cols-1 gap-2">
              {recurringExpenses.map((expense) => (
                <li 
                  key={expense.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-2 border rounded-md bg-secondary text-secondary-foreground gap-2"
                >
                  <div>
                    <span className="font-medium">{expense.name}</span>
                    <p className="text-sm text-muted-foreground">
                      {expense.amount.toFixed(2)} € | {expense.category} | Kiekvieno mėnesio {expense.day_of_month} d.
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onDeleteRecurringExpense(expense.id)} 
                    className="h-auto p-1 self-end sm:self-auto"
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

export default RecurringExpenseManager;
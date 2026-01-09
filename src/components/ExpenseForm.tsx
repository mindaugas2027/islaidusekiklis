import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Expense } from "@/types/expense";
import { toast } from "sonner";
import { DatePicker } from "@/components/DatePicker";

interface ExpenseFormProps {
  onAddExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  categories: string[];
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAddExpense, categories }) => {
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<string>(categories.length > 0 ? categories[0] : "");
  const [description, setDescription] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update category state if categories change and current category is no longer valid
  useEffect(() => {
    if (categories.length > 0 && !categories.includes(category)) {
      setCategory(categories[0]);
    } else if (categories.length === 0) {
      setCategory(""); // Clear category if no categories exist
    }
  }, [categories, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Prašome įvesti teigiamą sumą.");
      return;
    }
    if (!category) {
      toast.error("Prašome pasirinkti kategoriją.");
      return;
    }
    if (!date) {
      toast.error("Prašome pasirinkti datą.");
      return;
    }
    setIsSubmitting(true);
    const newExpense: Omit<Expense, 'id'> = {
      amount: parsedAmount,
      category,
      description: description.trim(),
      date: date.toISOString().split("T")[0], // Konvertuojame Date į YYYY-MM-DD stringą
    };
    try {
      await onAddExpense(newExpense);
      // Reset form immediately for better UX
      setAmount("");
      setDescription("");
      setDate(new Date());
    } catch (error) {
      toast.error("Nepavyko pridėti išlaidos");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Pridėti naują išlaidą</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Suma (€)</Label>
            <Input 
              id="amount" 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              placeholder="0.00" 
              step="0.01" 
              required 
            />
          </div>
          <div>
            <Label htmlFor="category">Kategorija</Label>
            <Select 
              value={category} 
              onValueChange={(value: string) => setCategory(value)} 
              disabled={categories.length === 0 || isSubmitting}
            >
              <SelectTrigger id="category">
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
            <Label htmlFor="description">Aprašymas (neprivaloma)</Label>
            <Input 
              id="description" 
              type="text" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Pvz., Nike batai" 
              disabled={isSubmitting} 
            />
          </div>
          <div>
            <Label htmlFor="date">Data</Label>
            <DatePicker date={date} setDate={setDate} placeholder="Pasirinkite datą" />
          </div>
          <Button type="submit" className="w-full" disabled={categories.length === 0 || isSubmitting}>
            {isSubmitting ? "Pridedama..." : "Pridėti išlaidą"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ExpenseForm;
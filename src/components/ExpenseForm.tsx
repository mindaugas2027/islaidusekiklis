import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Expense } from "@/types/expense";
import { toast } from "sonner";

interface ExpenseFormProps {
  onAddExpense: (expense: Expense) => void;
  categories: string[]; // Added categories prop
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAddExpense, categories }) => {
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<string>(categories.length > 0 ? categories[0] : ""); // Default to first category or empty
  const [description, setDescription] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Prašome įvesti teigiamą sumą.");
      return;
    }
    if (!description.trim()) {
      toast.error("Prašome įvesti aprašymą.");
      return;
    }
    if (!category) {
      toast.error("Prašome pasirinkti kategoriją.");
      return;
    }

    const newExpense: Expense = {
      id: Date.now().toString(),
      amount: parsedAmount,
      category,
      description,
      date,
    };

    onAddExpense(newExpense);
    setAmount("");
    setDescription("");
    setDate(new Date().toISOString().split("T")[0]);
    toast.success("Išlaida sėkmingai pridėta!");
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
            <Select value={category} onValueChange={(value: string) => setCategory(value)}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Pasirinkite kategoriją" />
              </SelectTrigger>
              <SelectContent>
                {categories.length === 0 ? (
                  <SelectItem value="" disabled>Nėra kategorijų</SelectItem>
                ) : (
                  categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="description">Aprašymas</Label>
            <Input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Pvz., Pirkimas parduotuvėje"
              required
            />
          </div>
          <div>
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={categories.length === 0}>
            Pridėti išlaidą
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ExpenseForm;
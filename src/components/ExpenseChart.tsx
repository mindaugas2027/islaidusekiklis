import React, { useState, useMemo } from "react";
import { Expense, ExpenseCategory } from "@/types/expense"; // Using @ alias
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ExpenseChartProps {
  expenses: Expense[];
}

const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF", "#FF1957", "#19FFD4", "#FFD419",
  "#8884d8", "#82ca9d", "#ffc658", "#d0ed57", "#a4de6c", "#d04a4a", "#f45b5b", "#f7a35c"
];

const ExpenseChart: React.FC<ExpenseChartProps> = ({ expenses }) => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<string>(String(currentMonth).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    expenses.forEach(expense => years.add(new Date(expense.date).getFullYear().toString()));
    years.add(String(currentYear)); // Always include current year
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [expenses, currentYear]);

  const chartData = useMemo(() => {
    const filteredExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const expenseMonth = String(expenseDate.getMonth() + 1).padStart(2, '0');
      const expenseYear = String(expenseDate.getFullYear());
      return expenseMonth === selectedMonth && expenseYear === selectedYear;
    });

    const categoryTotals: { [key: string]: number } = {};
    filteredExpenses.forEach((expense) => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });

    return Object.entries(categoryTotals).map(([category, amount]) => ({
      name: category,
      value: parseFloat(amount.toFixed(2)),
    }));
  }, [expenses, selectedMonth, selectedYear]);

  const totalExpenses = chartData.reduce((sum, entry) => sum + entry.value, 0);

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

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Mėnesio išlaidų apžvalga</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-center">
          <div className="flex-1">
            <Label htmlFor="month-select">Mėnuo</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger id="month-select">
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
            <Label htmlFor="year-select">Metai</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger id="year-select">
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

        {totalExpenses === 0 ? (
          <p className="text-center text-gray-500">Nėra išlaidų pasirinktam mėnesiui.</p>
        ) : (
          <>
            <p className="text-center text-lg font-semibold mb-4">
              Viso išleista: {totalExpenses.toFixed(2)} €
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} €`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ExpenseChart;
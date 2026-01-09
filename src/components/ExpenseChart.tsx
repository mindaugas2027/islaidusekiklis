import React, { useMemo } from "react";
import { Expense } from "@/types/expense";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ExpenseChartProps {
  expenses: Expense[];
  selectedMonth: string;
  selectedYear: string;
}

const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF", "#FF1957", "#19FFD4", "#FFD419",
  "#8884d8", "#82ca9d", "#ffc658", "#d0ed57", "#a4de6c", "#d04a4a", "#f45b5b", "#f7a35c"
];

const ExpenseChart: React.FC<ExpenseChartProps> = ({ expenses, selectedMonth, selectedYear }) => {

  const chartData = useMemo(() => {
    // Expenses are already filtered by selectedMonth and selectedYear in Index.tsx
    // so we just need to aggregate them by category.
    const categoryTotals: { [key: string]: number } = {};
    expenses.forEach((expense) => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });

    return Object.entries(categoryTotals).map(([category, amount]) => ({
      name: category,
      value: parseFloat(amount.toFixed(2)),
    }));
  }, [expenses]); // Depend only on expenses, as they are already filtered

  const totalExpenses = chartData.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Mėnesio išlaidų apžvalga</CardTitle>
      </CardHeader>
      <CardContent>
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
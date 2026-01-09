import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BudgetOverviewChartProps {
  monthlyIncome: number;
  totalExpenses: number;
}

const BudgetOverviewChart: React.FC<BudgetOverviewChartProps> = ({ monthlyIncome, totalExpenses }) => {
  const remainingBudget = monthlyIncome - totalExpenses;
  const isOverBudget = remainingBudget < 0;

  let chartData = [];
  let COLORS = [];

  if (monthlyIncome <= 0) {
    // If no income, cannot calculate percentages for a pie chart
    chartData = [];
  } else if (isOverBudget) {
    // If over budget, show 100% used (of the income) and indicate overspending in text
    chartData = [
      { name: "Panaudota (viršyta)", value: monthlyIncome },
    ];
    COLORS = ["hsl(var(--destructive))"]; // Red for over budget
  } else {
    // Normal scenario: show used and remaining
    chartData = [
      { name: "Panaudota", value: totalExpenses },
      { name: "Liko", value: remainingBudget },
    ];
    COLORS = ["hsl(var(--primary))", "hsl(142.1 76.2% 36.3%)"]; // Blue for used, Green for remaining
  }

  const usedPercentage = monthlyIncome > 0 ? (totalExpenses / monthlyIncome) * 100 : 0;
  const remainingPercentage = monthlyIncome > 0 ? (remainingBudget / monthlyIncome) * 100 : 0;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Mėnesio biudžeto apžvalga</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-center text-lg">
        {monthlyIncome <= 0 ? (
          <p className="text-center text-gray-500">Nėra nustatytų mėnesio pajamų, negalima parodyti biudžeto apžvalgos.</p>
        ) : (
          <>
            <p className="font-semibold">Nustatytos mėnesio pajamos: <span className="text-primary">{monthlyIncome.toFixed(2)} €</span></p>
            <p className="font-semibold">Viso išleista: <span className="text-destructive">{totalExpenses.toFixed(2)} €</span></p>
            <p className={`font-bold ${isOverBudget ? "text-destructive" : "text-green-600"}`}>
              {isOverBudget ? "Viršytas biudžetas:" : "Liko biudžeto:"} {remainingBudget.toFixed(2)} €
            </p>

            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toFixed(2)} €`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>

            <div className="mt-4 text-sm text-gray-600">
              <p>Panaudota: {usedPercentage.toFixed(2)}%</p>
              {monthlyIncome > 0 && !isOverBudget && (
                <p>Liko: {remainingPercentage.toFixed(2)}%</p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BudgetOverviewChart;
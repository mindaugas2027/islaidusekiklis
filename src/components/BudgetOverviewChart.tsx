import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BudgetOverviewChartProps {
  monthlyIncome: number;
  totalExpenses: number;
}

const BudgetOverviewChart: React.FC<BudgetOverviewChartProps> = ({ monthlyIncome, totalExpenses }) => {
  const remainingBudget = monthlyIncome - totalExpenses;
  const isOverBudget = remainingBudget < 0;

  let chartData: any[] = [];
  let chartBars: JSX.Element[] = [];

  if (monthlyIncome <= 0) {
    // No chart if no income
    chartData = [];
  } else if (isOverBudget) {
    // If over budget, show total expenses and the deficit
    chartData = [
      {
        name: "Mėnesio biudžetas", // 'name' property is still useful for Tooltip/Legend
        pajamos: monthlyIncome,
        išlaidos: totalExpenses,
        deficitas: Math.abs(remainingBudget),
      },
    ];
    chartBars = [
      <Bar key="pajamos" dataKey="pajamos" fill="hsl(var(--primary))" name="Pajamos" />,
      <Bar key="išlaidos" dataKey="išlaidos" fill="hsl(var(--destructive))" name="Išlaidos" />,
    ];
  } else {
    // Within budget, show used and remaining as a stacked bar
    chartData = [
      {
        name: "Mėnesio biudžetas", // 'name' property is still useful for Tooltip/Legend
        panaudota: totalExpenses,
        liko: remainingBudget,
      },
    ];
    chartBars = [
      <Bar key="panaudota" dataKey="panaudota" stackId="a" fill="hsl(var(--primary))" name="Panaudota" />,
      <Bar key="liko" dataKey="liko" stackId="a" fill="hsl(142.1 76.2% 36.3%)" name="Liko" />,
    ];
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

            <ResponsiveContainer width="100%" height={150}>
              <BarChart
                layout="vertical"
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--muted))" />
                <XAxis type="number" stroke="hsl(var(--foreground))" />
                <YAxis dataKey="name" type="category" hide={true} /> {/* YAxis paslėptas, bet išlaikytas dėl duomenų struktūros */}
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(2)} €`}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "0.5rem",
                  }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Legend />
                {chartBars}
              </BarChart>
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
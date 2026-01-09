import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MonthlyLineChartProps {
  monthlyData: { name: string; total: number }[];
  selectedYear: string;
}

const MonthlyLineChart: React.FC<MonthlyLineChartProps> = ({ monthlyData, selectedYear }) => {
  const hasData = monthlyData.some(item => item.total > 0);

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          {selectedYear} metų mėnesinių išlaidų tendencijos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="text-center text-gray-500">Nėra išlaidų pasirinktiems metams.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={monthlyData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
              <YAxis stroke="hsl(var(--foreground))" />
              <Tooltip
                formatter={(value: number) => `${value.toFixed(2)} €`}
                labelFormatter={(label: string) => `${label} mėnuo`}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="total"
                stroke="hsl(var(--primary))"
                activeDot={{ r: 8 }}
                name="Išlaidos"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default MonthlyLineChart;
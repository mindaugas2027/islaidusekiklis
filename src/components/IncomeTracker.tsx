import React from "react";
import BudgetOverviewChart from "./BudgetOverviewChart"; // Importuojame naują diagramos komponentą

interface IncomeTrackerProps {
  monthlyIncome: number;
  totalExpenses: number;
  previousMonthCarryOver: number; // Nors prop'as lieka, jis nebebus rodomas
}

const IncomeTracker: React.FC<IncomeTrackerProps> = ({ monthlyIncome, totalExpenses, previousMonthCarryOver }) => {
  // IncomeTracker dabar tiesiog atvaizduos BudgetOverviewChart
  return (
    <BudgetOverviewChart
      monthlyIncome={monthlyIncome}
      totalExpenses={totalExpenses}
    />
  );
};

export default IncomeTracker;
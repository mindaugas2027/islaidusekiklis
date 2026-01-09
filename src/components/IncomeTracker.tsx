import React from "react";
import BudgetOverviewChart from "./BudgetOverviewChart";

interface IncomeTrackerProps {
  monthlyIncome: number;
  totalExpenses: number;
  previousMonthCarryOver: number;
}

const IncomeTracker: React.FC<IncomeTrackerProps> = ({
  monthlyIncome,
  totalExpenses,
  previousMonthCarryOver
}) => {
  // IncomeTracker dabar tiesiog atvaizduos BudgetOverviewChart
  return (
    <BudgetOverviewChart 
      monthlyIncome={monthlyIncome} 
      totalExpenses={totalExpenses} 
    />
  );
};

export default IncomeTracker;
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthYearNavigatorProps {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
}

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

const MonthYearNavigator: React.FC<MonthYearNavigatorProps> = ({
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
}) => {
  const handlePreviousMonth = () => {
    let currentMonthIndex = months.findIndex(m => m.value === selectedMonth);
    let newMonthValue = "";
    let newYearValue = selectedYear;
    
    if (currentMonthIndex === 0) {
      // January, go to December of previous year
      newMonthValue = "12";
      newYearValue = String(parseInt(selectedYear) - 1);
    } else {
      newMonthValue = months[currentMonthIndex - 1].value;
    }
    
    setSelectedMonth(newMonthValue);
    setSelectedYear(newYearValue);
  };

  const handleNextMonth = () => {
    let currentMonthIndex = months.findIndex(m => m.value === selectedMonth);
    let newMonthValue = "";
    let newYearValue = selectedYear;
    
    if (currentMonthIndex === months.length - 1) {
      // December, go to January of next year
      newMonthValue = "01";
      newYearValue = String(parseInt(selectedYear) + 1);
    } else {
      newMonthValue = months[currentMonthIndex + 1].value;
    }
    
    setSelectedMonth(newMonthValue);
    setSelectedYear(newYearValue);
  };

  const currentMonthLabel = months.find(m => m.value === selectedMonth)?.label;

  return (
    <div className="flex items-center justify-center gap-4 p-2 border rounded-md bg-card shadow-sm">
      <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Ankstesnis mėnuo</span>
      </Button>
      
      <span className="text-lg font-semibold min-w-[120px] text-center">
        {currentMonthLabel} {selectedYear}
      </span>
      
      <Button variant="outline" size="icon" onClick={handleNextMonth}>
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Kitas mėnuo</span>
      </Button>
    </div>
  );
};

export default MonthYearNavigator;
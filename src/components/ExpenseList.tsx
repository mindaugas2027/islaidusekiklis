import React from "react";
import { Expense } from "@/types/expense";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface ExpenseListProps {
  expenses: Expense[];
  onDeleteExpense: (id: string) => Promise<void>;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onDeleteExpense }) => {
  const [deletingIds, setDeletingIds] = React.useState<Set<string>>(new Set());

  const handleDelete = async (id: string) => {
    // Immediately add to deleting set for UI feedback
    setDeletingIds(prev => new Set(prev).add(id));
    
    try {
      await onDeleteExpense(id);
      // Success message is handled in the hook
    } catch (error) {
      toast.error("Nepavyko ištrinti išlaidos");
      // Remove from deleting set if failed
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // Filter out expenses that are being deleted
  const visibleExpenses = expenses.filter(expense => !deletingIds.has(expense.id));

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Visos išlaidos</CardTitle>
      </CardHeader>
      <CardContent>
        {visibleExpenses.length === 0 ? (
          <p className="text-center text-gray-500">Kol kas nėra išlaidų. Pridėkite naują!</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Data</TableHead>
                  <TableHead className="whitespace-nowrap">Aprašymas</TableHead>
                  <TableHead className="whitespace-nowrap">Kategorija</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Suma (€)</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Veiksmai</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleExpenses
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="whitespace-nowrap">{expense.date}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{expense.description}</TableCell>
                      <TableCell className="whitespace-nowrap">{expense.category}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">{expense.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDelete(expense.id)}
                          disabled={deletingIds.has(expense.id)}
                        >
                          {deletingIds.has(expense.id) ? "Trinama..." : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExpenseList;
import { useMemo } from 'react';
import { Expense } from '../types/expense';
import { useTravelStore } from '../store/useTravelStore';

export function useExpenses(tripId?: string) {
  const { expenses: allExpenses, addExpense, updateExpense: updateStoreExpense, deleteExpense } = useTravelStore();

  const expenses = useMemo(() => {
    let list = allExpenses;
    if (tripId) list = list.filter(e => e.tripId === tripId);
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allExpenses, tripId]);

  const saveExpense = (expense: Expense, isEditing: boolean) => {
    if (isEditing) {
      updateStoreExpense(expense.id, expense);
    } else {
      addExpense(expense);
    }
  };

  return {
    expenses,
    saveExpense,
    deleteExpense
  };
}

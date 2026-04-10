import { useState } from 'react';
import { Expense } from '../types/expense';

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const addExpense = (expense: Expense) => {
    setExpenses(prev => [expense, ...prev]);
  };

  const updateExpense = (expense: Expense) => {
    setExpenses(prev => prev.map(e => e.id === expense.id ? expense : e));
  };

  const saveExpense = (expense: Expense, isEditing: boolean) => {
    if (isEditing) {
      updateExpense(expense);
    } else {
      addExpense(expense);
    }
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  return {
    expenses,
    saveExpense,
    deleteExpense
  };
}

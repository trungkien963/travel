import { useState } from 'react';
import { Expense } from '../types/expense';

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: 'e1',
      desc: 'Vé vào cổng Resort',
      amount: 1500000,
      payerId: 'm1',
      date: '2026-04-10',
      category: 'ACTIVITIES',
    },
    {
      id: 'e2',
      desc: 'Tiệc BBQ bãi biển',
      amount: 4200000,
      payerId: 'm2',
      date: '2026-04-10',
      category: 'FOOD',
    }
  ]);

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

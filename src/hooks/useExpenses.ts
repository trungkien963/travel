import { useMemo } from 'react';
import { Expense } from '../types/expense';
import { useTravelStore } from '../store/useTravelStore';
import { supabase } from '../lib/supabase';

export function useExpenses(tripId?: string) {
  const { expenses: allExpenses, addExpense, updateExpense: updateStoreExpense, deleteExpense } = useTravelStore();

  const expenses = useMemo(() => {
    let list = allExpenses;
    if (tripId) list = list.filter(e => e.tripId === tripId);
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allExpenses, tripId]);

  const saveExpense = async (expense: Expense, isEditing: boolean) => {
    if (isEditing) {
      updateStoreExpense(expense.id, expense);
      if (!expense.id.startsWith('e')) {
        await supabase.from('expenses').update({
          amount: expense.amount,
          description: expense.desc,
          category: expense.category || 'OTHER',
          splits: expense.splits || {}
        }).eq('id', expense.id);
      }
    } else {
      addExpense(expense);
      if (tripId && !tripId.startsWith('t')) {
        const { currentUserId } = useTravelStore.getState();
        const { data, error } = await supabase.from('expenses').insert({
          trip_id: tripId,
          payer_id: currentUserId,
          amount: expense.amount,
          description: expense.desc,
          category: expense.category || 'OTHER',
          splits: expense.splits || {}
        }).select().single();
        
        if (data) {
          updateStoreExpense(expense.id, { id: data.id });
        } else if (error) {
          console.error("Failed to sync expense to cloud", error);
        }
      }
    }
  };

  const deleteExpenseWrapper = async (id: string) => {
    deleteExpense(id);
    if (!id.startsWith('e')) {
      await supabase.from('expenses').delete().eq('id', id);
    }
  };

  return {
    expenses,
    saveExpense,
    deleteExpense: deleteExpenseWrapper
  };
}

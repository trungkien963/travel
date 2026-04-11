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
    const { setGlobalLoading } = useTravelStore.getState();
    setGlobalLoading(true);
    
    try {
      if (isEditing) {
        const { error } = await supabase.from('expenses').update({
          amount: expense.amount,
          description: expense.desc,
          category: expense.category || 'OTHER',
          splits: expense.splits || {}
        }).eq('id', expense.id);
        
        if (error) throw error;
        updateStoreExpense(expense.id, expense);
      } else {
        if (!tripId) throw new Error("Missing tripId");
        
        const { currentUserId, currentUserProfile, trips } = useTravelStore.getState();
        const trip = trips.find(t => t.id === tripId);
        const userMember = trip?.members?.find(m => m.id === currentUserId);
        const actorName = currentUserProfile?.name || userMember?.name || 'Traveler';
        const actorAvatar = currentUserProfile?.avatar || userMember?.avatar || undefined;

        const { data, error } = await supabase.from('expenses').insert({
          trip_id: tripId,
          payer_id: currentUserId,
          amount: expense.amount,
          description: expense.desc,
          category: expense.category || 'OTHER',
          splits: expense.splits || {}
        }).select().single();
        
        if (error) throw error;
        if (data) {
          addExpense({ ...expense, id: data.id });

          if (trip && trip.members) {
             const notifsToInsert = trip.members
              .filter(m => m.id !== currentUserId)
              .map(m => ({
                user_id: m.id,
                actor_name: actorName,
                actor_avatar: actorAvatar,
                type: 'EXPENSE_ADDED',
                message: `added an expense: ${expense.desc} - $${expense.amount}`,
                trip_id: tripId,
                expense_id: data.id,
                is_read: false
              }));
             if (notifsToInsert.length > 0) {
               await supabase.from('notifications').insert(notifsToInsert);
             }
          }
        }
      }
    } catch (error) {
      console.error("Save expense failed", error);
      alert("Failed to save expense. Please check your connection.");
    } finally {
      setGlobalLoading(false);
    }
  };

  const deleteExpenseWrapper = async (id: string) => {
    const { setGlobalLoading } = useTravelStore.getState();
    setGlobalLoading(true);
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      deleteExpense(id);
    } catch (e) {
      console.error("Delete expense failed", e);
      alert("Failed to delete expense.");
    } finally {
      setGlobalLoading(false);
    }
  };

  return {
    expenses,
    saveExpense,
    deleteExpense: deleteExpenseWrapper
  };
}

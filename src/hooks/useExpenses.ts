import { useMemo } from 'react';
import { Expense } from '../types/expense';
import { useTravelStore } from '../store/useTravelStore';
import { supabase, uploadMediaToSupabase } from '../lib/supabase';

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
      let uploadedReceipts = expense.receipts || [];
      if (expense.receipts && expense.receipts.length > 0) {
         uploadedReceipts = [];
         for (const uri of expense.receipts) {
           if (uri.startsWith('file://')) {
             try {
               const publicUrl = await uploadMediaToSupabase(uri);
               uploadedReceipts.push(publicUrl);
             } catch (e) {
               console.warn("Failed to upload receipt", e);
               uploadedReceipts.push(uri);
             }
           } else {
             uploadedReceipts.push(uri);
           }
         }
      }

      if (isEditing) {
        const { error } = await supabase.from('expenses').update({
          amount: expense.amount,
          description: expense.desc,
          category: expense.category || 'OTHER',
          splits: expense.splits || {},
          receipt_urls: uploadedReceipts
        }).eq('id', expense.id);
        
        if (error) throw error;
        updateStoreExpense(expense.id, { ...expense, receipts: uploadedReceipts });
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
          splits: expense.splits || {},
          receipt_urls: uploadedReceipts
        }).select().single();
        
        if (error) throw error;
        if (data) {
          addExpense({ ...expense, id: data.id, receipts: uploadedReceipts });
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
    const expense = allExpenses.find(e => e.id === id);
    setGlobalLoading(true);
    try {
      if (expense?.receipts?.length) {
        const pathsToDelete = expense.receipts
           .filter(url => url && url.includes('/nomadsync-media/'))
           .map(url => url.split('/nomadsync-media/')[1]);
        
        // Bypass Postgres trigger error
        await supabase.from('expenses').update({ receipt_urls: null }).eq('id', id);
        if (pathsToDelete.length > 0) {
           await supabase.storage.from('nomadsync-media').remove(pathsToDelete);
        }
      }

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

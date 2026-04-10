import { useMemo } from 'react';
import { Expense } from '../types/expense';
import { MOCK_MEMBERS } from '../constants/mockData';

export interface Debt {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
}

export function useBalances(expenses: Expense[], members: Member[]) {
  return useMemo(() => {
    // 1. Calculate net balances (Credit: Payer, Debit: Splitter)
    const balances: Record<string, number> = {};
    members.forEach(m => (balances[m.id] = 0));

    expenses.forEach(exp => {
      // Payer gets credit (+)
      if (balances[exp.payerId] !== undefined) {
          balances[exp.payerId] += exp.amount;
      }
      // Splitters get debt (-)
      if (exp.splits) {
         Object.entries(exp.splits).forEach(([memberId, splitAmount]) => {
            if (balances[memberId] !== undefined) {
               balances[memberId] -= splitAmount;
            }
         });
      }
    });

    // 2. Separate into debtors and creditors
    let debtors = Object.keys(balances).filter(id => balances[id] < -1).map(id => ({ id, amount: -balances[id] }));
    let creditors = Object.keys(balances).filter(id => balances[id] > 1).map(id => ({ id, amount: balances[id] }));

    // Sort by largest debts/credits first for efficient greedy matching
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const debts: Debt[] = [];

    // 3. Greedy algorithm to settle debts
    let i = 0; // debtors index
    let j = 0; // creditors index

    while (i < debtors.length && j < creditors.length) {
      let debtor = debtors[i];
      let creditor = creditors[j];

      let amountToSettle = Math.min(debtor.amount, creditor.amount);

      if (amountToSettle > 0) {
        debts.push({
          fromId: debtor.id,
          fromName: members.find(m => m.id === debtor.id)?.name || debtor.id,
          toId: creditor.id,
          toName: members.find(m => m.id === creditor.id)?.name || creditor.id,
          amount: amountToSettle
        });
      }

      debtor.amount -= amountToSettle;
      creditor.amount -= amountToSettle;

      if (debtor.amount < 1) i++;
      if (creditor.amount < 1) j++;
    }

    return { 
      netBalances: balances, 
      debts 
    };
  }, [expenses]);
}

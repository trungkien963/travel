export interface Member {
  id: string;
  name: string;
  isMe?: boolean;
  email?: string;
  phone?: string;
}

export interface Expense {
  id: string;
  desc: string;
  amount: number;
  payerId: string;
  date: string;
  splits?: Record<string, number>;
  receipts?: string[];
  receipt?: string;
}

export type SplitType = 'EQUALLY' | 'PERCENT' | 'FIXED';

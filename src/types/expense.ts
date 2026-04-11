export interface Member {
  id: string;
  tripId?: string;
  name: string;
  isMe?: boolean;
  avatar?: string;
  email?: string;
  phone?: string;
}

export interface Expense {
  id: string;
  tripId?: string;
  desc: string;
  amount: number;
  payerId: string;
  date: string;
  splits?: Record<string, number>;
  receipts?: string[];
  receipt?: string;
  category?: ExpenseCategory;
}

export type ExpenseCategory = 'FOOD' | 'TRANSPORT' | 'HOTEL' | 'ACTIVITIES' | 'SHOPPING' | 'OTHER';

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  FOOD: '#EF4444',      // Red
  TRANSPORT: '#3B82F6', // Blue
  HOTEL: '#8B5CF6',     // Purple
  ACTIVITIES: '#10B981',// Green
  SHOPPING: '#EC4899',  // Pink
  OTHER: '#9CA3AF'      // Gray
};

export type SplitType = 'EQUALLY' | 'PERCENT' | 'FIXED';
